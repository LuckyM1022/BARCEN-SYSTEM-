const { AppError } = require('../lib/errors');
const { publicUser } = require('../lib/serializers');
const { isValidObjectId } = require('../lib/validators');
const {
  createAuthToken,
  hashPassword,
  isPasswordHashed,
  verifyAuthToken,
  verifyPassword,
} = require('../lib/security');

function createAuthService(repositories, authSecret) {
  return {
    getRequiredRoles(method, pathname) {
      if (pathname === '/api/health' || pathname === '/api/auth/login' || pathname === '/api/auth/register' || pathname === '/api/sync/status') {
        return null;
      }

      if (pathname.startsWith('/api/users') || pathname.startsWith('/api/admin/roles') || pathname === '/api/admin/settings') {
        return ['Admin'];
      }

      if (
        pathname === '/api/validator/settings' ||
        pathname === '/api/dashboard/stats' ||
        pathname === '/api/residents' ||
        pathname.startsWith('/api/residents/')
      ) {
        return ['Admin', 'Personnel / Validator'];
      }

      if (pathname === '/api/census-records') {
        return method === 'GET'
          ? ['Admin', 'Personnel / Validator']
          : ['Admin', 'Personnel / Validator', 'Census Taker'];
      }

      if (pathname.startsWith('/api/')) {
        return ['Admin', 'Personnel / Validator', 'Census Taker'];
      }

      return null;
    },

    extractBearerToken(request) {
      const header = request.headers.authorization || '';
      const [scheme, token] = header.split(' ');

      if (scheme !== 'Bearer' || !token) {
        return null;
      }

      return token;
    },

    async authenticateRequest(request, pathname) {
      const requiredRoles = this.getRequiredRoles(request.method, pathname);

      if (!requiredRoles) {
        return { currentUser: null };
      }

      const token = this.extractBearerToken(request);
      const payload = verifyAuthToken(token, authSecret);

      if (!payload || !payload.sub || !isValidObjectId(payload.sub)) {
        throw new AppError(401, 'Authentication required.');
      }

      const user = await repositories.users.findById(payload.sub);

      if (!user) {
        throw new AppError(401, 'Session is no longer valid.');
      }

      if (!requiredRoles.includes(user.role)) {
        throw new AppError(403, 'You do not have permission for this action.');
      }

      return { currentUser: publicUser(user) };
    },

    async login(credentials) {
      const email = String(credentials.email || '').trim().toLowerCase();
      const password = String(credentials.password || '');
      const user = await repositories.users.findByEmail(email);

      if (!user || !(await verifyPassword(password, user.password))) {
        throw new AppError(401, 'Invalid email or password.');
      }

      if (!isPasswordHashed(user.password)) {
        const upgradedPassword = await hashPassword(password);
        await repositories.users.updatePassword(user._id, upgradedPassword);
        user.password = upgradedPassword;
      }

      const safeUser = publicUser(user);

      return {
        token: createAuthToken(safeUser, authSecret),
        user: safeUser,
      };
    },

    async register(payload) {
      if (!payload.email || !payload.firstName || !payload.lastName || !payload.password) {
        throw new AppError(400, 'Email, first name, last name, and password are required.');
      }

      if (payload.password !== payload.confirmPassword) {
        throw new AppError(400, 'Password and confirm password do not match.');
      }

      const email = String(payload.email).toLowerCase();
      const existingUser = await repositories.users.findByEmail(email);

      if (existingUser) {
        throw new AppError(409, 'An account with this email already exists.');
      }

      const user = {
        name: [payload.firstName, payload.middleName, payload.lastName].filter(Boolean).join(' '),
        email,
        password: await hashPassword(payload.password),
        phoneNumber: payload.phoneNumber || '',
        role: 'Census Taker',
        createdAt: new Date(),
      };

      const result = await repositories.users.insertOne(user);
      const safeUser = publicUser({ _id: result.insertedId, ...user });

      return {
        token: createAuthToken(safeUser, authSecret),
        user: safeUser,
      };
    },
  };
}

module.exports = {
  createAuthService,
};
