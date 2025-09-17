# Monitoring & Alerting Integration

## Alert Notification Integration
- Integrate `.github/workflows/monitoring-alerts.yml` and `lib/notifications/error-alert.ts` with your real on-call system:
  - Slack: Use a webhook URL or Slack API token.
  - PagerDuty: Use an integration key.
  - Email: Use SMTP or a transactional email API.
- Example (Slack webhook):
  ```js
  // In lib/notifications/error-alert.ts
  fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ text: 'ALERT: ...' }),
    headers: { 'Content-Type': 'application/json' },
  })
  ```

## Prometheus Alert Tuning
- Edit `k8s/monitoring.yaml` to adjust alert thresholds for your production SLOs.
- Example:
  ```yaml
  - alert: HighErrorRate
    expr: rate(http_requests_total{job="beauty-crafter",status=~"5.."}[5m]) > 0.05
    for: 5m
  ```
- Tune `> 0.05` (5%) and `for: 5m` as needed.

## Grafana Dashboards
- Add dashboards for business KPIs and system health.
- Use Prometheus as a data source.
