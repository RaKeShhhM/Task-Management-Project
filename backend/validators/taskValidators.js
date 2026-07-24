const { body } = require("express-validator");

const createTaskValidation = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("projectId").notEmpty().withMessage("projectId is required").isMongoId().withMessage("projectId must be a valid ID"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("dueDate").optional({ values: "falsy" }).isISO8601().withMessage("Due date must be a valid date"),
  body("assignee").optional({ values: "falsy" }).isMongoId().withMessage("assignee must be a valid user ID"),
];

const updateTaskValidation = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("status")
    .optional()
    .isIn(["ToDo", "InProgress", "Done"])
    .withMessage("Status must be ToDo, InProgress, or Done"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("dueDate").optional({ values: "falsy" }).isISO8601().withMessage("Due date must be a valid date"),
  body("assignee").optional({ values: "falsy" }).isMongoId().withMessage("assignee must be a valid user ID"),
];

module.exports = { createTaskValidation, updateTaskValidation };