const Task = require("../models/Task");
const Project = require("../models/Project");
const logActivity = require("../utils/logActivity");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assignee, priority, dueDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
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

  const task = await Task.findById(created._id)
    .populate("owner", "name email")
    .populate("assignee", "name email");

  const io = req.app.get("io");
  io.to(projectId.toString()).emit("taskCreated", task);

  await logActivity(
    io,
    projectId,
    req.user._id,
    `created task "${task.title}"${
      task.assignee ? ` and assigned it to ${task.assignee.name}` : ""
    }`
  );

  if (task.assignee?.email) {
    try {
      await sendEmail(
        task.assignee.email,
        `You've been assigned a task: ${task.title}`,
        `Hi ${task.assignee.name},\n\n${req.user.name} assigned you a task in "${project.title}":\n\n"${task.title}"\n\n${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : ""}`
      );
    } catch (emailError) {
      console.error("Failed to send assignment email:", emailError.message);
    }
  }

  res.status(201).json(task);
});

// @route   GET /api/tasks/project/:id
// @access  Private
const getTasksByProject = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ project: req.params.id })
    .populate("owner", "name email")
    .populate("assignee", "name email");

  res.status(200).json(tasks);
});

// @route   PUT /api/tasks/:id
// @access  Private — owner OR assignee can update (e.g. move between Kanban columns)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const userId = req.user._id.toString();
  const isOwner = task.owner.toString() === userId;
  const isAssignee = task.assignee && task.assignee.toString() === userId;

  if (!isOwner && !isAssignee) {
    throw new ApiError(403, "Not authorized — must be owner or assignee");
  }

  const previousStatus = task.status;
  const previousAssigneeId = task.assignee?.toString() || null;

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

  const newAssigneeId = updated.assignee?._id?.toString() || null;
  const statusChanged = previousStatus !== updated.status;
  const assigneeChanged = previousAssigneeId !== newAssigneeId;

  if (statusChanged) {
    await logActivity(
      io,
      task.project,
      req.user._id,
      `moved "${updated.title}" to ${updated.status}`
    );
  }

  if (assigneeChanged) {
    await logActivity(
      io,
      task.project,
      req.user._id,
      updated.assignee
        ? `assigned "${updated.title}" to ${updated.assignee.name}`
        : `unassigned "${updated.title}"`
    );

    if (updated.assignee?.email) {
      try {
        await sendEmail(
          updated.assignee.email,
          `You've been assigned a task: ${updated.title}`,
          `Hi ${updated.assignee.name},\n\n${req.user.name} assigned you a task:\n\n"${updated.title}"\n\n${updated.dueDate ? `Due: ${new Date(updated.dueDate).toLocaleDateString()}` : ""}`
        );
      } catch (emailError) {
        console.error("Failed to send assignment email:", emailError.message);
      }
    }
  }

  res.status(200).json(updated);
});

// @route   DELETE /api/tasks/:id
// @access  Private — owner only
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized — owner only");
  }

  const projectId = task.project.toString();
  const taskId = task._id.toString();
  const taskTitle = task.title;

  await task.deleteOne();

  const io = req.app.get("io");
  io.to(projectId).emit("taskDeleted", { taskId });

  await logActivity(io, projectId, req.user._id, `deleted task "${taskTitle}"`);

  res.status(200).json({ message: "Task deleted" });
});

module.exports = { createTask, getTasksByProject, updateTask, deleteTask };