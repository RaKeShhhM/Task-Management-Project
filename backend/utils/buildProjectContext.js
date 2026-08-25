const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");
const Project = require("../models/Project");

const WINDOW_DAYS = 7;

// Pure (well, DB-reading) helper: aggregates the last N days of a project's
// state into a compact JSON snapshot for the LLM. Keeping this separate from
// the AI controller means the prompt can be tested by hand and we never
// accidentally leak raw user docs to the model.
const buildProjectContext = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate("owner", "name")
    .populate("members.user", "name");

  if (!project) return null;

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - WINDOW_DAYS);

  // All tasks ever on this project — used for current-state stats.
  const allTasks = await Task.find({ project: projectId })
    .populate("owner", "name")
    .populate("assignee", "name");

  // Tasks that were CREATED in the window — used for "new work" stats.
  const tasksCreatedInWindow = await Task.find({
    project: projectId,
    createdAt: { $gte: windowStart },
  });

  // Tasks COMPLETED in the window — proxy: updatedAt in window AND status Done.
  // Not perfect (manual edits also bump updatedAt) but good enough for a digest.
  const tasksCompletedInWindow = await Task.find({
    project: projectId,
    status: "Done",
    updatedAt: { $gte: windowStart },
  }).populate("assignee", "name");

  const byStatus = {
    ToDo: 0,
    InProgress: 0,
    Done: 0,
  };
  for (const t of allTasks) {
    if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
  }

  const nowMs = now.getTime();
  const overdue = allTasks
    .filter(
      (t) => t.dueDate && new Date(t.dueDate).getTime() < nowMs && t.status !== "Done"
    )
    .map((t) => ({
      title: t.title,
      dueDate: t.dueDate.toISOString().slice(0, 10),
      assignee: t.assignee?.name || null,
    }));

  // Top contributors in the window — count completed tasks per assignee.
  const completedByAssignee = {};
  for (const t of tasksCompletedInWindow) {
    const name = t.assignee?.name || "(unassigned)";
    completedByAssignee[name] = (completedByAssignee[name] || 0) + 1;
  }
  const topContributors = Object.entries(completedByAssignee)
    .map(([name, count]) => ({ name, completedTasks: count }))
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 5);

  const recentActivity = await ActivityLog.find({
    project: projectId,
    createdAt: { $gte: windowStart },
  })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(30)
    .map?.((entry) => ({
      // defensive — populate on find() with sort/limit sometimes returns
      // a Query, not docs, depending on Mongoose version
      at: entry.createdAt,
      who: entry.user?.name || "Someone",
      message: entry.message,
    }));

  return {
    project: {
      title: project.title,
      priority: project.priority,
      owner: project.owner?.name,
      memberCount: project.members?.length || 0,
    },
    windowDays: WINDOW_DAYS,
    totals: {
      allTasks: allTasks.length,
      createdInWindow: tasksCreatedInWindow.length,
      completedInWindow: tasksCompletedInWindow.length,
    },
    byStatus,
    overdue,
    topContributors,
    // `recentActivity` may be the Mongoose Query above — handle both shapes.
    recentActivity:
      recentActivity && Array.isArray(recentActivity)
        ? recentActivity
        : await ActivityLog.find({
            project: projectId,
            createdAt: { $gte: windowStart },
          })
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .limit(30)
            .then((docs) =>
              docs.map((d) => ({
                at: d.createdAt,
                who: d.user?.name || "Someone",
                message: d.message,
              }))
            ),
  };
};

module.exports = buildProjectContext;
