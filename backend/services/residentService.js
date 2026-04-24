import { createReportService } from './report.service.js'

function createResidentService(repositories) {
  return createReportService(repositories);
}

export {
  createResidentService,
};
