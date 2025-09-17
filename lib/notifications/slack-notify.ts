// Slack Notification Integration
import fetch from 'node-fetch';

export async function notifySlack(channel: string, message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('Slack webhook URL not set');
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text: message }),
  });
}
