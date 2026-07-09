const ActivityLog = require("../models/ActivityLog");

// @route   GET /api/activity/project/:projectId
// @access  Private
const getActivityForProject = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ project: req.params.projectId })
      .populate("user", "name")
      .sort({ createdAt: -1 }) // newest first, like a real activity feed
      .limit(50); // cap it — nobody needs to scroll through thousands of entries

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getActivityForProject };