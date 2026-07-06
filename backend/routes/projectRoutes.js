const express = require("express");
const router = express.Router();
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect } = require("../middleware/auth");

// All project routes require a logged-in user
router.use(protect);

router.route("/").get(getProjects).post(createProject);

router.route("/:id").put(updateProject).delete(deleteProject);

module.exports = router;