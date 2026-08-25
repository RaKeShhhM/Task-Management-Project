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
const { requireProjectAccess } = require("../middleware/projectAccess");
const validate = require("../middleware/validate");
const {
  createProjectValidation,
  updateProjectValidation,
  addMemberValidation,
} = require("../validators/projectValidators");

// All project routes require a logged-in user
router.use(protect);

router.route("/").get(getProjects).post(createProjectValidation, validate, createProject);

router
  .route("/:id")
  .get(requireProjectAccess((req) => req.params.id), getProjectById)
  .put(requireProjectAccess((req) => req.params.id), updateProjectValidation, validate, updateProject)
  .delete(requireProjectAccess((req) => req.params.id), deleteProject);

router.post("/:id/members", requireProjectAccess((req) => req.params.id), addMemberValidation, validate, addMember);
router.put("/:id/members/:userId", requireProjectAccess((req) => req.params.id), updateMemberRole);
router.delete("/:id/members/:userId", requireProjectAccess((req) => req.params.id), removeMember);

module.exports = router;
