import express from 'express'
import {
  createCensusRecord,
  createResident,
  deleteResident,
  listCensusRecords,
  listResidents,
} from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js'

const createReportRoutes = (services) => {
  const router = express.Router();
  const auth = requireAuth(services);

  router.get('/api/residents', auth, listResidents(services));
  router.post('/api/residents', auth, createResident(services));
  router.delete('/api/residents/:residentId', auth, deleteResident(services));

  router.get('/api/census-records', auth, listCensusRecords(services));
  router.post('/api/census-records', auth, createCensusRecord(services));

  return router;
};

export { createReportRoutes };
