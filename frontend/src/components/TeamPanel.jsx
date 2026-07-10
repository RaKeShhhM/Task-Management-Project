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
    <div className="rounded-md border border-border dark:border-slate-700 bg-fog dark:bg-slate-950 p-4">
      <h4 className="mt-0 dark:text-white">Team</h4>

      {/* Owner is always shown, always in charge, never removable */}
      <div className="flex items-center justify-between border-b border-border dark:border-slate-700 py-1.5 dark:text-slate-300">
        <span className="text-sm">
          {project.owner?.name} <em className="text-ink-muted dark:text-slate-400">(owner)</em>
        </span>
      </div>

      {project.members?.map((m) => (
        <div
          key={m.user._id}
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border dark:border-slate-700 py-1.5 dark:text-slate-300"
        >
          <span className="text-sm">{m.user.name}</span>
          {canManage ? (
            <div className="flex items-center gap-1.5">
              <select
                value={m.role}
                onChange={(e) => onRoleChange(m.user._id, e.target.value)}
                className="rounded-md border border-border dark:border-slate-700 p-1.5 text-sm"
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={() => onRemove(m.user._id)}
                className="rounded bg-danger-soft dark:bg-red-900/40 px-2.5 py-1 text-xs text-danger dark:text-red-300"
              >
                Remove
              </button>
            </div>
          ) : (
            <span className="text-[13px] text-ink-muted dark:text-slate-400">{m.role}</span>
          )}
        </div>
      ))}

      {canManage && (
        <form onSubmit={handleAdd} className="mt-3">
          <input
            type="email"
            placeholder="Member's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-2 block w-full rounded-md border border-border dark:border-slate-700 px-2 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-md border border-border dark:border-slate-700 p-1.5 text-sm"
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" className="rounded-md bg-teal px-3.5 py-1.5 text-sm text-white hover:bg-teal-dark">
              + Add
            </button>
          </div>
          {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default TeamPanel;