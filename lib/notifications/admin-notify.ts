// Real-time Admin Notification (stub: extend with email, Slack, or in-app)
import { notifySlack } from './slack-notify';
import { notifySMS } from './sms-notify';

export async function notifyAdmin(subject: string, message: string) {
  // Production: Send to Slack and SMS (extend as needed)
  await notifySlack('#admin-alerts', `[ADMIN] ${subject}: ${message}`);
  await notifySMS(process.env.ADMIN_PHONE || '+1234567890', `[ADMIN] ${subject}: ${message}`);
}
