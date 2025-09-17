# RTO/RPO Documentation Template

## Recovery Time Objective (RTO)
- Definition: The maximum acceptable time to restore service after a failure.
- Target RTO: [e.g., 1 hour]
- Steps to Restore:
  1. Detect incident and notify on-call.
  2. Restore latest backup to production database.
  3. Validate application and data integrity.
  4. Communicate status to stakeholders.

## Recovery Point Objective (RPO)
- Definition: The maximum acceptable amount of data loss measured in time.
- Target RPO: [e.g., 15 minutes]
- Backup Frequency: [e.g., every 15 minutes]
- Backup Location: [e.g., S3, GCS, Azure Blob]

## Backup & Restore Procedures
- Automated backup script: see `.github/workflows/backup-restore.yml`
- Restore test: performed weekly, see workflow logs.
- Verification: add DB verification logic to ensure backup integrity.

## Contacts
- On-call engineer: [name/email/phone]
- Escalation: [escalation path]

## Last Updated: [date]
