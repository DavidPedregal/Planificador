class AppError extends Error {
  constructor(code, statusHint, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusHint = statusHint;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super('VALIDATION_ERROR', 400, message);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super('NOT_FOUND', 404, message);
  }
}

class RepositoryError extends AppError {
  constructor(message) {
    super('REPOSITORY_ERROR', 500, message);
  }
}

module.exports = { AppError, ValidationError, NotFoundError };