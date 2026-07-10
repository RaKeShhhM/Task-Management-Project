const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

// Computes a project's real-world status AND completion percentage FROM its
// tasks, rather than trusting a manually-set label that could go stale.
// - "NotStarted": no tasks yet, or all tasks are still sitting in ToDo
// - "Completed": has at least one task, and every task is Done
// - "InProgress": anything in between
const computeProjectStats = async (projectId) => {
  const total = await Task.countDocuments({ project: projectId });
  if (total === 0) return { status: "NotStarted", percentComplete: 0 };

  const done = await Task.countDocuments({ project: projectId, status: "Done" });
  const percentComplete = Math.round((done / total) * 100);

  if (done === total) return { status: "Completed", percentComplete };

  const notStarted = await Task.countDocuments({
    project: projectId,
    status: "ToDo",
  });
  if (notStarted === total) return { status: "NotStarted", percentComplete };

  return { status: "InProgress", percentComplete };
};

// @route   GET /api/projects
// @access  Private — returns projects where user is owner OR a member
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    // Attach computed `status` + `percentComplete` to each project based on its tasks.
    // .toObject() so we can add plain fields onto what Mongoose returns.
    const withStatus = await Promise.all(
      projects.map(async (project) => {
        const stats = await computeProjectStats(project._id);
        return { ...project.toObject(), ...stats };
      })
    );

    res.status(200).json(withStatus);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description, priority, startDate, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const project = await Project.create({
      title,
      description,
      priority: priority || "Medium",
      startDate: startDate || Date.now(),
      dueDate: dueDate || null,
      owner: req.user._id, // logged-in user becomes the owner
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   PUT /api/projects/:id
// @access  Private — owner only
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Ownership check — this is the resource-level RBAC from the README
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized — owner only" });
    }

    project.title = req.body.title || project.title;
    project.description = req.body.description ?? project.description;
    project.priority = req.body.priority ?? project.priority;
    project.startDate = req.body.startDate ?? project.startDate;
    project.dueDate = req.body.dueDate ?? project.dueDate;

    const updated = await project.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   DELETE /api/projects/:id
// @access  Private — owner only
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized — owner only" });
    }

    // Cascade delete: remove every task that belongs to this project too,
    // otherwise they'd become orphaned rows nobody can ever see or clean up
    await Task.deleteMany({ project: project._id });

    await project.deleteOne();

    // Let anyone currently viewing this board know it's gone (they'll get bounced
    // to the dashboard on the frontend)
    const io = req.app.get("io");
    io.to(project._id.toString()).emit("projectDeleted", {
      projectId: project._id.toString(),
    });

    res.status(200).json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   GET /api/projects/:id
// @access  Private — owner or member only
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner._id.toString() === userId;
    const isMember = project.members.some(
      (m) => m.user._id.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const stats = await computeProjectStats(project._id);
    res.status(200).json({ ...project.toObject(), ...stats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper: only the owner or an existing admin member can manage the team
const canManageMembers = (project, userId) => {
  const idStr = userId.toString();
  if (project.owner.toString() === idStr) return true;
  const member = project.members.find((m) => m.user.toString() === idStr);
  return member?.role === "admin";
};

// @route   POST /api/projects/:id/members
// @access  Private — owner or admin only. Body: { email, role? }
const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!canManageMembers(project, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized — owner/admin only" });
    }

    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    if (project.owner.toString() === userToAdd._id.toString()) {
      return res.status(400).json({ message: "User is already the owner" });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    project.members.push({
      user: userToAdd._id,
      role: role === "admin" ? "admin" : "member",
    });

    await project.save();

    const updated = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   PUT /api/projects/:id/members/:userId
// @access  Private — owner or admin only. Body: { role }
const updateMemberRole = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!canManageMembers(project, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized — owner/admin only" });
    }

    const member = project.members.find(
      (m) => m.user.toString() === req.params.userId
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (!["admin", "member"].includes(req.body.role)) {
      return res.status(400).json({ message: "Role must be admin or member" });
    }

    member.role = req.body.role;
    await project.save();

    const updated = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   DELETE /api/projects/:id/members/:userId
// @access  Private — owner or admin only
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!canManageMembers(project, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized — owner/admin only" });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );

    await project.save();

    const updated = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
};