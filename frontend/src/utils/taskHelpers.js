// A task is overdue if it has a due date in the past AND isn't already Done.
// A completed task is never "overdue" even if it finished late — that's a
// meaningful distinction: overdue means "still outstanding past its deadline".
export const isOverdue = (task) => {
  if (!task.dueDate || task.status === "Done") return false;
  return new Date(task.dueDate) < new Date();
};