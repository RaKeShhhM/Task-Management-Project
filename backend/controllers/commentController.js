const Comment = require("../models/Comment");
const Task = require("../models/Task");

// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsForTask = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("author", "name")
      .sort({ createdAt: 1 }); // oldest first, like a normal chat thread

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   POST /api/comments
// @access  Private — Body: { taskId, text }
const createComment = async (req, res) => {
  try {
    const { taskId, text } = req.body;

    if (!taskId || !text?.trim()) {
      return res.status(400).json({ message: "taskId and text are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      text,
    });

    const populated = await comment.populate("author", "name");

    // Broadcast to the project room so everyone viewing this task sees the
    // comment appear live, same pattern as task updates
    const io = req.app.get("io");
    io.to(task.project.toString()).emit("commentAdded", populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   DELETE /api/comments/:id
// @access  Private — author only
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized — author only" });
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
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getCommentsForTask, createComment, deleteComment };