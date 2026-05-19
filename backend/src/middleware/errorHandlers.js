function notFoundHandler(req, res) {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Central error handler.
function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // eslint-disable-next-line no-console
  console.error("API error:", err);

  return res.status(status).json({
    message,
    // In production you'd hide this. Keeping it helpful for beginners.
    details: err.details,
  });
}

module.exports = { notFoundHandler, errorHandler };

