import { MongoClient } from 'mongodb';
import {
    ATLAS_MONGODB_URI,
    AUTH_SECRET,
    DB_NAME,
    ENABLE_ATLAS_SYNC,
    FRONTEND_ORIGIN,
    LEGACY_MONGODB_URI,
    LOCAL_FIRST_MODE,
    LOCAL_MONGODB_URI,
    PORT,
    PRIMARY_MONGODB_URI,
    SYNC_INTERVAL_MS,
} from './config/env.js'
import { createApp } from './app.js'
import { createRepositories } from './repositories/index.js'
import { createAtlasSyncService } from './services/atlasSyncService.js'
import { createServices } from './services/index.js'

function redactMongoUri(uri = '') {
  return uri.replace(/\/\/([^:/?#]+):([^@]+)@/u, '//$1:***@');
}

function getMongoConnectionCandidates() {
  const candidateUris = LOCAL_FIRST_MODE
    ? [PRIMARY_MONGODB_URI, LOCAL_MONGODB_URI, LEGACY_MONGODB_URI]
    : [PRIMARY_MONGODB_URI, LEGACY_MONGODB_URI, ATLAS_MONGODB_URI];

  return candidateUris.filter(
    (uri, index, values) => uri && values.indexOf(uri) === index
  );
}

async function connectToPrimaryDatabase() {
  const connectionCandidates = getMongoConnectionCandidates();
  const connectionErrors = [];

  for (const uri of connectionCandidates) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

    try {
      await client.connect();

      return {
        client,
        db: client.db(DB_NAME),
        usedUri: uri,
        attemptedUris: connectionCandidates,
      };
    } catch (error) {
      connectionErrors.push({
        message: error.message,
        uri,
      });

      await client.close().catch(() => {});
    }
  }

  const aggregateError = new Error(
    connectionErrors.map(({ uri, message }) => `${redactMongoUri(uri)} -> ${message}`).join('\n')
  );

  aggregateError.connectionErrors = connectionErrors;
  aggregateError.attemptedUris = connectionCandidates;

  throw aggregateError;
}

async function startServer() {
  let db;
  let primaryClient;
  let server;
  let syncService;
  let activePrimaryUri = PRIMARY_MONGODB_URI;

  try {
    const databaseConnection = await connectToPrimaryDatabase();
    primaryClient = databaseConnection.client;
    db = databaseConnection.db;
    activePrimaryUri = databaseConnection.usedUri;

    const atlasSyncEnabled =
      ENABLE_ATLAS_SYNC && Boolean(ATLAS_MONGODB_URI) && ATLAS_MONGODB_URI !== activePrimaryUri;

    const repositories = createRepositories(db, {
      enableSyncQueue: atlasSyncEnabled,
    });
    syncService = createAtlasSyncService(repositories, {
      atlasUri: ATLAS_MONGODB_URI,
      dbName: DB_NAME,
      enabled: atlasSyncEnabled,
      intervalMs: SYNC_INTERVAL_MS,
    });
    const services = createServices(repositories, AUTH_SECRET, syncService);

    await services.bootstrap.initialize();
    await services.sync.start();

    const app = createApp(services, FRONTEND_ORIGIN);

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Barcen API server running at http://0.0.0.0:${PORT}`);
      console.log(`MongoDB database: ${DB_NAME}`);
      console.log(`Primary database URI: ${redactMongoUri(activePrimaryUri)}`);
      if (activePrimaryUri !== PRIMARY_MONGODB_URI) {
        console.log(
          `Primary database fallback used instead of ${redactMongoUri(PRIMARY_MONGODB_URI)}`
        );
      }
      if (LOCAL_FIRST_MODE) {
        console.log('Storage mode: local-first primary database with optional Atlas sync');
      }
      console.log(
        `Atlas sync: ${atlasSyncEnabled ? `enabled (${SYNC_INTERVAL_MS}ms interval)` : 'disabled'}`
      );
      console.log(`Allowed frontend origin: ${FRONTEND_ORIGIN}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB.');
    console.error('Check your backend/.env values and confirm the primary database is reachable.');
    const attemptedUris = error.attemptedUris?.length
      ? error.attemptedUris
      : getMongoConnectionCandidates();
    console.error(`Attempted database URIs for ${DB_NAME}:`);
    attemptedUris.forEach((uri) => {
      console.error(`- ${redactMongoUri(uri)}`);
    });
    console.error(error.message);
    process.exit(1);
  }

  async function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down Barcen API...`);

    if (server) {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    }

    if (syncService) {
      await syncService.stop();
    }

    if (primaryClient) {
      await primaryClient.close();
    }

    process.exit(0);
  }

  process.once('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  });

  process.once('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  });
}

startServer();
