import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from './lib/errors.js';
import { createCorsMiddleware } from './middleware/cors.middleware.js';
import { errorHandler } from './middleware/error.middleware.js'
import { registerRoutes } from './routes/index.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendBuildPath = path.resolve(__dirname, '..', 'frontend', 'build');

const createApp = (services, frontendOrigin) => {
  const app = express();

  app.use(express.json());
  app.use(createCorsMiddleware(frontendOrigin));

  registerRoutes(app, services);
  app.use('/api', (request, response, next) => {
    next(new AppError(404, 'API route not found.'));
  });

  app.use(express.static(frontendBuildPath));
  app.get(/^(?!\/api(?:\/|$)).*/, (request, response) => {
    response.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

  app.use(errorHandler);

  return app;
};

export { createApp };
