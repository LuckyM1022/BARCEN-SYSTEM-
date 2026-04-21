const { AppError } = require('../lib/errors');
const { publicUser, serializeDocument } = require('../lib/serializers');
const { hashPassword } = require('../lib/security');
const { isValidObjectId, sanitizeRolePayload, sanitizeUserPayload } = require('../lib/validators');

function createAdminService(repositories) {
  return {
    async listUsers() {
      const users = await repositories.users.findAll();
      return { users: users.map(publicUser) };
    },

    async createUser(body) {
      const user = sanitizeUserPayload(body);
      const password = String(body.password || '').trim();

      if (!user.name || !user.email || !user.role || !password) {
        throw new AppError(400, 'Name, email, role, and password are required.');
      }

      const emailExists = await repositories.users.findByEmail(user.email);
      if (emailExists) {
        throw new AppError(409, 'A user with that email already exists.');
      }

      const hashedPassword = await hashPassword(password);
      const result = await repositories.users.insertOne({
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
      });

      return { user: publicUser({ _id: result.insertedId, ...user, password: hashedPassword }) };
    },

    async updateUser(userId, body) {
      if (!isValidObjectId(userId)) {
        throw new AppError(400, 'Invalid user id.');
      }

      const updates = sanitizeUserPayload(body);
      const password = String(body.password || '').trim();

      if (!updates.name || !updates.email || !updates.role) {
        throw new AppError(400, 'Name, email, and role are required.');
      }

      const duplicateUser = await repositories.users.findByEmailExcludingId(updates.email, userId);
      if (duplicateUser) {
        throw new AppError(409, 'Another user already uses that email.');
      }

      const nextValues = password ? { ...updates, password: await hashPassword(password) } : updates;
      const result = await repositories.users.updateOne(userId, nextValues);

      if (!result) {
        throw new AppError(404, 'User not found.');
      }

      return { user: publicUser(result) };
    },

    async deleteUser(userId) {
      if (!isValidObjectId(userId)) {
        throw new AppError(400, 'Invalid user id.');
      }

      const result = await repositories.users.deleteOne(userId);
      if (!result.deletedCount) {
        throw new AppError(404, 'User not found.');
      }

      return { message: 'User removed.' };
    },

    async listRoles() {
      const roles = await repositories.roles.findAll();
      return { roles: roles.map(serializeDocument) };
    },

    async createRole(body) {
      const role = sanitizeRolePayload(body);

      if (!role.name || !role.access) {
        throw new AppError(400, 'Role name and access description are required.');
      }

      const existingRole = await repositories.roles.findByName(role.name);
      if (existingRole) {
        throw new AppError(409, 'A role with that name already exists.');
      }

      const result = await repositories.roles.insertOne(role);
      return { role: serializeDocument({ _id: result.insertedId, ...role }) };
    },

    async updateRole(roleId, body) {
      if (!isValidObjectId(roleId)) {
        throw new AppError(400, 'Invalid role id.');
      }

      const role = sanitizeRolePayload(body);

      if (!role.name || !role.access) {
        throw new AppError(400, 'Role name and access description are required.');
      }

      const duplicateRole = await repositories.roles.findByNameExcludingId(role.name, roleId);
      if (duplicateRole) {
        throw new AppError(409, 'Another role already uses that name.');
      }

      const result = await repositories.roles.updateOne(roleId, role);
      if (!result) {
        throw new AppError(404, 'Role not found.');
      }

      return { role: serializeDocument(result) };
    },

    async getAdminSettings() {
      const settings = await repositories.settings.findByScope('admin');
      return { settings: serializeDocument(settings) };
    },

    async updateAdminSettings(body) {
      const updates = {
        emailNotifications: Boolean(body.emailNotifications),
        certificateApproval: Boolean(body.certificateApproval),
        maintenanceMode: Boolean(body.maintenanceMode),
      };

      const settings = await repositories.settings.updateByScope('admin', updates);
      return { settings: serializeDocument(settings) };
    },
  };
}

module.exports = {
  createAdminService,
};
