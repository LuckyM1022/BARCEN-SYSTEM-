import { AppError } from '../lib/errors.js';

function errorHandler(error, request, response, next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    response.status(400).json({ message: 'Invalid JSON body.' });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({
    message: 'Server error.',
    detail: error.message,
  });
}

export {
  errorHandler,
};
