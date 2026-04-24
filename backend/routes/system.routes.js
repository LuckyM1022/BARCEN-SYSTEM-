import express from 'express'
import { getApiRoot, getHealth, getRoot } from '../controllers/system.controller.js';

const createSystemRoutes = () => {
  const router = express.Router();

  router.get('/api', getApiRoot);
  router.get('/api/health', getHealth);

  return router;
};

export { createSystemRoutes };
