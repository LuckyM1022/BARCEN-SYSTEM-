const { createCensusRepository } = require('./censusRepository');
const { createResidentsRepository } = require('./residentsRepository');
const { createRolesRepository } = require('./rolesRepository');
const { createSettingsRepository } = require('./settingsRepository');
const { createSyncQueueRepository } = require('./syncQueueRepository');
const { createUsersRepository } = require('./usersRepository');

function createRepositories(db) {
  const syncQueue = createSyncQueueRepository(db);

  return {
    census: createCensusRepository(db, syncQueue),
    residents: createResidentsRepository(db, syncQueue),
    roles: createRolesRepository(db),
    settings: createSettingsRepository(db),
    syncQueue,
    users: createUsersRepository(db),
  };
}

module.exports = {
  createRepositories,
};
