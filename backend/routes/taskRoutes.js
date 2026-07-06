const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/", createTask);
router.get("/project/:id", getTasksByProject);
router.route("/:id").put(updateTask).delete(deleteTask);

module.exports = router;