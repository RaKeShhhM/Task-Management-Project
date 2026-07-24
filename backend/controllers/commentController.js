const Comment = require("../models/Comment");
const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsForTask = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId })
    .populate("author", "name")
    .sort({ createdAt: 1 });

  res.status(200).json(comments);
});

// @route   POST /api/comments
// @access  Private — Body: { taskId, text }
const createComment = asyncHandler(async (req, res) => {
  const { taskId, text } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const comment = await Comment.create({
    task: taskId,
    author: req.user._id,
    text,
  });

  const populated = await comment.populate("author", "name");

  const io = req.app.get("io");
  io.to(task.project.toString()).emit("commentAdded", populated);

  res.status(201).json(populated);
});

// @route   DELETE /api/comments/:id
// @access  Private — author only
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized — author only");
  }

  const task = await Task.findById(comment.task);
  await comment.deleteOne();

  if (task) {
    const io = req.app.get("io");
    io.to(task.project.toString()).emit("commentDeleted", {
      commentId: req.params.id,
      taskId: task._id.toString(),
    });
  }

  res.status(200).json({ message: "Comment deleted" });
});

module.exports = { getCommentsForTask, createComment, deleteComment };