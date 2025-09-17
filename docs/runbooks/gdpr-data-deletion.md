# Runbook: GDPR/CCPA Data Deletion Test

## Purpose
- Ensure user data can be deleted/anonymized on request.

## Steps
1. Identify a test user account (create a dummy if needed).
2. Trigger data deletion via API or admin tool:
   - Example: `curl -X DELETE https://your-domain.com/api/user/gdpr -d '{"userId": "test-user-id"}'`
3. Verify user data is deleted/anonymized in DB.
4. Check logs for audit trail.
5. Document test in [incident-log.md](../incident-log.md)
