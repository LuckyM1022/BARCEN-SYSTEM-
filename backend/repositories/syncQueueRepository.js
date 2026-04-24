import { ObjectId } from "mongodb";

function normalizeDocumentId(value) {
  if (value instanceof ObjectId) {
    return value;
  }

  if (ObjectId.isValid(value) && String(new ObjectId(value)) === String(value)) {
    return new ObjectId(value);
  }

  return value;
}

function createEntityKey(collectionName, documentId) {
  return `${collectionName}:${String(documentId)}`;
}

function createSyncQueueRepository(db) {
  const collection = db.collection('syncQueue');

  return {
    async createIndexes() {
      await collection.createIndex({ entityKey: 1 }, { unique: true });
      await collection.createIndex({ status: 1, updatedAt: -1 });
    },

    async queueUpsert(collectionName, document) {
      const documentId = normalizeDocumentId(document._id);
      const now = new Date();

      await collection.updateOne(
        { entityKey: createEntityKey(collectionName, documentId) },
        {
          $set: {
            action: 'upsert',
            collectionName,
            document: {
              ...document,
              _id: documentId,
            },
            documentId,
            entityKey: createEntityKey(collectionName, documentId),
            error: null,
            status: 'pending',
            updatedAt: now,
          },
          $setOnInsert: {
            attempts: 0,
            createdAt: now,
          },
        },
        { upsert: true }
      );
    },

    async queueDelete(collectionName, documentId) {
      const normalizedId = normalizeDocumentId(documentId);
      const now = new Date();

      await collection.updateOne(
        { entityKey: createEntityKey(collectionName, normalizedId) },
        {
          $set: {
            action: 'delete',
            collectionName,
            document: null,
            documentId: normalizedId,
            entityKey: createEntityKey(collectionName, normalizedId),
            error: null,
            status: 'pending',
            updatedAt: now,
          },
          $setOnInsert: {
            attempts: 0,
            createdAt: now,
          },
        },
        { upsert: true }
      );
    },

    findPending(limit = 100) {
      return collection
        .find({ status: { $in: ['pending', 'failed'] } })
        .sort({ updatedAt: 1 })
        .limit(limit)
        .toArray();
    },

    findFailed(limit = 50) {
      return collection
        .find({ status: 'failed' })
        .sort({ updatedAt: 1 })
        .limit(limit)
        .toArray();
    },

    async remove(queueId) {
      await collection.deleteOne({ _id: new ObjectId(queueId) });
    },

    async markFailed(queueId, error) {
      await collection.updateOne(
        { _id: new ObjectId(queueId) },
        {
          $inc: { attempts: 1 },
          $set: {
            error: String(error || 'Unknown Atlas sync error.'),
            status: 'failed',
            updatedAt: new Date(),
          },
        }
      );
    },

    async resetToPending(queueId) {
      await collection.updateOne(
        { _id: new ObjectId(queueId) },
        {
          $set: {
            error: null,
            status: 'pending',
            updatedAt: new Date(),
          },
        }
      );
    },

    async getStatusCounts() {
      const [pendingCount, failedCount] = await Promise.all([
        collection.countDocuments({ status: 'pending' }),
        collection.countDocuments({ status: 'failed' }),
      ]);

      return {
        failedCount,
        pendingCount,
      };
    },
  };
}

export {
  createSyncQueueRepository,
};
