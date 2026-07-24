// Catches requests to routes that don't exist at all (e.g. a typo'd URL).
// Must be registered AFTER all real routes, but BEFORE errorHandler.
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// The single place that formats every error response in the app.
// Any error passed to next(err) — whether thrown inside an asyncHandler-wrapped
// controller, a bad Mongoose ObjectId cast, or the notFound handler above —
// ends up here.
const errorHandler = (err, req, res, next) => {
  // Mongoose throws a CastError when given a malformed ObjectId (e.g. a
  // truncated or invalid :id in the URL) — treat that as a 400, not a 500
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate-key error (e.g. registering with an email already in use,
  // if it ever slips past our own explicit check)
  if (err.code === 11000) {
    statusCode = 400;
    message = "A record with that value already exists";
  }

  res.status(statusCode).json({
    message,
    // Stack traces are useful in development but should never leak to users
    // or be visible in production API responses
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };