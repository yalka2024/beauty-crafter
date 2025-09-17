# Runbook: Redis Down

## Symptoms
- Application errors (timeouts, cache misses)
- Alerts from monitoring/Prometheus

## Immediate Actions
1. Check Redis pod/container status: `kubectl get pods -l app=redis`
2. If down, restart: `kubectl rollout restart deployment/redis`
3. Check logs: `kubectl logs deployment/redis`
4. If persistent issues, escalate to DevOps/on-call.

## Postmortem
- Document root cause and actions in [incident-log.md](../incident-log.md)
