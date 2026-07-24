const { body } = require("express-validator");

const createCommentValidation = [
  body("taskId").notEmpty().withMessage("taskId is required").isMongoId().withMessage("taskId must be a valid ID"),
  body("text").trim().notEmpty().withMessage("Comment text cannot be empty"),
];

module.exports = { createCommentValidation };