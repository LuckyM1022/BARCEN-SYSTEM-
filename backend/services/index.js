const { createAdminService } = require('./adminService');
const { createAuthService } = require('./authService');
const { createBootstrapService } = require('./bootstrapService');
const { createDashboardService } = require('./dashboardService');
const { createResidentService } = require('./residentService');
const { createValidatorService } = require('./validatorService');

function createServices(repositories, authSecret, syncService) {
  return {
    admin: createAdminService(repositories),
    auth: createAuthService(repositories, authSecret),
    bootstrap: createBootstrapService(repositories),
    dashboard: createDashboardService(repositories),
    residents: createResidentService(repositories),
    sync: syncService,
    validator: createValidatorService(repositories),
  };
}

module.exports = {
  createServices,
};
