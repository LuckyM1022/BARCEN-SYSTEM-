const http = require('http');
const { MongoClient } = require('mongodb');
const {
  ATLAS_MONGODB_URI,
  AUTH_SECRET,
  DB_NAME,
  ENABLE_ATLAS_SYNC,
  FRONTEND_ORIGIN,
  PORT,
  PRIMARY_MONGODB_URI,
  SYNC_INTERVAL_MS,
} = require('./config/env');
const { AppError } = require('./lib/errors');
const { sendJson } = require('./lib/http');
const { createRepositories } = require('./repositories');
const { createRouter } = require('./routes');
const { createAtlasSyncService } = require('./services/atlasSyncService');
const { createServices } = require('./services');

async function startServer() {
  let db;
  let primaryClient;
  let server;
  let syncService;

  try {
    primaryClient = new MongoClient(PRIMARY_MONGODB_URI);
    await primaryClient.connect();
    db = primaryClient.db(DB_NAME);

    const repositories = createRepositories(db);
    syncService = createAtlasSyncService(repositories, {
      atlasUri: ATLAS_MONGODB_URI,
      dbName: DB_NAME,
      enabled: ENABLE_ATLAS_SYNC,
      intervalMs: SYNC_INTERVAL_MS,
    });
    const services = createServices(repositories, AUTH_SECRET, syncService);

    await services.bootstrap.initialize();
    await services.sync.start();

    const routeRequest = createRouter(services);
    server = http.createServer(async (request, response) => {
      if (request.method === 'OPTIONS') {
        sendJson(response, 200, {}, FRONTEND_ORIGIN);
        return;
      }

      try {
        const result = await routeRequest(request);
        sendJson(response, result.statusCode, result.body, FRONTEND_ORIGIN);
      } catch (error) {
        if (error instanceof AppError) {
          sendJson(response, error.statusCode, { message: error.message }, FRONTEND_ORIGIN);
          return;
        }

        sendJson(
          response,
          500,
          { message: 'Server error.', detail: error.message },
          FRONTEND_ORIGIN
        );
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Barcen API server running at http://0.0.0.0:${PORT}`);
      console.log(`MongoDB database: ${DB_NAME}`);
      console.log(`Primary database URI: ${PRIMARY_MONGODB_URI}`);
      console.log(
        `Atlas sync: ${ENABLE_ATLAS_SYNC && ATLAS_MONGODB_URI ? `enabled (${SYNC_INTERVAL_MS}ms interval)` : 'disabled'}`
      );
      console.log(`Allowed frontend origin: ${FRONTEND_ORIGIN}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB.');
    console.error('Check your backend/.env values and confirm the primary database is reachable.');
    console.error(`Tried: ${PRIMARY_MONGODB_URI}/${DB_NAME}`);
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
