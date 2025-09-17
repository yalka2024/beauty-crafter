# Runbook: High Error Rate

## Symptoms
- Alert from Prometheus: HighErrorRate
- Many 5xx errors in logs

## Immediate Actions
1. Check recent deploys/changes.
2. Review logs: `kubectl logs deployment/beauty-crafter`
3. Roll back if needed: `kubectl rollout undo deployment/beauty-crafter`
4. Check dependencies (DB, Redis, external APIs).

## Escalation
- If unresolved, escalate to engineering lead.

## Postmortem
- Document root cause and actions in [incident-log.md](../incident-log.md)
