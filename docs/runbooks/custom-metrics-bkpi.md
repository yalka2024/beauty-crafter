# Runbook: Custom Metrics & Business KPIs

## Purpose
- Track business-critical metrics (e.g., bookings, revenue, churn).

## Steps
1. Identify key business metrics with stakeholders.
2. Instrument code to emit metrics (see `lib/prometheus-exporter.ts`, `lib/monitoring.ts`).
3. Expose metrics at `/api/metrics` for Prometheus scraping.
4. Add Prometheus alert rules for KPIs as needed.
5. Visualize in Grafana dashboards.
6. Review and tune regularly with business/ops teams.
