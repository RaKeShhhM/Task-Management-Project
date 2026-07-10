import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ProjectAnalytics from "../components/ProjectAnalytics";
import Avatar from "../components/Avatar";
import ProgressRing from "../components/ProgressRing";
import StatCard from "../components/StatCard";

const STATUS_STYLES = {
  NotStarted:
    "bg-status-todo-soft dark:bg-slate-800 text-ink-muted dark:text-slate-300",
  InProgress:
    "bg-status-progress-soft text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Completed:
    "bg-status-done-soft text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const PRIORITY_STYLES = {
  Low: "bg-priority-low-soft text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Medium:
    "bg-priority-medium-soft text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  High: "bg-priority-high-soft text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABELS = {
  NotStarted: "Not Started",
  InProgress: "In Progress",
  Completed: "Completed",
};

const STATUS_RING_COLORS = {
  NotStarted: "#94A3B8",
  InProgress: "#F59E0B",
  Completed: "#16A34A",
};

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const TABS = ["Stats", "Create Project", "Projects"];
const PAGE_SIZE = 4;

// A project counts as "overdue" if its due date has passed and it isn't Completed
const isProjectOverdue = (project) =>
  project.dueDate &&
  project.status !== "Completed" &&
  new Date(project.dueDate) < new Date();

// Skeleton placeholder shown in place of project cards while loading —
// mimics the real card's shape so the layout doesn't jump once data arrives
const ProjectCardSkeleton = () => (
  <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 shadow-card">
    <div className="animate-skeleton h-4 w-1/3 rounded bg-border" />
    <div className="animate-skeleton mt-3 h-3 w-2/3 rounded bg-border" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("Projects");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sortBy, setSortBy] = useState("deadline"); // "deadline" | "priority"
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      setError("Could not load projects");
    } finally {
      setLoading(false);
    }
  };

  // Load projects once when the dashboard mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.post("/projects", {
        title,
        description,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || null,
      });
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStartDate("");
      setDueDate("");
      fetchProjects(); // refresh the list so the new project shows immediately
      setActiveTab("Projects"); // jump over to see it in the list right away
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  // Only the project owner can delete it (backend enforces this too — this is just UI convenience)
  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault(); // stop the click from also triggering the <Link> navigation
    e.stopPropagation();

    const confirmed = window.confirm(
      "Delete this project and all its tasks? This can't be undone.",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  // Sort a COPY of the projects array — never mutate state directly
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === "priority") {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    // sortBy === "deadline": projects with no due date sink to the bottom
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  // Clamp in case projects were deleted and the current page no longer exists
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageProjects = sortedProjects.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(0); // always reset to page 1 when sort order changes
  };

  // Stats strip numbers
  const totalCount = projects.length;
  const completedCount = projects.filter(
    (p) => p.status === "Completed",
  ).length;
  const inProgressCount = projects.filter(
    (p) => p.status === "InProgress",
  ).length;
  const overdueCount = projects.filter(isProjectOverdue).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="m-0 mb-1 font-mono text-xs uppercase tracking-wider text-teal">
        Dashboard
      </p>

      {/* Welcome hero with avatar */}
      <div className="mb-6 flex items-center gap-3">
        <Avatar name={user?.name} size="lg" />
        <h2 className="font-heading text-2xl text-ink dark:text-slate-100 sm:text-[26px]">
          Welcome back, {user?.name}
        </h2>
      </div>

      {/* Stats summary strip — instant "at a glance" view before digging into tabs */}
      {!loading && projects.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={totalCount}
            accentColor="#0D9488"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            accentColor="#16A34A"
          />
          <StatCard
            label="In Progress"
            value={inProgressCount}
            accentColor="#F59E0B"
          />
          <StatCard
            label="Overdue"
            value={overdueCount}
            accentColor="#DC2626"
          />
        </div>
      )}

      {/* Tab navigation — scrolls horizontally on narrow screens instead of wrapping awkwardly */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto border-b border-border dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 font-body text-sm font-medium sm:px-4 ${
              activeTab === tab
                ? "border-teal text-teal"
                : "border-transparent text-ink-muted dark:text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* key={activeTab} forces the fade-in animation to retrigger on every tab switch */}
      <div key={activeTab} className="animate-fade-slide-up">
        {activeTab === "Stats" &&
          (loading ? (
            <p className="text-sm text-ink-muted dark:text-slate-400">
              Loading stats...
            </p>
          ) : (
            <ProjectAnalytics projects={projects} />
          ))}

        {activeTab === "Create Project" && (
          <form
            onSubmit={handleCreateProject}
            className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 shadow-card sm:p-5"
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Create a new project</h3>
            <input
              type="text"
              placeholder="Project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-2.5 block w-full rounded-md border border-border dark:border-slate-700 px-3 py-2.5 font-body text-sm"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mb-2.5 block w-full rounded-md border border-border dark:border-slate-700 px-3 py-2.5 font-body text-sm"
            />

            {/* Stacks vertically on mobile, row on larger screens */}
            <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:gap-2.5">
              <label className="flex flex-1 flex-col gap-1 font-mono text-xs text-ink-muted dark:text-slate-400">
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="rounded-md border border-border dark:border-slate-700 p-2 font-body text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label className="flex flex-1 flex-col gap-1 font-mono text-xs text-ink-muted dark:text-slate-400">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md border border-border dark:border-slate-700 p-2 font-body text-sm"
                />
              </label>

              <label className="flex flex-1 flex-col gap-1 font-mono text-xs text-ink-muted dark:text-slate-400">
                Due date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-md border border-border dark:border-slate-700 p-2 font-body text-sm"
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-md bg-teal px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-teal-dark"
            >
              + Create Project
            </button>
          </form>
        )}

        {activeTab === "Projects" && (
          <div>
            {/* Sort controls — wraps on narrow screens */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-faint dark:text-slate-500">
                Sort by
              </span>
              <button
                onClick={() => handleSortChange("deadline")}
                className={`rounded-full border px-3.5 py-1.5 font-body text-xs ${
                  sortBy === "deadline"
                    ? "border-teal bg-teal text-white"
                    : "border-border dark:border-slate-700 bg-surface dark:bg-slate-900 text-ink-muted dark:text-slate-400"
                }`}
              >
                Closing Deadline
              </button>
              <button
                onClick={() => handleSortChange("priority")}
                className={`rounded-full border px-3.5 py-1.5 font-body text-xs ${
                  sortBy === "priority"
                    ? "border-teal bg-teal text-white"
                    : "border-border dark:border-slate-700 bg-surface dark:bg-slate-900 text-ink-muted dark:text-slate-400"
                }`}
              >
                High Priority First
              </button>
            </div>

            {loading ? (
              <div className="grid gap-3">
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
              </div>
            ) : sortedProjects.length === 0 ? (
              <div className="flex flex-col items-center rounded-md border border-dashed border-border dark:border-slate-700 py-10 text-center">
                <span className="mb-2 text-3xl">🗂️</span>
                <p className="text-sm text-ink-muted dark:text-slate-400">
                  No projects yet — create your first one in the "Create
                  Project" tab.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {pageProjects.map((project, index) => {
                    const isOwner = project.owner?._id === user?._id;
                    const overdue = isProjectOverdue(project);
                    return (
                      <Link
                        key={project._id}
                        to={`/projects/${project._id}`}
                        style={{ animationDelay: `${index * 60}ms` }}
                        className="animate-fade-slide-up block rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 text-ink dark:text-slate-100 no-underline shadow-card transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-raised"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="font-heading text-base">
                                {project.title}
                              </strong>
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold ${STATUS_STYLES[project.status]}`}
                              >
                                {STATUS_LABELS[project.status]}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold ${PRIORITY_STYLES[project.priority]}`}
                              >
                                {project.priority}
                              </span>
                              {overdue && (
                                <span className="rounded-full bg-danger px-2.5 py-0.5 font-body text-[11px] font-semibold text-white">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <p className="mt-1.5 text-sm text-ink-muted dark:text-slate-400">
                                {project.description}
                              </p>
                            )}
                            {project.dueDate && (
                              <p className="mt-1.5 font-mono text-xs text-ink-faint dark:text-slate-500">
                                Due{" "}
                                {new Date(project.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <ProgressRing
                              percent={project.percentComplete ?? 0}
                              size={40}
                              strokeWidth={4}
                              color={STATUS_RING_COLORS[project.status]}
                            />
                            {isOwner && (
                              <button
                                onClick={(e) =>
                                  handleDeleteProject(e, project._id)
                                }
                                className="rounded-md bg-danger-soft dark:bg-red-900/40 px-2.5 py-1 font-body text-xs text-danger dark:text-red-300"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination controls */}
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 px-3.5 py-1.5 text-sm text-ink dark:text-slate-100 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="font-mono text-xs text-ink-muted dark:text-slate-400">
                    Page {safePage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={safePage >= totalPages - 1}
                    className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 px-3.5 py-1.5 text-sm text-ink dark:text-slate-100 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
