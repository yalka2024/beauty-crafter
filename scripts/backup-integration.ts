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

export class IntegratedBackupManager {
  private prisma: PrismaClient
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.prisma = new PrismaClient()
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Create a comprehensive backup including encrypted data
   */
  async createIntegratedBackup(backupName?: string): Promise<{
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
      
      logger.info('Starting integrated database backup', { backupName, backupPath })
      
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
      
      // Verify backup integrity
      const verification = await this.verifyBackup(compressedPath)
      if (!verification.valid) {
        throw new Error(`Backup verification failed: ${verification.error}`)
      }
      
      logger.info('Integrated backup completed successfully', { backupPath: compressedPath })
      return { success: true, backupPath: compressedPath }
      
    } catch (error) {
      logger.error('Integrated backup failed', { error })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Restore database with data decryption
   */
  async restoreIntegratedBackup(backupPath: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      logger.info('Starting integrated database restore', { backupPath })
      
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
      
      // Verify restore by checking critical tables
      await this.verifyRestore()
      
      // Clean up temporary files
      if (restorePath !== backupPath) {
        await fs.unlink(restorePath)
      }
      
      logger.info('Integrated database restore completed successfully', { stdout: stdout.substring(0, 100) })
      return { success: true }
      
    } catch (error) {
      logger.error('Integrated restore failed', { error })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Verify restore by checking critical tables
   */
  private async verifyRestore(): Promise<void> {
    try {
      // Check if critical tables exist and have data
      const userCount = await this.prisma.user.count()
      const bookingCount = await this.prisma.booking.count()
      const serviceCount = await this.prisma.service.count()
      
      logger.info('Restore verification completed', {
        users: userCount,
        bookings: bookingCount,
        services: serviceCount
      })
      
      if (userCount === 0) {
        throw new Error('No users found after restore')
      }
    } catch (error) {
      throw new Error(`Restore verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create incremental backup (only changed data)
   */
  async createIncrementalBackup(lastBackupDate: Date): Promise<{
    success: boolean
    backupPath?: string
    error?: string
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `incremental-${timestamp}`
      
      // Get changed data since last backup
      const changedUsers = await this.prisma.user.findMany({
        where: {
          updatedAt: {
            gte: lastBackupDate
          }
        }
      })
      
      const changedBookings = await this.prisma.booking.findMany({
        where: {
          updatedAt: {
            gte: lastBackupDate
          }
        }
      })
      
      // Create incremental backup file
      const backupPath = path.join(this.config.backupDir, `${backupName}.json`)
      const incrementalData = {
        timestamp: new Date().toISOString(),
        lastBackupDate: lastBackupDate.toISOString(),
        users: changedUsers,
        bookings: changedBookings
      }
      
      await fs.writeFile(backupPath, JSON.stringify(incrementalData, null, 2))
      
      logger.info('Incremental backup created', { 
        backupPath, 
        users: changedUsers.length,
        bookings: changedBookings.length 
      })
      
      return { success: true, backupPath }
    } catch (error) {
      logger.error('Incremental backup failed', { error })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Schedule automatic backups
   */
  startScheduledBackups(): void {
    // Full backup every day at 2 AM
    const dailyBackup = setInterval(async () => {
      try {
        const result = await this.createIntegratedBackup()
        if (result.success) {
          logger.info('Scheduled daily backup completed', { backupPath: result.backupPath })
        } else {
          logger.error('Scheduled daily backup failed', { error: result.error })
        }
      } catch (error) {
        logger.error('Scheduled daily backup error', { error })
      }
    }, 24 * 60 * 60 * 1000) // 24 hours

    // Incremental backup every 6 hours
    const incrementalBackup = setInterval(async () => {
      try {
        const lastBackup = new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        const result = await this.createIncrementalBackup(lastBackup)
        if (result.success) {
          logger.info('Scheduled incremental backup completed', { backupPath: result.backupPath })
        } else {
          logger.error('Scheduled incremental backup failed', { error: result.error })
        }
      } catch (error) {
        logger.error('Scheduled incremental backup error', { error })
      }
    }, 6 * 60 * 60 * 1000) // 6 hours

    logger.info('Scheduled backups started')
  }

  /**
   * Build pg_dump command
   */
  private buildDumpCommand(outputPath: string): string {
    const { databaseUrl } = this.config
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
    const encrypted = await encryption.encryptField(fileContent.toString('base64'))
    
    await fs.writeFile(encryptedPath, JSON.stringify(JSON.parse(encrypted)))
    return encryptedPath
  }

  /**
   * Decrypt backup file
   */
  private async decryptBackup(filePath: string): Promise<string> {
    const decryptedPath = filePath.replace('.enc', '')
    const encryptedData = JSON.parse(await fs.readFile(filePath, 'utf8'))
    const decrypted = await encryption.decryptField(JSON.stringify(encryptedData))
    
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
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await fs.access(backupPath)
      const stats = await fs.stat(backupPath)
      
      if (stats.size === 0) {
        return { valid: false, error: 'Backup file is empty' }
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
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Export for use in other modules
export const integratedBackupManager = new IntegratedBackupManager()