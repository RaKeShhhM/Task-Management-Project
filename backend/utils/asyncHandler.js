// Wraps an async route handler so any thrown error (or rejected promise)
// is automatically passed to next(), which routes it to our centralized
// error-handling middleware — instead of every controller needing its own
// try/catch block with a duplicated res.status(500).json(...) at the bottom.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;