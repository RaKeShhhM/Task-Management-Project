const Task = require("../models/Task");
const sendEmail = require("./sendEmail");

// How many days ahead counts as "due soon" — 1 means today AND tomorrow.
// Overridable via env since different teams may want more/less notice.
const WINDOW_DAYS = parseInt(process.env.DUE_REMINDER_WINDOW_DAYS, 10) || 1;

// Finds tasks due today or within WINDOW_DAYS, that have an assignee, aren't
// Done, and haven't already been reminded about THIS due date — then emails
// each assignee once. Returns a summary instead of throwing, so a bad run
// (e.g. SMTP down) doesn't crash the process that scheduled it.
const sendDueDateReminders = async () => {
  const now = new Date();

  // Due dates come from a plain <input type="date">, so they're stored as
  // midnight UTC of that calendar day. Comparing exact timestamps around
  // midnight is fragile, so we work in whole UTC calendar days instead:
  // "due today" or "due tomorrow" rather than "due within the next 24h".
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windowEnd = new Date(todayStart);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + WINDOW_DAYS + 1); // exclusive upper bound

  const dueTasks = await Task.find({
    status: { $ne: "Done" },
    assignee: { $ne: null },
    dueDate: { $gte: todayStart, $lt: windowEnd },
    // Only tasks NOT already reminded for their current dueDate. Comparing
    // the two fields directly (rather than a boolean flag) means a
    // rescheduled task automatically becomes eligible again.
    $expr: { $ne: ["$remindedForDueDate", "$dueDate"] },
  })
    .populate("assignee", "name email")
    .populate("project", "title");

  let sent = 0;
  let failed = 0;

  for (const task of dueTasks) {
    if (!task.assignee?.email) continue; // shouldn't happen given the query, but stay safe

    const dueLabel =
      task.dueDate.getTime() === todayStart.getTime() ? "today" : "soon";

    try {
      await sendEmail(
        task.assignee.email,
        `Reminder: "${task.title}" is due ${dueLabel}`,
        `Hi ${task.assignee.name},\n\nJust a reminder that "${task.title}" in "${task.project?.title || "your project"}" is due ${dueLabel} (${task.dueDate.toLocaleDateString()}).\n\n- Task Manager`,
      );

      task.remindedForDueDate = task.dueDate;
      await task.save();
      sent += 1;
    } catch (error) {
      // One failed email (e.g. bad SMTP config) shouldn't stop the rest of the batch
      console.error(
        `Failed to send due-date reminder for task ${task._id}:`,
        error.message,
      );
      failed += 1;
    }
  }

  return { checked: dueTasks.length, sent, failed };
};

module.exports = sendDueDateReminders;
