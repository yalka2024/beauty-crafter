# Runbook: Deployment Failure

## Symptoms
- New deployment fails health checks
- Application unavailable after deploy

## Immediate Actions
1. Check deployment status: `kubectl rollout status deployment/beauty-crafter`
2. Review logs: `kubectl logs deployment/beauty-crafter`
3. Roll back: `kubectl rollout undo deployment/beauty-crafter`
4. Notify team and investigate root cause.

## Postmortem
- Document root cause and actions in [incident-log.md](../incident-log.md)
