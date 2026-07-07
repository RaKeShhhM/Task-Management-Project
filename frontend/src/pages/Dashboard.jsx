import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ProjectAnalytics from "../components/ProjectAnalytics";

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

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
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

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h2 style={{ marginBottom: "30px" }}>Welcome, {user?.name} 👋</h2>

      {!loading && <ProjectAnalytics projects={projects} />}

      {/* Create project form */}
      <form
        onSubmit={handleCreateProject}
        style={{
          marginBottom: "30px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Create a new project</h3>
        <input
          type="text"
          placeholder="Project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <label style={labelStyle}>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={selectStyle}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <label style={labelStyle}>
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={selectStyle}
            />
          </label>

          <label style={labelStyle}>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={selectStyle}
            />
          </label>
        </div>

        <button type="submit" style={createButtonStyle}>
          + Create Project
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Project list */}
      <h3>Your Projects</h3>
      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          No projects yet — create your first one above.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {projects.map((project) => {
            const isOwner = project.owner?._id === user?._id;
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                style={projectCardStyle}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{project.title}</strong>
                      <span
                        style={{ ...badgeStyle, ...STATUS_STYLES[project.status] }}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                      <span
                        style={{ ...badgeStyle, ...PRIORITY_STYLES[project.priority] }}
                      >
                        {project.priority}
                      </span>
                    </div>
                    {project.description && (
                      <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                        {project.description}
                      </p>
                    )}
                    {project.dueDate && (
                      <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#9ca3af" }}>
                        Due: {new Date(project.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={(e) => handleDeleteProject(e, project._id)}
                      style={deleteProjectButtonStyle}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: "12px",
  color: "#6b7280",
  flex: 1,
  gap: "4px",
};

const selectStyle = {
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const createButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const deleteProjectButtonStyle = {
  padding: "4px 10px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  cursor: "pointer",
  flexShrink: 0,
};

const projectCardStyle = {
  display: "block",
  padding: "14px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  textDecoration: "none",
  color: "#111827",
  backgroundColor: "#f9fafb",
};

const badgeStyle = {
  fontSize: "11px",
  fontWeight: "600",
  padding: "2px 8px",
  borderRadius: "999px",
};

export default Dashboard;