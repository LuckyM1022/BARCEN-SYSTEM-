import { createAdminService } from './adminService.js'
import { createAuthService } from './authService.js';
import { createBootstrapService } from './bootstrapService.js'
import { createDashboardService } from './dashboardService.js';
import { createReportService } from './report.service.js';
import { createResidentService } from './residentService.js';
import { createValidatorService } from './validatorService.js';

function createServices(repositories, authSecret, syncService) {
  const reportService = createReportService(repositories, syncService);

  return {
    admin: createAdminService(repositories),
    auth: createAuthService(repositories, authSecret),
    bootstrap: createBootstrapService(repositories),
    dashboard: createDashboardService(repositories, syncService),
    reports: reportService,
    residents: reportService || createResidentService(repositories),
    sync: syncService,
    validator: createValidatorService(repositories),
  };
}

export {
  createServices,
};
