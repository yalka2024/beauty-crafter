# Production Readiness Validation Checklist

## CI/CD Pipeline
- [ ] Push a change to `main` and verify all GitHub Actions workflows complete successfully.
- [ ] Confirm Docker image is built and pushed.
- [ ] Deploy to staging/production using Kubernetes manifests.
- [ ] Run smoke tests on deployed environment.

## Disaster Recovery Drill
- [ ] Simulate DB loss (delete/stop DB pod).
- [ ] Restore from backup using `node scripts/backup-restore.js restore <backup-file>`.
- [ ] Validate application and data integrity.
- [ ] Document drill in [incident-log.md](incident-log.md).

## Incident Simulation & Postmortem
- [ ] Simulate a real incident (e.g., high error rate, outage).
- [ ] Follow runbooks to resolve.
- [ ] Complete postmortem in [incident-log.md](incident-log.md).
