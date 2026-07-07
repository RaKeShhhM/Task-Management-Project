import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = {
  ToDo: "#9ca3af",
  InProgress: "#f59e0b",
  Done: "#22c55e",
};

const MembersOverview = ({ project, tasks }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  if (!project) return null;

  // Combine owner + members into one list of "people on this project"
  const people = [
    { ...project.owner, roleLabel: "owner" },
    ...(project.members?.map((m) => ({ ...m.user, roleLabel: m.role })) || []),
  ];

  const selectedPerson = people.find((p) => p._id === selectedUserId);

  // Tasks assigned to whichever person is currently selected
  const selectedPersonTasks = selectedPerson
    ? tasks.filter((t) => t.assignee?._id === selectedPerson._id)
    : [];

  const chartData = ["ToDo", "InProgress", "Done"].map((status) => ({
    name: status,
    count: selectedPersonTasks.filter((t) => t.status === status).length,
  }));

  return (
    <div style={containerStyle}>
      <h4 style={{ marginTop: 0 }}>Team Members</h4>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {people.map((person) => {
          // Quick per-person task count just for the chip, so you get a hint before clicking
          const taskCount = tasks.filter(
            (t) => t.assignee?._id === person._id
          ).length;

          return (
            <button
              key={person._id}
              onClick={() => setSelectedUserId(person._id)}
              style={{
                ...personChipStyle,
                ...(selectedUserId === person._id ? personChipActiveStyle : {}),
              }}
            >
              {person.name}
              <span style={roleTagStyle}>{person.roleLabel}</span>
              <span style={countTagStyle}>{taskCount} tasks</span>
            </button>
          );
        })}
      </div>

      {selectedPerson ? (
        <>
          <h5 style={{ margin: "0 0 8px" }}>
            {selectedPerson.name}'s task breakdown
          </h5>
          {selectedPersonTasks.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No tasks assigned to this person yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      ) : (
        <p style={{ color: "#6b7280" }}>
          Click a team member above to see their task breakdown.
        </p>
      )}
    </div>
  );
};

const containerStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
};

const personChipStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "2px",
  padding: "8px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  backgroundColor: "#f9fafb",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const personChipActiveStyle = {
  borderColor: "#4f46e5",
  backgroundColor: "#eef2ff",
};

const roleTagStyle = {
  fontSize: "11px",
  fontWeight: "400",
  color: "#6b7280",
};

const countTagStyle = {
  fontSize: "11px",
  fontWeight: "400",
  color: "#4f46e5",
};

export default MembersOverview;