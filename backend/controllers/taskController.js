const Task = require("../models/Task");
const Project = require("../models/Project");

// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignee, priority, dueDate } =
      req.body;

    if (!title || !projectId) {
      return res
        .status(400)
        .json({ message: "Title and projectId are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const created = await Task.create({
      title,
      description,
      project: projectId,
      owner: req.user._id,
      assignee: assignee || null,
      priority: priority || "Medium",
      dueDate: dueDate || null,
    });

    // Populate owner/assignee so the shape matches what getTasksByProject returns —
    // otherwise the frontend would get raw ObjectIds instead of {name, email} objects
    const task = await Task.findById(created._id)
      .populate("owner", "name email")
      .populate("assignee", "name email");

    const io = req.app.get("io");
    io.to(projectId.toString()).emit("taskCreated", task);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   GET /api/tasks/project/:id
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate("owner", "name email")
      .populate("assignee", "name email");

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   PUT /api/tasks/:id
// @access  Private — owner OR assignee can update (e.g. move between Kanban columns)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = task.owner.toString() === userId;
    const isAssignee = task.assignee && task.assignee.toString() === userId;

    if (!isOwner && !isAssignee) {
      return res
        .status(403)
        .json({ message: "Not authorized — must be owner or assignee" });
    }

    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.status = req.body.status ?? task.status;
    task.assignee = req.body.assignee ?? task.assignee;
    task.priority = req.body.priority ?? task.priority;
    task.dueDate = req.body.dueDate ?? task.dueDate;

    await task.save();

    const updated = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("assignee", "name email");

    const io = req.app.get("io");
    io.to(task.project.toString()).emit("taskUpdated", updated);

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   DELETE /api/tasks/:id
// @access  Private — owner only
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized — owner only" });
    }

    const projectId = task.project.toString();
    const taskId = task._id.toString();

    await task.deleteOne();

    const io = req.app.get("io");
    io.to(projectId).emit("taskDeleted", { taskId });

    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createTask, getTasksByProject, updateTask, deleteTask };