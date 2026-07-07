import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = {
  ToDo: "#9ca3af",
  InProgress: "#f59e0b",
  Done: "#22c55e",
};

const PRIORITY_COLORS = {
  Low: "#60a5fa",
  Medium: "#f59e0b",
  High: "#ef4444",
};

const TaskAnalytics = ({ tasks }) => {
  const statusCounts = ["ToDo", "InProgress", "Done"].map((status) => ({
    name: status,
    value: tasks.filter((t) => t.status === status).length,
  }));

  const priorityCounts = ["Low", "Medium", "High"].map((priority) => ({
    name: priority,
    count: tasks.filter((t) => t.priority === priority).length,
  }));

  if (tasks.length === 0) {
    return (
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        No tasks yet — add one above to see analytics here.
      </p>
    );
  }

  return (
    <div style={gridStyle}>
      <div style={chartCardStyle}>
        <h4 style={{ marginTop: 0 }}>Tasks by Status</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={statusCounts}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={65}
              label={(entry) => (entry.value > 0 ? entry.name : "")}
            >
              {statusCounts.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={chartCardStyle}>
        <h4 style={{ marginTop: 0 }}>Tasks by Priority</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priorityCounts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {priorityCounts.map((entry) => (
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "24px",
};

const chartCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
};

export default TaskAnalytics;