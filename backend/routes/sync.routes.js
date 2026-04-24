import express from 'express'
import { getStatus } from '../controllers/sync.controller.js';

const createSyncRoutes = (services) => {
  const router = express.Router();

  router.get('/api/sync/status', getStatus(services));

  return router;
};

export { createSyncRoutes };
