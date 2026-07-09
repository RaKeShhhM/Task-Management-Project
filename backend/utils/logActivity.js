const ActivityLog = require("../models/ActivityLog");

// Called from controllers whenever something worth recording happens.
// `io` is passed in so we can broadcast the new entry live to anyone
// watching that project's Activity tab, without a page refresh.
const logActivity = async (io, projectId, userId, message) => {
  try {
    const entry = await ActivityLog.create({
      project: projectId,
      user: userId,
      message,
    });

    const populated = await entry.populate("user", "name");

    io.to(projectId.toString()).emit("activityLogged", populated);
  } catch (error) {
    // Activity logging is "nice to have" — never let a logging failure
    // break the actual task/project action that triggered it
    console.error("Failed to log activity:", error.message);
  }
};

module.exports = logActivity;