# Runbook: Rollback & Hotfix Procedures

## Rollback Deployment
1. Identify the last known good deployment (check GitHub Actions, container tags).
2. Roll back in Kubernetes:
   - `kubectl rollout undo deployment/beauty-crafter`
3. Monitor logs and health checks to confirm recovery.
4. Document the rollback in [incident-log.md](../incident-log.md)

## Hotfix Deployment
1. Create a hotfix branch from `main` or the last stable commit.
2. Apply and test the fix locally.
3. Push to GitHub and open a pull request.
4. Merge and trigger the CI/CD pipeline.
5. Monitor deployment and logs.
6. Document the hotfix in [incident-log.md](../incident-log.md)
