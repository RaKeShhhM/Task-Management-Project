const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // A plain, human-readable description — simpler than modeling every action
    // as a rigid enum, and reads naturally in a feed: "moved 'Fix login bug' to Done"
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index: activity is always fetched per-project, sorted newest-first
activityLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);