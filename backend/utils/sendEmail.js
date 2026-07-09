const nodemailer = require("nodemailer");

// Reads SMTP credentials from environment variables — see .env.example for
// what needs to be set. Works with Gmail (App Password), Mailtrap, or any
// standard SMTP provider.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465", // true for port 465, false for 587/others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// `to` = recipient email, `subject`/`text` = email content.
// Wrapped in try/catch by the CALLER — email failures should never crash
// the actual task/assignment action that triggered them.
const sendEmail = async (to, subject, text) => {
    // console.log("Sending email:", { to, subject, text });
  await transporter.sendMail({ 
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;