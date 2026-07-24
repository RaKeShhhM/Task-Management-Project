const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createTaskValidation, updateTaskValidation } = require("../validators/taskValidators");

router.use(protect);

router.post("/", createTaskValidation, validate, createTask);
router.get("/project/:id", getTasksByProject);
router.route("/:id").put(updateTaskValidation, validate, updateTask).delete(deleteTask);

module.exports = router;