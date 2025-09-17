# Runbook: Secrets Rotation

## Why
- Regularly rotating secrets reduces risk from leaks or ex-employees.

## Steps
1. Generate new secrets (use a password manager or `openssl rand -base64 32`).
2. Base64-encode new secrets for Kubernetes.
3. Update `k8s/secrets.yaml` with new values.
4. Apply secrets: `kubectl apply -f k8s/secrets.yaml`
5. Restart affected pods: `kubectl rollout restart deployment/beauty-crafter deployment/postgres deployment/redis`
6. Verify application health.
7. Document rotation in [incident-log.md](../incident-log.md)
