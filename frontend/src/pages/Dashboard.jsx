import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ProjectAnalytics from "../components/ProjectAnalytics";

const STATUS_STYLES = {
  NotStarted: "bg-status-todo-soft text-ink-muted",
  InProgress: "bg-status-progress-soft text-amber-800",
  Completed: "bg-status-done-soft text-green-800",
};

const PRIORITY_STYLES = {
  Low: "bg-priority-low-soft text-blue-800",
  Medium: "bg-priority-medium-soft text-amber-800",
  High: "bg-priority-high-soft text-red-800",
};

const STATUS_LABELS = {
  NotStarted: "Not Started",
  InProgress: "In Progress",
  Completed: "Completed",
};

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const TABS = ["Stats", "Create Project", "Projects"];
const PAGE_SIZE = 4;

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
      "Delete this project and all its tasks? This can't be undone."
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
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(0); // always reset to page 1 when sort order changes
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="m-0 mb-1 font-mono text-xs uppercase tracking-wider text-teal">
        Dashboard
      </p>
      <h2 className="mb-6 font-heading text-2xl text-ink sm:text-[26px]">
        Welcome back, {user?.name}
      </h2>

      {/* Tab navigation — scrolls horizontally on narrow screens instead of wrapping awkwardly */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 font-body text-sm font-medium sm:px-4 ${
              activeTab === tab
                ? "border-teal text-teal"
                : "border-transparent text-ink-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {activeTab === "Stats" &&
        (loading ? (
          <p className="text-sm text-ink-muted">Loading stats...</p>
        ) : (
          <ProjectAnalytics projects={projects} />
        ))}

      {activeTab === "Create Project" && (
        <form
          onSubmit={handleCreateProject}
          className="rounded-md border border-border bg-surface p-4 shadow-card sm:p-5"
        >
          <h3 className="mb-4 mt-0 text-lg">Create a new project</h3>
          <input
            type="text"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2.5 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-2.5 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm"
          />

          {/* Stacks vertically on mobile, row on larger screens */}
          <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:gap-2.5">
            <label className="flex flex-1 flex-col gap-1 font-mono text-xs text-ink-muted">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-md border border-border p-2 font-body text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-1 font-mono text-xs text-ink-muted">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-border p-2 font-body text-sm"
              />
            </label>

            <label className="flex flex-1 flex-col gap-1 font-mono text-xs text-ink-muted">
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-md border border-border p-2 font-body text-sm"
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
            <span className="font-mono text-xs text-ink-faint">Sort by</span>
            <button
              onClick={() => handleSortChange("deadline")}
              className={`rounded-full border px-3.5 py-1.5 font-body text-xs ${
                sortBy === "deadline"
                  ? "border-teal bg-teal text-white"
                  : "border-border bg-surface text-ink-muted"
              }`}
            >
              Closing Deadline
            </button>
            <button
              onClick={() => handleSortChange("priority")}
              className={`rounded-full border px-3.5 py-1.5 font-body text-xs ${
                sortBy === "priority"
                  ? "border-teal bg-teal text-white"
                  : "border-border bg-surface text-ink-muted"
              }`}
            >
              High Priority First
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-ink-muted">Loading projects...</p>
          ) : sortedProjects.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No projects yet — create one in the "Create Project" tab.
            </p>
          ) : (
            <>
              <div className="grid gap-3">
                {pageProjects.map((project) => {
                  const isOwner = project.owner?._id === user?._id;
                  return (
                    <Link
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className="block rounded-md border border-border bg-surface p-4 text-ink no-underline shadow-card"
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
                          </div>
                          {project.description && (
                            <p className="mt-1.5 text-sm text-ink-muted">
                              {project.description}
                            </p>
                          )}
                          {project.dueDate && (
                            <p className="mt-1.5 font-mono text-xs text-ink-faint">
                              Due {new Date(project.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {isOwner && (
                          <button
                            onClick={(e) => handleDeleteProject(e, project._id)}
                            className="shrink-0 rounded-md bg-danger-soft px-2.5 py-1 font-body text-xs text-danger"
                          >
                            Delete
                          </button>
                        )}
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
                  className="rounded-md border border-border bg-surface px-3.5 py-1.5 text-sm text-ink disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="font-mono text-xs text-ink-muted">
                  Page {safePage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="rounded-md border border-border bg-surface px-3.5 py-1.5 text-sm text-ink disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;