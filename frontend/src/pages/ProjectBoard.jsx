import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import socket from "../services/socket";
import TaskCard from "../components/TaskCard";
import TeamPanel from "../components/TeamPanel";
import TaskAnalytics from "../components/TaskAnalytics";
import MembersOverview from "../components/MembersOverview";
import ActivityFeed from "../components/ActivityFeed";

const COLUMNS = ["ToDo", "InProgress", "Done"];
const TABS = ["Add Task", "Add Members", "Members", "Activity"];

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

// Dot colors for the route-line header — kept as raw hex since this renders
// via inline style on a small decorative dot, not worth a Tailwind class each
const ROUTE_DOT_COLORS = { ToDo: "#94A3B8", InProgress: "#F59E0B", Done: "#16A34A" };
const ROUTE_LABELS = { ToDo: "To Do", InProgress: "In Progress", Done: "Done" };

const ProjectBoard = () => {
  const { id: projectId } = useParams(); // grabs :id from the URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("Add Task");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(""); // selected user id for new task
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Search & filter state for the Kanban board
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      setError("Could not load project");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/project/${projectId}`);
      setTasks(res.data);
    } catch (err) {
      setError("Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + join this project's socket room
  useEffect(() => {
    fetchProject();
    fetchTasks();

    socket.emit("joinProject", projectId);

    return () => {
      // Leave the room when navigating away, so we stop receiving events
      // for a board we're no longer viewing
      socket.emit("leaveProject", projectId);
    };
  }, [projectId]);

  // Listen for live events from OTHER (or our own) clients in this room.
  // Separate effect so listeners attach/detach cleanly without re-joining the room.
  useEffect(() => {
    const onTaskCreated = (newTask) => {
      setTasks((prev) => [...prev, newTask]);
    };

    const onTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    };

    const onTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    // If the project itself gets deleted (by the owner, in another tab/by another
    // admin), bounce everyone else viewing it back to the dashboard
    const onProjectDeleted = ({ projectId: deletedId }) => {
      if (deletedId === projectId) {
        alert("This project was deleted.");
        navigate("/dashboard");
      }
    };

    socket.on("taskCreated", onTaskCreated);
    socket.on("taskUpdated", onTaskUpdated);
    socket.on("taskDeleted", onTaskDeleted);
    socket.on("projectDeleted", onProjectDeleted);

    // Cleanup: remove these specific listeners on unmount so they don't stack up
    // if the component re-mounts (e.g. navigating between projects)
    return () => {
      socket.off("taskCreated", onTaskCreated);
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("taskDeleted", onTaskDeleted);
      socket.off("projectDeleted", onProjectDeleted);
    };
  }, [projectId, navigate]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // No manual fetchTasks() here — the "taskCreated" socket event
      // (which we also receive, since we're in the room) updates state instead
      await api.post("/tasks", {
        title,
        projectId,
        assignee: assignee || null, // "" means "leave unassigned"
        priority,
        dueDate: dueDate || null,
      });
      setTitle("");
      setAssignee("");
      setPriority("Medium");
      setDueDate("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  // Called by TaskCard when "Move" is clicked — updates status on the backend
  const handleMove = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      // "taskUpdated" socket event will move the card in state for us
    } catch (err) {
      setError(err.response?.data?.message || "Failed to move task");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      // "taskDeleted" socket event will remove the card from state for us
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  // Called by TaskCard's assignee dropdown to reassign an existing task
  const handleReassign = async (taskId, newAssigneeId) => {
    try {
      await api.put(`/tasks/${taskId}`, { assignee: newAssigneeId || null });
      // "taskUpdated" socket event updates state for us
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reassign task");
    }
  };

  // Everyone eligible to be assigned a task: the owner + all members
  const assignableUsers = project
    ? [project.owner, ...(project.members?.map((m) => m.user) || [])]
    : [];

  // Team management handlers — these hit the project member endpoints
  const handleAddMember = async (email, role) => {
    const res = await api.post(`/projects/${projectId}/members`, { email, role });
    setProject(res.data);
  };

  const handleRoleChange = async (memberId, newRole) => {
    const res = await api.put(`/projects/${projectId}/members/${memberId}`, {
      role: newRole,
    });
    setProject(res.data);
  };

  const handleRemoveMember = async (memberId) => {
    const res = await api.delete(`/projects/${projectId}/members/${memberId}`);
    setProject(res.data);
  };

  // Can the CURRENT user manage the team? True if they're the owner or an admin member.
  const canManage =
    project &&
    (project.owner?._id === user?._id ||
      project.members?.some(
        (m) => m.user._id === user?._id && m.role === "admin"
      ));

  // Apply search + filters BEFORE splitting into Kanban columns.
  // This is what the board actually renders — analytics/members tabs still
  // use the full, unfiltered `tasks` array so their stats stay accurate.
  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || task.status === filterStatus;

    const matchesAssignee =
      filterAssignee === "all" ||
      (filterAssignee === "unassigned" && !task.assignee) ||
      task.assignee?._id === filterAssignee;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link to="/dashboard" className="text-sm text-teal no-underline hover:underline">
        ← Back to Dashboard
      </Link>

      {/* Project header: name + status/priority badges */}
      {project && (
        <div className="my-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-heading text-xl sm:text-2xl">{project.title}</h2>
            <span
              className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${STATUS_STYLES[project.status]}`}
            >
              {STATUS_LABELS[project.status]}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${PRIORITY_STYLES[project.priority]}`}
            >
              {project.priority} priority
            </span>
          </div>
          {project.description && (
            <p className="mt-1.5 text-sm text-ink-muted">{project.description}</p>
          )}
        </div>
      )}

      {/* Tab navigation — scrolls horizontally on narrow screens */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 font-body text-sm font-medium ${
              activeTab === tab
                ? "border-teal text-teal"
                : "border-transparent text-ink-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mb-6">
        {activeTab === "Add Task" && (
          <form onSubmit={handleCreateTask} className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="New task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-[160px] flex-1 rounded-md border border-border px-3 py-2.5 font-body text-sm"
            />
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="rounded-md border border-border px-3 py-2.5 font-body text-sm"
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-md border border-border px-3 py-2.5 font-body text-sm"
            >
              <option value="Low">Low priority</option>
              <option value="Medium">Medium priority</option>
              <option value="High">High priority</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              title="Due date (optional)"
              className="rounded-md border border-border px-3 py-2.5 font-body text-sm"
            />
            <button
              type="submit"
              className="whitespace-nowrap rounded-md bg-teal px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-teal-dark"
            >
              + Add Task
            </button>
          </form>
        )}

        {activeTab === "Add Members" && project && (
          <TeamPanel
            project={project}
            currentUserId={user?._id}
            canManage={canManage}
            onAdd={handleAddMember}
            onRoleChange={handleRoleChange}
            onRemove={handleRemoveMember}
          />
        )}

        {activeTab === "Members" && project && (
          <MembersOverview project={project} tasks={tasks} />
        )}

        {activeTab === "Activity" && <ActivityFeed projectId={projectId} />}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Overall task analytics — always visible, uses the FULL task list regardless of filters */}
      {!loading && <TaskAnalytics tasks={tasks} />}

      {/* Search & filter bar for the board below */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="🔍 Search tasks by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-[200px] flex-1 rounded-md border border-border px-3 py-2.5 font-body text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-border px-3 py-2.5 font-body text-sm"
        >
          <option value="all">All statuses</option>
          <option value="ToDo">ToDo</option>
          <option value="InProgress">InProgress</option>
          <option value="Done">Done</option>
        </select>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-md border border-border px-3 py-2.5 font-body text-sm"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {assignableUsers.map((person) => (
            <option key={person._id} value={person._id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      {/* Route-line header: the signature "journey" strip showing task counts
          per stage, connected by a line — echoes the Navbar logomark */}
      <div className="relative mb-4 flex items-start justify-between rounded-md border border-border bg-surface px-6 py-4 shadow-card">
        <div className="pointer-events-none absolute left-10 right-10 top-[26px] h-px bg-border" />
        {COLUMNS.map((column) => {
          const count = visibleTasks.filter((t) => t.status === column).length;
          return (
            <div key={column} className="relative z-10 flex flex-col items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full ring-4 ring-surface"
                style={{ backgroundColor: ROUTE_DOT_COLORS[column] }}
              />
              <span className="font-body text-xs font-medium text-ink-muted">
                {ROUTE_LABELS[column]}
              </span>
              <span className="font-mono text-sm font-semibold text-ink">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban board — stacks to 1 column on mobile, 3 side-by-side from sm: up */}
      <h3 className="mb-3 text-lg">Board</h3>
      {loading ? (
        <p className="text-sm text-ink-muted">Loading tasks...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column} className="min-h-[300px] rounded-md bg-fog p-3">
              <h4 className="mb-2 mt-0 font-body text-sm font-semibold text-ink-muted">
                {ROUTE_LABELS[column]}
              </h4>
              {visibleTasks
                .filter((task) => task.status === column)
                .map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onMove={handleMove}
                    onDelete={handleDelete}
                    onReassign={handleReassign}
                    assignableUsers={assignableUsers}
                    currentUserId={user?._id}
                  />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;