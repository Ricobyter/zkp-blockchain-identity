import { getMailTransport } from "../config/nodemailer.js";

function buildCredentialsEmail({ name, email, password }) {
  return {
    subject: "Your student account credentials",
    text: [
      `Hello ${name},`,
      "",
      "Your account has been created successfully.",
      `Email: ${email}`,
      `Temporary Password: ${password}`,
      "",
      "Please sign in and update your password as soon as possible.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Your student account credentials</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully.</p>
        <p><strong>Email:</strong> ${email}<br />
        <strong>Temporary Password:</strong> ${password}</p>
        <p>Please sign in and update your password as soon as possible.</p>
      </div>
    `,
  };
}

export async function sendCredentialsEmail({ to, name, email, password }) {
  const transport = getMailTransport();

  if (!transport) {
    return { skipped: true, reason: "Email credentials are not configured." };
  }

  await transport.sendMail({
    from: process.env.EMAIL_USER,
    to,
    ...buildCredentialsEmail({ name, email, password }),
  });

  return { skipped: false };
}