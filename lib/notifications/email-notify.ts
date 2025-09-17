// Email alert integration (using nodemailer)
import nodemailer from 'nodemailer';

export async function notifyEmail(subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.ALERT_FROM || 'alerts@yourdomain.com',
    to: process.env.ALERT_TO || 'oncall@yourdomain.com',
    subject,
    text,
  });
}
