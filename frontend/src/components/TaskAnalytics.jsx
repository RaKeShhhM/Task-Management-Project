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

const STATUS_COLORS = { ToDo: "#94A3B8", InProgress: "#F59E0B", Done: "#16A34A" };
const PRIORITY_COLORS = { Low: "#3B82F6", Medium: "#F59E0B", High: "#DC2626" };

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
      <p className="mb-5 text-sm text-ink-muted dark:text-slate-400">
        No tasks yet — add one above to see analytics here.
      </p>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 shadow-card">
        <h4 className="mb-2 mt-0">Tasks by Status</h4>
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

      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 shadow-card">
        <h4 className="mb-2 mt-0">Tasks by Priority</h4>
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

export default TaskAnalytics;