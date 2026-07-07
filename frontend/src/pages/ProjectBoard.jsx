import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import socket from "../services/socket";
import TaskCard from "../components/TaskCard";

const COLUMNS = ["ToDo", "InProgress", "Done"];

const ProjectBoard = () => {
  const { id: projectId } = useParams(); // grabs :id from the URL
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

    socket.on("taskCreated", onTaskCreated);
    socket.on("taskUpdated", onTaskUpdated);
    socket.on("taskDeleted", onTaskDeleted);

    // Cleanup: remove these specific listeners on unmount so they don't stack up
    // if the component re-mounts (e.g. navigating between projects)
    return () => {
      socket.off("taskCreated", onTaskCreated);
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("taskDeleted", onTaskDeleted);
    };
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // No manual fetchTasks() here — the "taskCreated" socket event
      // (which we also receive, since we're in the room) updates state instead
      await api.post("/tasks", { title, projectId });
      setTitle("");
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

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "20px" }}>
      <Link to="/dashboard" style={{ color: "#4f46e5" }}>
        ← Back to Dashboard
      </Link>

      <h2 style={{ marginTop: "10px" }}>Project Board</h2>

      {/* Create task form */}
      <form
        onSubmit={handleCreateTask}
        style={{ display: "flex", gap: "8px", margin: "20px 0" }}
      >
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
        <button type="submit" style={addButtonStyle}>
          + Add Task
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

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

export default ProjectBoard;