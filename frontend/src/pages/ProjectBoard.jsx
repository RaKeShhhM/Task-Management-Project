import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import socket from "../services/socket";
import TaskCard from "../components/TaskCard";
import TeamPanel from "../components/TeamPanel";
import TaskAnalytics from "../components/TaskAnalytics";
import MembersOverview from "../components/MembersOverview";

const COLUMNS = ["ToDo", "InProgress", "Done"];
const TABS = ["Add Task", "Add Members", "Members"];

const STATUS_STYLES = {
  NotStarted: { backgroundColor: "#f3f4f6", color: "#4b5563" },
  InProgress: { backgroundColor: "#fef3c7", color: "#92400e" },
  Completed: { backgroundColor: "#dcfce7", color: "#166534" },
};

const PRIORITY_STYLES = {
  Low: { backgroundColor: "#dbeafe", color: "#1e40af" },
  Medium: { backgroundColor: "#fef3c7", color: "#92400e" },
  High: { backgroundColor: "#fee2e2", color: "#991b1b" },
};

const STATUS_LABELS = {
  NotStarted: "Not Started",
  InProgress: "In Progress",
  Completed: "Completed",
};

const ProjectBoard = () => {
  const { id: projectId } = useParams(); // grabs :id from the URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("Add Task");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(""); // selected user id for new task
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
        dueDate: dueDate || null,
      });
      setTitle("");
      setAssignee("");
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

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "20px" }}>
      <Link to="/dashboard" style={{ color: "#4f46e5" }}>
        ← Back to Dashboard
      </Link>

      {/* Project header: name + status/priority badges */}
      {project && (
        <div style={{ margin: "10px 0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>{project.title}</h2>
            <span style={{ ...badgeStyle, ...STATUS_STYLES[project.status] }}>
              {STATUS_LABELS[project.status]}
            </span>
            <span style={{ ...badgeStyle, ...PRIORITY_STYLES[project.priority] }}>
              {project.priority} priority
            </span>
          </div>
          {project.description && (
            <p style={{ color: "#6b7280", marginTop: "6px" }}>{project.description}</p>
          )}
        </div>
      )}

      {/* Tab navigation */}
      <div style={tabRowStyle}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...tabButtonStyle,
              ...(activeTab === tab ? tabButtonActiveStyle : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginBottom: "24px" }}>
        {activeTab === "Add Task" && (
          <form onSubmit={handleCreateTask} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="New task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
              title="Due date (optional)"
            />
            <button type="submit" style={addButtonStyle}>
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
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Overall task analytics — always visible regardless of active tab */}
      {!loading && <TaskAnalytics tasks={tasks} />}

      {/* Kanban board — always visible regardless of active tab */}
      <h3 style={{ marginBottom: "12px" }}>Board</h3>
      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {COLUMNS.map((column) => (
            <div key={column} style={columnStyle}>
              <h4 style={{ marginTop: 0 }}>{column}</h4>
              {tasks
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

const addButtonStyle = {
  padding: "10px 16px",
  backgroundColor: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  whiteSpace: "nowrap",
};

const columnStyle = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "12px",
  minHeight: "300px",
};

const badgeStyle = {
  fontSize: "12px",
  fontWeight: "600",
  padding: "3px 10px",
  borderRadius: "999px",
};

const tabRowStyle = {
  display: "flex",
  gap: "6px",
  borderBottom: "1px solid #e5e7eb",
  marginBottom: "16px",
};

const tabButtonStyle = {
  padding: "10px 16px",
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  color: "#6b7280",
  borderBottom: "2px solid transparent",
};

const tabButtonActiveStyle = {
  color: "#4f46e5",
  borderBottom: "2px solid #4f46e5",
};

export default ProjectBoard;