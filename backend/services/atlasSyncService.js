import { MongoClient } from 'mongodb';

function isConnectivityError(error) {
  const errorMsg = String(error?.message || error).toLowerCase();
  return /ECONN|ENOTFOUND|EAI_AGAIN|timed out|server selection|ssl|tls/i.test(errorMsg);
}

function isRetryableError(error) {
  const errorMsg = String(error?.message || error).toLowerCase();
  return /ECONN|ENOTFOUND|EAI_AGAIN|timed out|server selection|ssl|tls|temporary|unavailable/i.test(errorMsg);
}

function createAtlasSyncService(repositories, options = {}) {
  const {
    atlasUri = '',
    dbName = 'barcen',
    enabled = false,
    intervalMs = 30000,
  } = options;

  let atlasClient = null;
  let atlasDb = null;
  let intervalId = null;
  let retryIntervalId = null;
  let lastError = null;
  let lastSyncAt = null;
  let syncInProgress = false;

  async function closeAtlasConnection() {
    if (!atlasClient) return;
    try {
      await atlasClient.close();
    } catch (error) {}
    atlasClient = null;
    atlasDb = null;
  }

  async function getAtlasDb() {
    if (atlasDb) return atlasDb;
    atlasClient = new MongoClient(atlasUri, { serverSelectionTimeoutMS: 5000 });
    await atlasClient.connect();
    atlasDb = atlasClient.db(dbName);
    return atlasDb;
  }

  async function listCollection(collectionName, sort = {}) {
    if (!enabled || !atlasUri) {
      return [];
    }

    try {
      const targetDb = await getAtlasDb();
      return await targetDb.collection(collectionName).find({}).sort(sort).toArray();
    } catch (error) {
      lastError = `Atlas read failed: ${error.message}`;

      if (isConnectivityError(error)) {
        await closeAtlasConnection();
        return [];
      }

      throw error;
    }
  }

  async function countCollection(collectionName, query = {}) {
    if (!enabled || !atlasUri) {
      return 0;
    }

    try {
      const targetDb = await getAtlasDb();
      return await targetDb.collection(collectionName).countDocuments(query);
    } catch (error) {
      lastError = `Atlas read failed: ${error.message}`;

      if (isConnectivityError(error)) {
        await closeAtlasConnection();
        return 0;
      }

      throw error;
    }
  }

  async function paginateCollection(collectionName, options = {}) {
    const {
      page = 0,
      pageSize = 10,
      query = {},
      sort = {},
    } = options;
    const normalizedPage = Math.max(0, Number(page) || 0);
    const normalizedPageSize = Math.max(1, Number(pageSize) || 10);

    if (!enabled || !atlasUri) {
      return {
        items: [],
        page: normalizedPage,
        pageSize: normalizedPageSize,
        totalCount: 0,
      };
    }

    try {
      const targetDb = await getAtlasDb();
      const collection = targetDb.collection(collectionName);
      const [items, totalCount] = await Promise.all([
        collection
          .find(query)
          .sort(sort)
          .skip(normalizedPage * normalizedPageSize)
          .limit(normalizedPageSize)
          .toArray(),
        collection.countDocuments(query),
      ]);

      return {
        items,
        page: normalizedPage,
        pageSize: normalizedPageSize,
        totalCount,
      };
    } catch (error) {
      lastError = `Atlas read failed: ${error.message}`;

      if (isConnectivityError(error)) {
        await closeAtlasConnection();
        return {
          items: [],
          page: normalizedPage,
          pageSize: normalizedPageSize,
          totalCount: 0,
        };
      }

      throw error;
    }
  }

  async function findOne(collectionName, query = {}, sort = {}) {
    if (!enabled || !atlasUri) {
      return null;
    }

    try {
      const targetDb = await getAtlasDb();
      return await targetDb.collection(collectionName).findOne(query, { sort });
    } catch (error) {
      lastError = `Atlas read failed: ${error.message}`;

      if (isConnectivityError(error)) {
        await closeAtlasConnection();
        return null;
      }

      throw error;
    }
  }

  async function applyQueueItem(item, targetDb) {
    const targetCollection = targetDb.collection(item.collectionName);
    if (item.action === 'delete') {
      await targetCollection.deleteOne({ _id: item.documentId });
      return;
    }
    await targetCollection.replaceOne(
      { _id: item.document._id },
      item.document,
      { upsert: true }
    );
  }

  async function markLocalDocumentSynced(collectionName, documentId, syncedAt) {
    if (collectionName === 'censusRecords') {
      await repositories.census.markAtlasSynced(documentId, syncedAt);
      return;
    }

    if (collectionName === 'residents') {
      await repositories.residents.markAtlasSynced(documentId, syncedAt);
    }
  }

  async function syncOnce() {
    if (!enabled || !atlasUri || syncInProgress) return;
    syncInProgress = true;
    let hasConnectivityError = false;

    try {
      const pendingItems = await repositories.syncQueue.findPending();
      if (!pendingItems.length) {
        lastError = null;
        return;
      }

      // Try to get Atlas connection
      let targetDb;
      try {
        targetDb = await getAtlasDb();
      } catch (error) {
        if (isConnectivityError(error)) {
          lastError = `Atlas connection failed: ${error.message}`;
          hasConnectivityError = true;
          return; // Don't process items if we can't connect at all
        }
        throw error;
      }

      // Process each pending item
      for (const item of pendingItems) {
        if (hasConnectivityError) break; // Stop if we had a connectivity issue

        try {
          await applyQueueItem(item, targetDb);
          if (item.action === 'upsert' && item.documentId) {
            await markLocalDocumentSynced(item.collectionName, item.documentId, new Date());
          }
          await repositories.syncQueue.remove(item._id);
          lastError = null;
          lastSyncAt = new Date();
        } catch (error) {
          const errorMsg = String(error.message || error);
          lastError = errorMsg;

          if (isConnectivityError(error)) {
            // Mark as failed but continue with other items for now
            await repositories.syncQueue.markFailed(item._id, errorMsg);
            hasConnectivityError = true;
            await closeAtlasConnection();
            break; // Stop processing on connectivity errors
          } else {
            // For non-connectivity errors, mark as failed and continue
            await repositories.syncQueue.markFailed(item._id, errorMsg);
          }
        }
      }
    } finally {
      syncInProgress = false;
    }
  }

  async function retryFailedItems() {
    if (!enabled || !atlasUri || syncInProgress) return;

    try {
      const failedItems = await repositories.syncQueue.findFailed();
      if (!failedItems.length) return;

      // Only retry items that failed due to connectivity issues
      const retryableItems = failedItems.filter(item =>
        item.errorMessage && isRetryableError(item.errorMessage)
      );

      if (!retryableItems.length) return;

      console.log(`Retrying ${retryableItems.length} failed sync items...`);

      // Reset failed items to pending for retry
      for (const item of retryableItems) {
        await repositories.syncQueue.resetToPending(item._id);
      }

      // Immediately try to sync the retried items
      await syncOnce();
    } catch (error) {
      console.error('Error during retry:', error.message);
    }
  }

  return {
    async start() {
      if (!enabled || !atlasUri) return;

      // Initial sync attempt
      await syncOnce().catch((error) => {
        lastError = String(error.message || error);
      });

      // Set up periodic sync
      intervalId = setInterval(() => {
        syncOnce().catch((error) => {
          lastError = String(error.message || error);
        });
      }, intervalMs);

      // Set up retry for failed items (every 5 minutes)
      // retryIntervalId = setInterval(() => {
      //   retryFailedItems().catch((error) => {
      //     console.error('Retry failed:', error.message);
      //   });
      // }, 5 * 60 * 1000); // 5 minutes
    },

    async stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (retryIntervalId) {
        clearInterval(retryIntervalId);
        retryIntervalId = null;
      }
      await closeAtlasConnection();
    },

    async getStatus() {
      const counts = await repositories.syncQueue.getStatusCounts();
      return {
        ...counts,
        atlasConfigured: Boolean(atlasUri),
        enabled,
        lastError,
        lastSyncAt,
        syncInProgress,
      };
    },

    listCollection,
    countCollection,
    findOne,
    paginateCollection,
    syncOnce,
  };
}

export { createAtlasSyncService };
