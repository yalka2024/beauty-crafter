# Runbook: Database Down

## Symptoms
- Application errors (500s)
- Cannot connect to database
- Alerts from monitoring/Prometheus

## Immediate Actions
1. Check DB pod/container status: `kubectl get pods -l app=postgres`
2. If down, restart: `kubectl rollout restart deployment/postgres`
3. Check logs: `kubectl logs deployment/postgres`
4. If data loss, restore from latest backup:
   - `node scripts/backup-restore.js restore <backup-file>`

## Escalation
- If DB does not recover, escalate to DBA/on-call engineer.

## Postmortem
- Document root cause and actions in [incident-log.md](../incident-log.md)
