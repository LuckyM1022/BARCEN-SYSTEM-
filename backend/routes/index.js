import {createAdminRoutes} from './admin.routes.js'
import {createAuthRoutes} from './auth.routes.js'
import { createDashboardRoutes }from './dashboard.routes.js'
import { createReportRoutes } from './report.routes.js';
import { createSyncRoutes  } from './sync.routes.js';
import { createSystemRoutes } from './system.routes.js';
import { createValidatorRoutes } from './validator.routes.js';

const registerRoutes = (app, services) => {
  app.use(createSystemRoutes());
  app.use(createAuthRoutes(services));
  app.use(createSyncRoutes(services));
  app.use(createAdminRoutes(services));
  app.use(createValidatorRoutes(services));
  app.use(createDashboardRoutes(services));
  app.use(createReportRoutes(services));
};

export { registerRoutes };
