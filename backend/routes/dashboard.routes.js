import express from 'express'
import { getStats } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js'

const createDashboardRoutes = (services) => {
  const router = express.Router();

  router.get('/api/dashboard/stats', requireAuth(services), getStats(services));

  return router;
};

export { createDashboardRoutes };
