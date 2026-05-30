import nodemailer from "nodemailer";

let transport;

export function getMailTransport() {
  if (transport) {
    return transport;
  }

  const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST = "smtp.gmail.com", EMAIL_PORT = "587" } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  transport = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transport;
}