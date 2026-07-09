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
import { isOverdue } from "../utils/taskHelpers";

// Raw hex for Recharts fills — can't use Tailwind classes on SVG fill attrs
const STATUS_COLORS = { ToDo: "#94A3B8", InProgress: "#F59E0B", Done: "#16A34A" };

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
    <div className="rounded-md border border-border bg-surface p-4 shadow-card">
      <h4 className="mt-0">Team Members</h4>

      <div className="mb-4 flex flex-wrap gap-2">
        {people.map((person) => {
          // Quick per-person task count just for the chip, so you get a hint before clicking
          const personTasks = tasks.filter((t) => t.assignee?._id === person._id);
          const taskCount = personTasks.length;
          const overdueCount = personTasks.filter(isOverdue).length;
          const isActive = selectedUserId === person._id;

          return (
            <button
              key={person._id}
              onClick={() => setSelectedUserId(person._id)}
              className={`flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-[13px] font-semibold ${
                isActive
                  ? "border-teal bg-teal-soft"
                  : "border-border bg-fog"
              }`}
            >
              {person.name}
              <span className="font-normal text-ink-muted">{person.roleLabel}</span>
              <span className="font-normal text-teal">{taskCount} tasks</span>
              {overdueCount > 0 && (
                <span className="rounded bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {overdueCount} overdue
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedPerson ? (
        <>
          <h5 className="mb-2 mt-0">{selectedPerson.name}'s task breakdown</h5>
          {selectedPersonTasks.length === 0 ? (
            <p className="text-sm text-ink-muted">No tasks assigned to this person yet.</p>
          ) : (
            <>
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

              {/* List out exactly which tasks are overdue — a chart alone doesn't tell you WHAT missed the deadline */}
              {selectedPersonTasks.some(isOverdue) && (
                <div className="mt-3">
                  <p className="mb-1.5 font-semibold text-danger">Overdue tasks:</p>
                  <ul className="m-0 pl-4">
                    {selectedPersonTasks.filter(isOverdue).map((t) => (
                      <li key={t._id} className="text-[13px] text-danger">
                        {t.title} — was due{" "}
                        {new Date(t.dueDate).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          Click a team member above to see their task breakdown.
        </p>
      )}
    </div>
  );
};

export default MembersOverview;