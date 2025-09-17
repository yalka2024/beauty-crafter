# Disaster Recovery: Backup & Restore

## Database Backups
- Use `pg_dump` for Postgres backups (daily, encrypted)
- Store backups in secure, offsite storage (AWS S3, GCP, Azure)
- Retain for 30 days

## Restore Procedure
- Use `pg_restore` to restore from backup
- Test restores monthly

## Redis Backups
- Use Redis RDB/AOF persistence
- Store snapshots securely

## Automation
- Use cron jobs or managed DB backup services
