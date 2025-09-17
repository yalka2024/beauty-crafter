// Centralized Log Forwarder Example (Datadog/ELK/Cloud)
import fetch from 'node-fetch';

export function forwardLog(log: Record<string, any>) {
  // Production: Forward logs to Datadog/ELK/Cloud endpoint
  const endpoint = process.env.LOG_FORWARD_URL;
  if (endpoint) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch(() => {});
  }
}
