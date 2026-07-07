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
  NotStarted: "#9ca3af",
  InProgress: "#f59e0b",
  Completed: "#22c55e",
};

const PRIORITY_COLORS = {
  Low: "#60a5fa",
  Medium: "#f59e0b",
  High: "#ef4444",
};

const ProjectAnalytics = ({ projects }) => {
  // Tally how many projects fall into each status bucket
  const statusCounts = ["NotStarted", "InProgress", "Completed"].map(
    (status) => ({
      name: status,
      value: projects.filter((p) => p.status === status).length,
    })
  );

  // Same idea, but by priority
  const priorityCounts = ["Low", "Medium", "High"].map((priority) => ({
    name: priority,
    count: projects.filter((p) => p.priority === priority).length,
  }));

  // Don't bother rendering charts with nothing to show
  if (projects.length === 0) return null;

  return (
    <div style={gridStyle}>
      <div style={chartCardStyle}>
        <h4 style={{ marginTop: 0 }}>Projects by Status</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusCounts}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
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
        <h4 style={{ marginTop: 0 }}>Projects by Priority</h4>
        <ResponsiveContainer width="100%" height={220}>
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
  marginBottom: "30px",
};

const chartCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
};

export default ProjectAnalytics;