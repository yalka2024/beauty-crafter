// Error Alerting (stub: extend with email, Slack, PagerDuty, etc.)

import { notifySlack } from './slack-notify';
import { notifySMS } from './sms-notify';
import { notifyPagerDuty } from './pagerduty-notify';
import { notifyEmail } from './email-notify';

export async function alertOnError(context: string, error: any) {
  // Production: Send error alerts to Slack, PagerDuty, Email, and SMS
  const msg = `[ERROR] ${context}: ${error?.message || error}`;
  await Promise.all([
    notifySlack && notifySlack('#alerts', msg),
    notifyPagerDuty && notifyPagerDuty(msg, 'critical'),
    notifyEmail && notifyEmail('Platform Error Alert', msg),
    notifySMS && notifySMS(process.env.ADMIN_PHONE || '+1234567890', msg),
  ]);
}
