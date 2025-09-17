import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { encryption } from '../lib/encryption'
import { logger } from '../lib/logging'

const execAsync = promisify(exec)

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  encryptionEnabled: boolean
  compressionEnabled: boolean
  s3Bucket?: string
  s3Region?: string
}

const defaultConfig: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
  compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  s3Region: process.env.BACKUP_S3_REGION || 'us-east-1'
}

export class BackupRestoreManager {
  private prisma: PrismaClient
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.prisma = new PrismaClient()
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Create a full database backup
   */
  async createBackup(backupName?: string): Promise<{
    success: boolean
    backupPath?: string
    error?: string
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = backupName || `backup-${timestamp}`
      
      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true })
      
      const backupPath = path.join(this.config.backupDir, `${backupName}.sql`)
      const compressedPath = this.config.compressionEnabled ? `${backupPath}.gz` : backupPath
      
      logger.info('Starting database backup', { backupName, backupPath })
      
      // Create database dump
      const dumpCommand = this.buildDumpCommand(backupPath)
      const { stdout, stderr } = await execAsync(dumpCommand)
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_dump error: ${stderr}`)
      }
      
      logger.info('Database dump completed', { stdout: stdout.substring(0, 100) })
      
      // Compress if enabled
      if (this.config.compressionEnabled) {
        await this.compressFile(backupPath, compressedPath)
        await fs.unlink(backupPath) // Remove uncompressed file
      }
      
      // Encrypt if enabled
      if (this.config.encryptionEnabled) {
        const encryptedPath = await this.encryptBackup(compressedPath)
        await fs.unlink(compressedPath) // Remove unencrypted file
        return { success: true, backupPath: encryptedPath }
      }
      
      // Upload to S3 if configured
      if (this.config.s3Bucket) {
        await this.uploadToS3(compressedPath, backupName)
      }
      
      logger.info('Backup completed successfully', { backupPath: compressedPath })
      return { success: true, backupPath: compressedPath }
      
    } catch (error) {
      logger.error('Backup failed', { error })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      logger.info('Starting database restore', { backupPath })
      
      // Check if backup file exists
      await fs.access(backupPath)
      
      let restorePath = backupPath
      
      // Decrypt if needed
      if (this.config.encryptionEnabled && backupPath.endsWith('.enc')) {
        restorePath = await this.decryptBackup(backupPath)
      }
      
      // Decompress if needed
      if (restorePath.endsWith('.gz')) {
        const decompressedPath = restorePath.replace('.gz', '')
        await this.decompressFile(restorePath, decompressedPath)
        restorePath = decompressedPath
      }
      
      // Restore database
      const restoreCommand = this.buildRestoreCommand(restorePath)
      const { stdout, stderr } = await execAsync(restoreCommand)
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_restore error: ${stderr}`)
      }
      
      // Clean up temporary files
      if (restorePath !== backupPath) {
        await fs.unlink(restorePath)
      }
      
      logger.info('Database restore completed successfully', { stdout: stdout.substring(0, 100) })
      return { success: true }
      
    } catch (error) {
      logger.error('Restore failed', { error })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{
    name: string
    path: string
    size: number
    createdAt: Date
    encrypted: boolean
    compressed: boolean
  }>> {
    try {
      const files = await fs.readdir(this.config.backupDir)
      const backups = []
      
      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.sql.gz') || file.endsWith('.sql.enc')) {
          const filePath = path.join(this.config.backupDir, file)
          const stats = await fs.stat(filePath)
          
          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            encrypted: file.endsWith('.enc'),
            compressed: file.endsWith('.gz') || file.endsWith('.sql.gz.enc')
          })
        }
      }
      
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      logger.error('Failed to list backups', { error })
      return []
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)
      
      let deletedCount = 0
      
      for (const backup of backups) {
        if (backup.createdAt < cutoffDate) {
          await fs.unlink(backup.path)
          deletedCount++
          logger.info('Deleted old backup', { name: backup.name })
        }
      }
      
      logger.info('Backup cleanup completed', { deletedCount })
      return deletedCount
    } catch (error) {
      logger.error('Backup cleanup failed', { error })
      return 0
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      // Check if file exists and is readable
      await fs.access(backupPath)
      
      // For SQL dumps, we can check the header
      if (backupPath.endsWith('.sql') || backupPath.endsWith('.sql.gz')) {
        // This is a simplified check - in production you'd want more thorough validation
        const stats = await fs.stat(backupPath)
        if (stats.size === 0) {
          return { valid: false, error: 'Backup file is empty' }
        }
      }
      
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Build pg_dump command
   */
  private buildDumpCommand(outputPath: string): string {
    const { databaseUrl } = this.config
    const url = new URL(databaseUrl)
    
    return `pg_dump "${databaseUrl}" --no-password --verbose --format=custom --file="${outputPath}"`
  }

  /**
   * Build pg_restore command
   */
  private buildRestoreCommand(inputPath: string): string {
    const { databaseUrl } = this.config
    
    return `pg_restore "${databaseUrl}" --no-password --verbose --clean --if-exists "${inputPath}"`
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(inputPath: string, outputPath: string): Promise<void> {
    const { stdout, stderr } = await execAsync(`gzip -c "${inputPath}" > "${outputPath}"`)
    if (stderr) {
      throw new Error(`Compression error: ${stderr}`)
    }
  }

  /**
   * Decompress file using gunzip
   */
  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const { stdout, stderr } = await execAsync(`gunzip -c "${inputPath}" > "${outputPath}"`)
    if (stderr) {
      throw new Error(`Decompression error: ${stderr}`)
    }
  }

  /**
   * Encrypt backup file
   */
  private async encryptBackup(filePath: string): Promise<string> {
    const encryptedPath = `${filePath}.enc`
    const fileContent = await fs.readFile(filePath)
    const encrypted = await encryption.encrypt(fileContent.toString('base64'))
    
    await fs.writeFile(encryptedPath, JSON.stringify(encrypted))
    return encryptedPath
  }

  /**
   * Decrypt backup file
   */
  private async decryptBackup(filePath: string): Promise<string> {
    const decryptedPath = filePath.replace('.enc', '')
    const encryptedData = JSON.parse(await fs.readFile(filePath, 'utf8'))
    const decrypted = await encryption.decrypt(
      encryptedData.encrypted,
      encryptedData.iv,
      encryptedData.tag,
      encryptedData.salt
    )
    
    await fs.writeFile(decryptedPath, Buffer.from(decrypted, 'base64'))
    return decryptedPath
  }

  /**
   * Upload backup to S3
   */
  private async uploadToS3(filePath: string, backupName: string): Promise<void> {
    if (!this.config.s3Bucket) return
    
    const s3Key = `backups/${backupName}`
    const command = `aws s3 cp "${filePath}" "s3://${this.config.s3Bucket}/${s3Key}" --region ${this.config.s3Region}`
    
    const { stdout, stderr } = await execAsync(command)
    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(`S3 upload error: ${stderr}`)
    }
    
    logger.info('Backup uploaded to S3', { s3Key })
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// CLI interface
if (require.main === module) {
  const manager = new BackupRestoreManager()
  
  const command = process.argv[2]
  const arg = process.argv[3]
  
  switch (command) {
    case 'backup':
      manager.createBackup(arg)
        .then(result => {
          console.log(result.success ? 'Backup created successfully' : `Backup failed: ${result.error}`)
          process.exit(result.success ? 0 : 1)
        })
        .catch(error => {
          console.error('Backup error:', error)
          process.exit(1)
        })
      break
      
    case 'restore':
      if (!arg) {
        console.error('Please provide backup file path')
        process.exit(1)
      }
      manager.restoreBackup(arg)
        .then(result => {
          console.log(result.success ? 'Restore completed successfully' : `Restore failed: ${result.error}`)
          process.exit(result.success ? 0 : 1)
        })
        .catch(error => {
          console.error('Restore error:', error)
          process.exit(1)
        })
      break
      
    case 'list':
      manager.listBackups()
        .then(backups => {
          console.log('Available backups:')
          backups.forEach(backup => {
            console.log(`- ${backup.name} (${backup.size} bytes, ${backup.createdAt.toISOString()})`)
          })
        })
        .catch(error => {
          console.error('List error:', error)
          process.exit(1)
        })
      break
      
    case 'cleanup':
      manager.cleanupOldBackups()
        .then(count => {
          console.log(`Cleaned up ${count} old backups`)
        })
        .catch(error => {
          console.error('Cleanup error:', error)
          process.exit(1)
        })
      break
      
    default:
      console.log('Usage: node backup-restore-production.ts [backup|restore <file>|list|cleanup]')
      process.exit(1)
  }
}
