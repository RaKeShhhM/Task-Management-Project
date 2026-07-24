const { validationResult } = require("express-validator");

// Place this AFTER a list of express-validator check(...) chains on a route.
// If any of those checks failed, this collects them into one clean response
// instead of letting a bad request reach the controller at all.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg, // show the first error as the headline message
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;