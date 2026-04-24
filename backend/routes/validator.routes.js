import express from 'express'
import { getSettings, updateSettings } from '../controllers/validator.controller.js';
import { requireAuth} from '../middleware/auth.middleware.js'

const createValidatorRoutes = (services) => {
  const router = express.Router();

  router.get('/api/validator/settings', requireAuth(services), getSettings(services));
  router.put('/api/validator/settings', requireAuth(services), updateSettings(services));

  return router;
};

export { createValidatorRoutes };
