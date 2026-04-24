export class AppError extends Error {
  constructor(statusCode, message, detail) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detail = detail;
  }
}
