const express = require("express");
const router = express.Router();
const { getActivityForProject } = require("../controllers/activityController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/project/:projectId", getActivityForProject);

module.exports = router;