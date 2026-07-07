import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      await api.post("/projects", { title, description });
      setTitle("");
      setDescription("");
      fetchProjects(); // refresh the list so the new project shows immediately
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2>Welcome, {user?.name} 👋</h2>
        <button onClick={logout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>

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
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              style={projectCardStyle}
            >
              <strong>{project.title}</strong>
              {project.description && (
                <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
                  {project.description}
                </p>
              )}
            </Link>
          ))}
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

const createButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const logoutButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
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

export default Dashboard;