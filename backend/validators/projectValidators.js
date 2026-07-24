const { body } = require("express-validator");

const createProjectValidation = [
  body("title").trim().notEmpty().withMessage("Project title is required"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("dueDate").optional({ values: "falsy" }).isISO8601().withMessage("Due date must be a valid date"),
];

const updateProjectValidation = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("dueDate").optional({ values: "falsy" }).isISO8601().withMessage("Due date must be a valid date"),
];

const addMemberValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("role").optional().isIn(["admin", "member"]).withMessage("Role must be admin or member"),
];

module.exports = { createProjectValidation, updateProjectValidation, addMemberValidation };