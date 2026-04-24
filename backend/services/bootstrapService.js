import { demoAdminSettings, demoResidents, demoRoles, demoUsers, demoValidatorSettings } from '../lib/demoData.js'
import { hashPassword, isPasswordHashed } from '../lib/security.js'

function createBootstrapService(repositories) {
  return {
    async initialize() {
      await Promise.all([
        repositories.users.createIndexes(),
        repositories.residents.createIndexes(),
        repositories.census.createIndexes(),
        repositories.roles.createIndexes(),
        repositories.settings.createIndexes(),
        repositories.syncQueue.createIndexes(),
      ]);

      await this.seedDatabase();
      await this.migrateLegacyPasswords();
    },

    async seedDatabase() {
      const userCount = await repositories.users.countAll();
      if (userCount === 0) {
        const seededUsers = await Promise.all(demoUsers.map(async (user) => ({
          ...user,
          password: await hashPassword(user.password),
          createdAt: new Date(),
        })));

        await repositories.users.insertMany(seededUsers);
      }

      const residentCount = await repositories.residents.countAll();
      if (residentCount === 0) {
        await repositories.residents.insertMany(demoResidents);
      }

      const roleCount = await repositories.roles.countAll();
      if (roleCount === 0) {
        await repositories.roles.insertMany(demoRoles);
      }

      const settingsCount = await repositories.settings.countAll();
      if (settingsCount === 0) {
        await repositories.settings.insertMany([demoAdminSettings, demoValidatorSettings]);
      }
    },

    async migrateLegacyPasswords() {
      const users = await repositories.users.findAllRaw();

      await Promise.all(users.map(async (user) => {
        if (isPasswordHashed(user.password)) {
          return;
        }

        await repositories.users.updatePassword(user._id, await hashPassword(user.password || 'changeme123'));
      }));
    },

  };
}

export {
  createBootstrapService,
};
