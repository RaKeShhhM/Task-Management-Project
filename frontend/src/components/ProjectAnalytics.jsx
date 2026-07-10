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

// Recharts needs raw hex values for fills — Tailwind classes don't apply to SVG
// fill attributes — so these stay in sync with tailwind.config.js by hand.
const STATUS_COLORS = {
  NotStarted: "#94A3B8",
  InProgress: "#F59E0B",
  Completed: "#16A34A",
};

const PRIORITY_COLORS = {
  Low: "#3B82F6",
  Medium: "#F59E0B",
  High: "#DC2626",
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
    <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 font-body shadow-card">
        <h4 className="mb-2 mt-0">Projects by Status</h4>
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

      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 font-body shadow-card">
        <h4 className="mb-2 mt-0">Projects by Priority</h4>
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

export default ProjectAnalytics;