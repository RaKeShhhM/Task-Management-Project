const express = require("express");
const router = express.Router();
const { getActivityForProject } = require("../controllers/activityController");
const { protect } = require("../middleware/auth");
const { requireProjectAccess } = require("../middleware/projectAccess");

router.use(protect);

router.get("/project/:projectId", requireProjectAccess((req) => req.params.projectId), getActivityForProject);

module.exports = router;
