const { URL } = require('url');
const { AppError } = require('../lib/errors');
const { readJson } = require('../lib/http');

function createRouter(services) {
  return async function routeRequest(request) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const { pathname } = url;

    const { currentUser } = await services.auth.authenticateRequest(request, pathname);

    if (request.method === 'GET' && pathname === '/') {
      return {
        statusCode: 200,
        body: {
          status: 'ok',
          service: 'barcen-api',
          message: 'Barcen API is running. Use /api/health to verify service status.',
        },
      };
    }

    if (request.method === 'GET' && pathname === '/api') {
      return {
        statusCode: 200,
        body: {
          status: 'ok',
          service: 'barcen-api',
          message: 'API namespace is available.',
        },
      };
    }

    if (request.method === 'GET' && pathname === '/api/health') {
      return {
        statusCode: 200,
        body: {
          status: 'ok',
          service: 'barcen-api',
        },
      };
    }

    if (request.method === 'GET' && pathname === '/api/sync/status') {
      return {
        statusCode: 200,
        body: await services.sync.getStatus(),
      };
    }

    if (request.method === 'POST' && pathname === '/api/auth/login') {
      return {
        statusCode: 200,
        body: await services.auth.login(await readJson(request)),
      };
    }

    if (request.method === 'POST' && pathname === '/api/auth/register') {
      return {
        statusCode: 201,
        body: await services.auth.register(await readJson(request)),
      };
    }

    if (request.method === 'GET' && pathname === '/api/users') {
      return { statusCode: 200, body: await services.admin.listUsers() };
    }

    if (request.method === 'POST' && pathname === '/api/users') {
      return { statusCode: 201, body: await services.admin.createUser(await readJson(request)) };
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/users/')) {
      return {
        statusCode: 200,
        body: await services.admin.updateUser(pathname.replace('/api/users/', ''), await readJson(request)),
      };
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/users/')) {
      return {
        statusCode: 200,
        body: await services.admin.deleteUser(pathname.replace('/api/users/', '')),
      };
    }

    if (request.method === 'GET' && pathname === '/api/admin/roles') {
      return { statusCode: 200, body: await services.admin.listRoles() };
    }

    if (request.method === 'POST' && pathname === '/api/admin/roles') {
      return { statusCode: 201, body: await services.admin.createRole(await readJson(request)) };
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/admin/roles/')) {
      return {
        statusCode: 200,
        body: await services.admin.updateRole(pathname.replace('/api/admin/roles/', ''), await readJson(request)),
      };
    }

    if (request.method === 'GET' && pathname === '/api/admin/settings') {
      return { statusCode: 200, body: await services.admin.getAdminSettings() };
    }

    if (request.method === 'PUT' && pathname === '/api/admin/settings') {
      return { statusCode: 200, body: await services.admin.updateAdminSettings(await readJson(request)) };
    }

    if (request.method === 'GET' && pathname === '/api/validator/settings') {
      return { statusCode: 200, body: await services.validator.getSettings() };
    }

    if (request.method === 'PUT' && pathname === '/api/validator/settings') {
      return { statusCode: 200, body: await services.validator.updateSettings(await readJson(request)) };
    }

    if (request.method === 'GET' && pathname === '/api/dashboard/stats') {
      return { statusCode: 200, body: await services.dashboard.getStats() };
    }

    if (request.method === 'GET' && pathname === '/api/residents') {
      return { statusCode: 200, body: await services.residents.listResidents() };
    }

    if (request.method === 'POST' && pathname === '/api/residents') {
      return {
        statusCode: 201,
        body: await services.residents.createResident(await readJson(request), currentUser),
      };
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/residents/')) {
      return {
        statusCode: 200,
        body: await services.residents.deleteResident(pathname.replace('/api/residents/', '')),
      };
    }

    if (request.method === 'GET' && pathname === '/api/census-records') {
      return { statusCode: 200, body: await services.residents.listCensusRecords() };
    }

    if (request.method === 'POST' && pathname === '/api/census-records') {
      return {
        statusCode: 201,
        body: await services.residents.createCensusRecord(await readJson(request), currentUser),
      };
    }

    throw new AppError(404, 'API route not found.');
  };
}

module.exports = {
  createRouter,
};
