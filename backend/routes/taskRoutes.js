const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  runDueDateReminders,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");
const { requireProjectAccess, requireTaskProjectAccess } = require("../middleware/projectAccess");
const validate = require("../middleware/validate");
const { createTaskValidation, updateTaskValidation } = require("../validators/taskValidators");

router.use(protect);

router.post("/", createTaskValidation, validate, requireProjectAccess((req) => req.body.projectId), createTask);
router.get("/project/:id", requireProjectAccess((req) => req.params.id), getTasksByProject);

// Manual trigger for the due-date reminder job — not tied to one project,
// so no requireProjectAccess check, just needs to be logged in. Mainly for
// testing/demoing the reminder system without waiting for the daily schedule.
router.post("/reminders/run", runDueDateReminders);
router
  .route("/:id")
  .put(requireTaskProjectAccess((req) => req.params.id), updateTaskValidation, validate, updateTask)
  .delete(requireTaskProjectAccess((req) => req.params.id), deleteTask);

module.exports = router;