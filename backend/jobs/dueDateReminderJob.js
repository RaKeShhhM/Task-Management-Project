const cron = require("node-cron");
const sendDueDateReminders = require("../utils/sendDueDateReminders");

// Standard 5-field cron syntax. Default: once a day at 8:00 AM server time.
// Override in .env if you want a different schedule — e.g. every 15 minutes
// for testing: "*/15 * * * *"
const schedule = process.env.DUE_REMINDER_CRON || "0 8 * * *";

// IANA timezone name (e.g. "Asia/Kolkata"). Left undefined by default, which
// makes node-cron use the server's own local timezone — set this explicitly
// if you deploy somewhere that doesn't run in your local timezone.
const timezone = process.env.DUE_REMINDER_TZ || undefined;

const startDueDateReminderJob = () => {
  cron.schedule(
    schedule,
    async () => {
      console.log("⏰ Running due-date reminder job...");
      const result = await sendDueDateReminders();
      console.log(
        `⏰ Due-date reminders: ${result.sent} sent, ${result.failed} failed, ${result.checked} checked`,
      );
    },
    timezone ? { timezone } : undefined,
  );

  console.log(
    `⏰ Due-date reminder job scheduled: "${schedule}"${timezone ? ` (${timezone})` : " (server local time)"}`,
  );
};

module.exports = startDueDateReminderJob;
