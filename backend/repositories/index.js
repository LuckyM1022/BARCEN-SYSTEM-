const { createCensusRepository } = require('./censusRepository');
const { createResidentsRepository } = require('./residentsRepository');
const { createRolesRepository } = require('./rolesRepository');
const { createSettingsRepository } = require('./settingsRepository');
const { createSyncQueueRepository } = require('./syncQueueRepository');
const { createUsersRepository } = require('./usersRepository');

function createNoopSyncQueueRepository() {
  return {
    async createIndexes() {},
    async queueUpsert() {},
    async queueDelete() {},
    async remove() {},
    async markFailed() {},
    async resetToPending() {},
    async getStatusCounts() {
      return {
        failedCount: 0,
        pendingCount: 0,
      };
    },
    findFailed() {
      return [];
    },
    findPending() {
      return [];
    },
  };
}

function createRepositories(db, options = {}) {
  const { enableSyncQueue = true } = options;
  const syncQueue = enableSyncQueue ? createSyncQueueRepository(db) : createNoopSyncQueueRepository();

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
