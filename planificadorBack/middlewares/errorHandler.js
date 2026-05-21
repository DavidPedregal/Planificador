const { AppError } = require('../errors/AppError');

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusHint).json({
      error: err.code,
      message: err.message,
    });
  }

  // El 404 de createError llega aquí
  if (err.status) {
    return res.status(err.status).json({
      error: 'HTTP_ERROR',
      message: err.message,
    });
  }

  // console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'api.error.internal' });
};

module.exports = { errorHandler };