import express from 'express'
import { login, register, updatePassword, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const createAuthRoutes = (services) => {
  const router = express.Router();
  const auth = requireAuth(services);

  router.post('/api/auth/login', login(services));
  router.post('/api/auth/register', register(services));
  router.put('/api/auth/profile', auth, updateProfile(services));
  router.put('/api/auth/password', auth, updatePassword(services));

  return router;
};

export { createAuthRoutes };
