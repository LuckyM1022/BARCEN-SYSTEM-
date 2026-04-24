import { createCensusRepository } from './censusRepository.js';
import { createResidentsRepository } from './residentsRepository.js';
import { createRolesRepository } from './rolesRepository.js';
import { createSettingsRepository } from './settingsRepository.js';
import { createSyncQueueRepository } from './syncQueueRepository.js';
import { createUsersRepository } from './usersRepository.js';

const createNoopSyncQueueRepository = () => {
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
};

export const createRepositories = (db, options = {}) => {
  const { enableSyncQueue = true } = options;
  const syncQueue = enableSyncQueue ? createSyncQueueRepository(db) : createNoopSyncQueueRepository();

  return {
    census: createCensusRepository(db, syncQueue),
    residents: createResidentsRepository(db, syncQueue),
    roles: createRolesRepository(db, syncQueue),
    settings: createSettingsRepository(db, syncQueue),
    syncQueue,
    users: createUsersRepository(db, syncQueue),
  };
};
