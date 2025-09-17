// PagerDuty alert integration
import fetch from 'node-fetch';

export async function notifyPagerDuty(summary: string, severity: 'critical' | 'error' | 'warning' = 'critical') {
  const routingKey = process.env.PAGERDUTY_INTEGRATION_KEY;
  if (!routingKey) throw new Error('PAGERDUTY_INTEGRATION_KEY not set');
  const event = {
    routing_key: routingKey,
    event_action: 'trigger',
    payload: {
      summary,
      source: 'beauty-crafter-platform',
      severity,
    },
  };
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}
