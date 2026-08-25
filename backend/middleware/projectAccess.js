const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const isProjectMember = (project, userId) => {
  const id = userId.toString();
  return (
    project.owner.toString() === id ||
    project.members.some((member) => member.user.toString() === id)
  );
};

const assertProjectAccess = (project, userId) => {
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectMember(project, userId)) {
    throw new ApiError(403, "Not authorized to access this project");
  }
};

// Use this on any route that directly identifies a project, including when a
// project ID is supplied in the request body while creating a task.
const requireProjectAccess = (getProjectId) =>
  asyncHandler(async (req, res, next) => {
    const project = await Project.findById(getProjectId(req));
    assertProjectAccess(project, req.user._id);
    req.project = project;
    next();
  });

// A task is never accessible just because a caller knows its ObjectId. This
// resolves its parent project before the task controller is allowed to run.
const requireTaskProjectAccess = (getTaskId) =>
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(getTaskId(req));
    if (!task) throw new ApiError(404, "Task not found");

    const project = await Project.findById(task.project);
    assertProjectAccess(project, req.user._id);
    req.task = task;
    req.project = project;
    next();
  });

const requireCommentProjectAccess = (getCommentId) =>
  asyncHandler(async (req, res, next) => {
    const comment = await Comment.findById(getCommentId(req));
    if (!comment) throw new ApiError(404, "Comment not found");

    const task = await Task.findById(comment.task);
    if (!task) throw new ApiError(404, "Task not found");

    const project = await Project.findById(task.project);
    assertProjectAccess(project, req.user._id);
    req.comment = comment;
    req.task = task;
    req.project = project;
    next();
  });

module.exports = {
  isProjectMember,
  requireProjectAccess,
  requireTaskProjectAccess,
  requireCommentProjectAccess,
};
