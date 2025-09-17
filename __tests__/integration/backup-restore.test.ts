import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { IntegratedBackupManager } from '../../scripts/backup-integration'
import fs from 'fs/promises'
import path from 'path'

describe('Backup/Restore Integration Tests', () => {
  let prisma: PrismaClient
  let backupManager: IntegratedBackupManager
  let testData: any

  beforeAll(async () => {
    prisma = new PrismaClient()
    backupManager = new IntegratedBackupManager({
      databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beauty_crafter_test',
      backupDir: './test-backups',
      retentionDays: 1,
      encryptionEnabled: true,
      compressionEnabled: true
    })

    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    })
  })

  beforeEach(async () => {
    // Create test data
    testData = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
        role: 'CLIENT',
        status: 'ACTIVE'
      }
    })

    await prisma.service.create({
      data: {
        name: 'Test Service',
        description: 'Test service description',
        category: 'FACIAL',
        price: 100,
        duration: 60,
        isActive: true,
        providerId: testData.id
      }
    })

    await prisma.booking.create({
      data: {
        userId: testData.id,
        serviceId: 'test-service-id',
        providerId: testData.id,
        scheduledAt: new Date(),
        status: 'PENDING',
        totalAmount: 100
      }
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
    
    // Clean up test backups
    try {
      await fs.rmdir('./test-backups', { recursive: true })
    } catch (error) {
      // Directory might not exist
    }
  })

  describe('Backup Creation', () => {
    it('should create encrypted backup successfully', async () => {
      const result = await backupManager.createIntegratedBackup('test-backup')
      
      expect(result.success).toBe(true)
      expect(result.backupPath).toBeTruthy()
      expect(result.backupPath).toContain('.enc')
    })

    it('should create compressed backup successfully', async () => {
      const result = await backupManager.createIntegratedBackup('test-backup-compressed')
      
      expect(result.success).toBe(true)
      expect(result.backupPath).toBeTruthy()
      expect(result.backupPath).toContain('.gz')
    })

    it('should verify backup integrity', async () => {
      const result = await backupManager.createIntegratedBackup('test-backup-integrity')
      
      expect(result.success).toBe(true)
      
      const verification = await backupManager.verifyBackup(result.backupPath!)
      expect(verification.valid).toBe(true)
    })

    it('should handle backup creation errors gracefully', async () => {
      // Test with invalid database URL
      const invalidBackupManager = new IntegratedBackupManager({
        databaseUrl: 'invalid-url',
        backupDir: './test-backups'
      })

      const result = await invalidBackupManager.createIntegratedBackup('test-backup-error')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('Backup Restoration', () => {
    let backupPath: string

    beforeEach(async () => {
      // Create a backup for restoration tests
      const result = await backupManager.createIntegratedBackup('restore-test-backup')
      backupPath = result.backupPath!
    })

    it('should restore backup successfully', async () => {
      // Clear existing data
      await prisma.booking.deleteMany()
      await prisma.service.deleteMany()
      await prisma.user.deleteMany()

      // Restore from backup
      const result = await backupManager.restoreIntegratedBackup(backupPath)
      
      expect(result.success).toBe(true)

      // Verify data was restored
      const users = await prisma.user.findMany()
      const services = await prisma.service.findMany()
      const bookings = await prisma.booking.findMany()

      expect(users.length).toBeGreaterThan(0)
      expect(services.length).toBeGreaterThan(0)
      expect(bookings.length).toBeGreaterThan(0)
    })

    it('should handle restoration errors gracefully', async () => {
      const result = await backupManager.restoreIntegratedBackup('non-existent-backup.sql')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should verify restore integrity', async () => {
      // Clear data
      await prisma.booking.deleteMany()
      await prisma.service.deleteMany()
      await prisma.user.deleteMany()

      // Restore
      const result = await backupManager.restoreIntegratedBackup(backupPath)
      expect(result.success).toBe(true)

      // Verify critical tables exist and have data
      const userCount = await prisma.user.count()
      const serviceCount = await prisma.service.count()
      const bookingCount = await prisma.booking.count()

      expect(userCount).toBeGreaterThan(0)
      expect(serviceCount).toBeGreaterThan(0)
      expect(bookingCount).toBeGreaterThan(0)
    })
  })

  describe('Incremental Backup', () => {
    it('should create incremental backup successfully', async () => {
      const lastBackupDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      const result = await backupManager.createIncrementalBackup(lastBackupDate)
      
      expect(result.success).toBe(true)
      expect(result.backupPath).toBeTruthy()
      expect(result.backupPath).toContain('.json')
    })

    it('should include only changed data in incremental backup', async () => {
      const lastBackupDate = new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      
      const result = await backupManager.createIncrementalBackup(lastBackupDate)
      
      expect(result.success).toBe(true)
      
      // Read and verify incremental backup content
      const backupContent = JSON.parse(await fs.readFile(result.backupPath!, 'utf8'))
      
      expect(backupContent).toHaveProperty('timestamp')
      expect(backupContent).toHaveProperty('lastBackupDate')
      expect(backupContent).toHaveProperty('users')
      expect(backupContent).toHaveProperty('bookings')
      expect(backupContent.users.length).toBeGreaterThan(0)
    })
  })

  describe('Backup Cleanup', () => {
    it('should cleanup expired backups', async () => {
      // Create old backup file
      const oldBackupPath = './test-backups/old-backup.sql'
      await fs.mkdir('./test-backups', { recursive: true })
      await fs.writeFile(oldBackupPath, 'old backup content')
      
      // Set file modification time to 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      await fs.utimes(oldBackupPath, twoDaysAgo, twoDaysAgo)
      
      // Run cleanup
      const cleanupCount = await backupManager.cleanupExpiredTokens()
      
      // Verify old backup was cleaned up
      try {
        await fs.access(oldBackupPath)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.code).toBe('ENOENT') // File should not exist
      }
    })
  })

  describe('Backup Encryption/Decryption', () => {
    it('should encrypt backup data', async () => {
      const result = await backupManager.createIntegratedBackup('encrypted-backup')
      
      expect(result.success).toBe(true)
      expect(result.backupPath).toContain('.enc')
      
      // Verify file is encrypted (not plain SQL)
      const encryptedContent = await fs.readFile(result.backupPath!, 'utf8')
      expect(encryptedContent).not.toContain('CREATE TABLE')
      expect(encryptedContent).toContain('{') // Should be JSON format
    })

    it('should decrypt backup data during restoration', async () => {
      const result = await backupManager.createIntegratedBackup('decrypt-test-backup')
      
      expect(result.success).toBe(true)
      
      // Clear data
      await prisma.booking.deleteMany()
      await prisma.service.deleteMany()
      await prisma.user.deleteMany()
      
      // Restore should work with encrypted backup
      const restoreResult = await backupManager.restoreIntegratedBackup(result.backupPath!)
      expect(restoreResult.success).toBe(true)
    })
  })

  describe('Backup Compression', () => {
    it('should compress backup data', async () => {
      const result = await backupManager.createIntegratedBackup('compressed-backup')
      
      expect(result.success).toBe(true)
      expect(result.backupPath).toContain('.gz')
      
      // Verify file is compressed
      const stats = await fs.stat(result.backupPath!)
      expect(stats.size).toBeGreaterThan(0)
    })

    it('should decompress backup data during restoration', async () => {
      const result = await backupManager.createIntegratedBackup('decompress-test-backup')
      
      expect(result.success).toBe(true)
      
      // Clear data
      await prisma.booking.deleteMany()
      await prisma.service.deleteMany()
      await prisma.user.deleteMany()
      
      // Restore should work with compressed backup
      const restoreResult = await backupManager.restoreIntegratedBackup(result.backupPath!)
      expect(restoreResult.success).toBe(true)
    })
  })

  describe('Scheduled Backups', () => {
    it('should start scheduled backups', () => {
      // This test verifies the method doesn't throw
      expect(() => {
        backupManager.startScheduledBackups()
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const invalidBackupManager = new IntegratedBackupManager({
        databaseUrl: 'postgresql://invalid:invalid@localhost:5432/invalid',
        backupDir: './test-backups'
      })

      const result = await invalidBackupManager.createIntegratedBackup('error-test')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle file system errors', async () => {
      const invalidBackupManager = new IntegratedBackupManager({
        databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beauty_crafter_test',
        backupDir: '/invalid/path/that/does/not/exist'
      })

      const result = await invalidBackupManager.createIntegratedBackup('error-test')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })
})

