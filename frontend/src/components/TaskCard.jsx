import { isOverdue } from "../utils/taskHelpers";
import TaskComments from "./TaskComments";

const PRIORITY_COLORS = {
  Low: { backgroundColor: "#dbeafe", color: "#1e40af" },
  Medium: { backgroundColor: "#fef3c7", color: "#92400e" },
  High: { backgroundColor: "#fee2e2", color: "#991b1b" },
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
    <div style={{ ...cardStyle, ...(overdue ? overdueCardStyle : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ margin: 0, fontWeight: "600" }}>{task.title}</p>
        {overdue && <span style={overdueBadgeStyle}>OVERDUE</span>}
      </div>
      <span style={{ ...priorityBadgeStyle, ...PRIORITY_COLORS[task.priority] }}>
        {task.priority}
      </span>
      {task.description && (
        <p style={{ margin: "6px 0", color: "#6b7280", fontSize: "14px" }}>
          {task.description}
        </p>
      )}

      {task.dueDate && (
        <p
          style={{
            margin: "4px 0",
            fontSize: "12px",
            color: overdue ? "#b91c1c" : "#9ca3af",
            fontWeight: overdue ? "600" : "400",
          }}
        >
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      {canReassign ? (
        <select
          value={task.assignee?._id || ""}
          onChange={(e) => onReassign(task._id, e.target.value)}
          style={assigneeSelectStyle}
        >
          <option value="">Unassigned</option>
          {assignableUsers.map((person) => (
            <option key={person._id} value={person._id}>
              {person.name}
            </option>
          ))}
        </select>
      ) : (
        <p style={{ margin: "6px 0", fontSize: "12px", color: "#9ca3af" }}>
          Assignee: {task.assignee?.name || "Unassigned"}
        </p>
      )}

      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
        {canMoveLeft && (
          <button
            onClick={() => onMove(task._id, STATUS_ORDER[currentIndex - 1])}
            style={moveButtonStyle}
          >
            ← Move
          </button>
        )}
        {canMoveRight && (
          <button
            onClick={() => onMove(task._id, STATUS_ORDER[currentIndex + 1])}
            style={moveButtonStyle}
          >
            Move →
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => onDelete(task._id)}
            style={deleteButtonStyle}
          >
            Delete
          </button>
        )}
      </div>

      <TaskComments taskId={task._id} currentUserId={currentUserId} />
    </div>
  );
};

const assigneeSelectStyle = {
  width: "100%",
  padding: "4px 6px",
  fontSize: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  marginBottom: "6px",
  boxSizing: "border-box",
};

const overdueCardStyle = {
  borderColor: "#fca5a5",
  backgroundColor: "#fef2f2",
};

const overdueBadgeStyle = {
  fontSize: "10px",
  fontWeight: "700",
  color: "#fff",
  backgroundColor: "#dc2626",
  padding: "2px 6px",
  borderRadius: "4px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const priorityBadgeStyle = {
  display: "inline-block",
  fontSize: "10px",
  fontWeight: "600",
  padding: "2px 8px",
  borderRadius: "999px",
  marginTop: "4px",
};

const cardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "10px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const moveButtonStyle = {
  padding: "4px 8px",
  fontSize: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  backgroundColor: "#f3f4f6",
  cursor: "pointer",
};

const deleteButtonStyle = {
  padding: "4px 8px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  cursor: "pointer",
};

export default TaskCard;