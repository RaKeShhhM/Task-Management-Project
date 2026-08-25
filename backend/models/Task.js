const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["ToDo", "InProgress", "Done"], // Kanban columns
      default: "ToDo",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Set to a copy of `dueDate` after a reminder email is sent for it.
    // If the task is rescheduled, this stops matching the new dueDate,
    // so it naturally becomes eligible for a fresh reminder.
    remindedForDueDate: {
      type: Date,
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    owner: {
      // person who created the task — only they can delete it
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignee: {
      // person the task is assigned to — they (or owner) can update it
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes — speed up the most common query patterns:
// project+status covers Kanban board loads and column filtering
taskSchema.index({ project: 1, status: 1 });
// priority and dueDate support filtering and overdue detection
taskSchema.index({ project: 1, priority: 1 });
taskSchema.index({ project: 1, dueDate: 1 });
// assignee index covers "my tasks" views
taskSchema.index({ assignee: 1 });

module.exports = mongoose.model("Task", taskSchema);