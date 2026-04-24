import express from 'express'
import {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getSettings,
  listRoles,
  listUsers,
  updateRole,
  updateSettings,
  updateUser,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js'

const createAdminRoutes = (services) => {
  const router = express.Router();
  const auth = requireAuth(services);

  router.get('/api/users', auth, listUsers(services));
  router.post('/api/users', auth, createUser(services));
  router.put('/api/users/:userId', auth, updateUser(services));
  router.delete('/api/users/:userId', auth, deleteUser(services));

  router.get('/api/admin/roles', auth, listRoles(services));
  router.post('/api/admin/roles', auth, createRole(services));
  router.put('/api/admin/roles/:roleId', auth, updateRole(services));
  router.delete('/api/admin/roles/:roleId', auth, deleteRole(services));

  router.get('/api/admin/settings', auth, getSettings(services));
  router.put('/api/admin/settings', auth, updateSettings(services));

  return router;
};

export { createAdminRoutes };
