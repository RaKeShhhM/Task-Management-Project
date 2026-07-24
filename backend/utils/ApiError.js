// A regular Error, but with a `statusCode` attached — lets controllers do
// `throw new ApiError(404, "Task not found")` instead of manually calling
// res.status(404).json(...) everywhere. The centralized error middleware
// reads statusCode off of this to build the response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;