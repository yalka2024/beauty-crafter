# Runbook: RBAC & Audit Logging Coverage

## Purpose
- Ensure all sensitive endpoints require authentication/authorization and are logged.

## Steps
1. Review all API routes in `app/api/`.
2. Confirm RBAC middleware is applied (see `scripts/rbac-middleware.ts`).
3. Confirm audit logging is enabled (see `scripts/audit-logging-middleware.ts`).
4. Test access with/without proper roles.
5. Check logs for access and denial events.
6. Document findings in [incident-log.md](../incident-log.md)
