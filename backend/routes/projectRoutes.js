const express = require("express");
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
} = require("../controllers/projectController");
const { protect } = require("../middleware/auth");

// All project routes require a logged-in user
router.use(protect);

router.route("/").get(getProjects).post(createProject);

router.route("/:id").get(getProjectById).put(updateProject).delete(deleteProject);

router.post("/:id/members", addMember);
router.put("/:id/members/:userId", updateMemberRole);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;