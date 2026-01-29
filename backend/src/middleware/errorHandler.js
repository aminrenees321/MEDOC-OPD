/**
 * Central error handling middleware.
 */

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const isOperational = status >= 400 && status < 500;

  if (!isOperational) {
    console.error('Error:', err);
  }

  res.status(typeof status === 'number' ? status : 500).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/** Wrap async route handlers to pass errors to errorHandler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Create operational error with statusCode. */
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, asyncHandler, createError };
