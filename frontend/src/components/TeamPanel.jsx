import { useState } from "react";

const TeamPanel = ({ project, currentUserId, canManage, onAdd, onRoleChange, onRemove }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await onAdd(email, role);
      setEmail("");
      setRole("member");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    }
  };

  return (
    <div style={panelStyle}>
      <h4 style={{ marginTop: 0 }}>Team</h4>

      {/* Owner is always shown, always in charge, never removable */}
      <div style={memberRowStyle}>
        <span>
          {project.owner?.name} <em style={{ color: "#6b7280" }}>(owner)</em>
        </span>
      </div>

      {project.members?.map((m) => (
        <div key={m.user._id} style={memberRowStyle}>
          <span>{m.user.name}</span>
          {canManage ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <select
                value={m.role}
                onChange={(e) => onRoleChange(m.user._id, e.target.value)}
                style={selectStyle}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={() => onRemove(m.user._id)}
                style={removeButtonStyle}
              >
                Remove
              </button>
            </div>
          ) : (
            <span style={{ color: "#6b7280", fontSize: "13px" }}>{m.role}</span>
          )}
        </div>
      ))}

      {canManage && (
        <form onSubmit={handleAdd} style={{ marginTop: "12px" }}>
          <input
            type="email"
            placeholder="Member's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={selectStyle}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" style={addMemberButtonStyle}>
              + Add
            </button>
          </div>
          {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
        </form>
      )}
    </div>
  );
};

const panelStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
};

const memberRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 0",
  borderBottom: "1px solid #e5e7eb",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "8px",
  marginBottom: "8px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box",
};

const selectStyle = {
  padding: "6px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const addMemberButtonStyle = {
  padding: "6px 14px",
  backgroundColor: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const removeButtonStyle = {
  padding: "4px 10px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  cursor: "pointer",
};

export default TeamPanel;