import { isOverdue } from "../utils/taskHelpers";
import TaskComments from "./TaskComments";

const PRIORITY_STYLES = {
  Low: "bg-priority-low-soft text-blue-800",
  Medium: "bg-priority-medium-soft text-amber-800",
  High: "bg-priority-high-soft text-red-800",
};

// Defines the Kanban column order — used to figure out "next" and "previous" status
const STATUS_ORDER = ["ToDo", "InProgress", "Done"];

const TaskCard = ({
  task,
  onMove,
  onDelete,
  onReassign,
  assignableUsers = [],
  currentUserId,
}) => {
  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentIndex > 0;
  const canMoveRight = currentIndex < STATUS_ORDER.length - 1;
  const overdue = isOverdue(task);

  // Only the task's owner can delete it (matches backend rule)
  const isOwner = task.owner?._id === currentUserId;
  const isAssignee = task.assignee?._id === currentUserId;

  // Backend only allows owner OR current assignee to update a task (including reassigning it)
  const canReassign = isOwner || isAssignee;

  return (
    <div
      className={`mb-2.5 rounded-md border p-3 shadow-card ${
        overdue ? "border-red-300 bg-danger-soft" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 font-body text-sm font-semibold">{task.title}</p>
        {overdue && (
          <span className="shrink-0 whitespace-nowrap rounded bg-danger px-1.5 py-0.5 font-body text-[10px] font-bold text-white">
            OVERDUE
          </span>
        )}
      </div>

      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${PRIORITY_STYLES[task.priority]}`}
      >
        {task.priority}
      </span>

      {task.description && (
        <p className="my-1.5 font-body text-sm text-ink-muted">{task.description}</p>
      )}

      {task.dueDate && (
        <p
          className={`my-1 font-mono text-xs ${
            overdue ? "font-semibold text-danger" : "text-ink-faint"
          }`}
        >
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      {canReassign ? (
        <select
          value={task.assignee?._id || ""}
          onChange={(e) => onReassign(task._id, e.target.value)}
          className="mb-1.5 w-full rounded border border-border px-1.5 py-1 font-body text-xs"
        >
          <option value="">Unassigned</option>
          {assignableUsers.map((person) => (
            <option key={person._id} value={person._id}>
              {person.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="my-1.5 font-body text-xs text-ink-faint">
          Assignee: {task.assignee?.name || "Unassigned"}
        </p>
      )}

      <div className="mt-2.5 flex gap-1.5">
        {canMoveLeft && (
          <button
            onClick={() => onMove(task._id, STATUS_ORDER[currentIndex - 1])}
            className="rounded border border-border bg-fog px-2 py-1 font-body text-xs"
          >
            ← Move
          </button>
        )}
        {canMoveRight && (
          <button
            onClick={() => onMove(task._id, STATUS_ORDER[currentIndex + 1])}
            className="rounded border border-border bg-fog px-2 py-1 font-body text-xs"
          >
            Move →
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => onDelete(task._id)}
            className="rounded bg-danger-soft px-2 py-1 font-body text-xs text-danger"
          >
            Delete
          </button>
        )}
      </div>

      <TaskComments taskId={task._id} currentUserId={currentUserId} />
    </div>
  );
};

export default TaskCard;