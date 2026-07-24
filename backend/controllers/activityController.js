const ActivityLog = require("../models/ActivityLog");
const asyncHandler = require("../utils/asyncHandler");

// @route   GET /api/activity/project/:projectId
// @access  Private
const getActivityForProject = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find({ project: req.params.projectId })
    .populate("user", "name")
    .sort({ createdAt: -1 }) // newest first, like a real activity feed
    .limit(50); // cap it — nobody needs to scroll through thousands of entries

  res.status(200).json(logs);
});

module.exports = { getActivityForProject };