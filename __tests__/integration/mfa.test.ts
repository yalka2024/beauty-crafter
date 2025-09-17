import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { MFA } from '../../lib/mfa'
import { prisma } from '../../lib/prisma'

describe('MFA Integration Tests', () => {
  let testUser: any

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    })
  })

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
        role: 'CLIENT',
        status: 'ACTIVE'
      }
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('MFA Secret Generation', () => {
    it('should generate MFA secret successfully', async () => {
      const result = await MFA.generateSecret(testUser.id)
      
      expect(result).toHaveProperty('secret')
      expect(result).toHaveProperty('qrCodeUrl')
      expect(result).toHaveProperty('backupCodes')
      expect(result.secret).toBeTruthy()
      expect(result.qrCodeUrl).toMatch(/^data:image\/png;base64,/)
      expect(result.backupCodes).toHaveLength(10)
    })

    it('should store MFA secret in database', async () => {
      const result = await MFA.generateSecret(testUser.id)
      
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaSecret: true, mfaBackupCodes: true }
      })
      
      expect(user?.mfaSecret).toBe(result.secret)
      expect(user?.mfaBackupCodes).toEqual(result.backupCodes)
    })

    it('should generate unique secrets for different users', async () => {
      const user2 = await prisma.user.create({
        data: {
          email: 'test2@example.com',
          name: 'Test User 2',
          password: 'hashedPassword123',
          role: 'CLIENT',
          status: 'ACTIVE'
        }
      })

      const secret1 = await MFA.generateSecret(testUser.id)
      const secret2 = await MFA.generateSecret(user2.id)
      
      expect(secret1.secret).not.toBe(secret2.secret)
      expect(secret1.backupCodes).not.toEqual(secret2.backupCodes)
    })
  })

  describe('MFA Token Verification', () => {
    beforeEach(async () => {
      // Setup MFA for test user
      await MFA.generateSecret(testUser.id)
    })

    it('should verify valid TOTP token', async () => {
      // Note: In real tests, you'd use a proper TOTP library to generate valid tokens
      // For this test, we'll mock the verification
      const mockToken = '123456'
      
      // Mock the authenticator.verify function
      const originalVerify = require('otplib').authenticator.verify
      require('otplib').authenticator.verify = jest.fn().mockReturnValue(true)
      
      const result = await MFA.verifyToken(testUser.id, mockToken)
      
      expect(result.isValid).toBe(true)
      expect(result.isBackupCode).toBe(false)
      
      // Restore original function
      require('otplib').authenticator.verify = originalVerify
    })

    it('should verify backup codes', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaBackupCodes: true }
      })
      
      const backupCode = user?.mfaBackupCodes[0]
      const result = await MFA.verifyToken(testUser.id, backupCode!)
      
      expect(result.isValid).toBe(true)
      expect(result.isBackupCode).toBe(true)
    })

    it('should remove used backup codes', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaBackupCodes: true }
      })
      
      const originalCount = user?.mfaBackupCodes.length || 0
      const backupCode = user?.mfaBackupCodes[0]
      
      await MFA.verifyToken(testUser.id, backupCode!)
      
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaBackupCodes: true }
      })
      
      expect(updatedUser?.mfaBackupCodes.length).toBe(originalCount - 1)
      expect(updatedUser?.mfaBackupCodes).not.toContain(backupCode)
    })

    it('should reject invalid tokens', async () => {
      const result = await MFA.verifyToken(testUser.id, 'invalid')
      
      expect(result.isValid).toBe(false)
    })

    it('should reject tokens for user without MFA setup', async () => {
      const userWithoutMFA = await prisma.user.create({
        data: {
          email: 'nomfa@example.com',
          name: 'No MFA User',
          password: 'hashedPassword123',
          role: 'CLIENT',
          status: 'ACTIVE'
        }
      })
      
      const result = await MFA.verifyToken(userWithoutMFA.id, '123456')
      
      expect(result.isValid).toBe(false)
    })
  })

  describe('MFA Enable/Disable', () => {
    beforeEach(async () => {
      await MFA.generateSecret(testUser.id)
    })

    it('should enable MFA with valid token', async () => {
      // Mock valid token verification
      const originalVerify = require('otplib').authenticator.verify
      require('otplib').authenticator.verify = jest.fn().mockReturnValue(true)
      
      const result = await MFA.enableMFA(testUser.id, '123456')
      
      expect(result).toBe(true)
      
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaEnabled: true }
      })
      
      expect(user?.mfaEnabled).toBe(true)
      
      // Restore original function
      require('otplib').authenticator.verify = originalVerify
    })

    it('should not enable MFA with invalid token', async () => {
      const result = await MFA.enableMFA(testUser.id, 'invalid')
      
      expect(result).toBe(false)
      
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaEnabled: true }
      })
      
      expect(user?.mfaEnabled).toBe(false)
    })

    it('should disable MFA with valid password', async () => {
      // First enable MFA
      await MFA.enableMFA(testUser.id, '123456')
      
      // Then disable with password
      const result = await MFA.disableMFA(testUser.id, 'hashedPassword123')
      
      expect(result).toBe(true)
      
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { 
          mfaEnabled: true, 
          mfaSecret: true, 
          mfaBackupCodes: true 
        }
      })
      
      expect(user?.mfaEnabled).toBe(false)
      expect(user?.mfaSecret).toBeNull()
      expect(user?.mfaBackupCodes).toEqual([])
    })

    it('should not disable MFA with invalid password', async () => {
      await MFA.enableMFA(testUser.id, '123456')
      
      const result = await MFA.disableMFA(testUser.id, 'wrongPassword')
      
      expect(result).toBe(false)
      
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaEnabled: true }
      })
      
      expect(user?.mfaEnabled).toBe(true)
    })
  })

  describe('MFA Status Check', () => {
    it('should return false for user without MFA', async () => {
      const result = await MFA.isEnabled(testUser.id)
      expect(result).toBe(false)
    })

    it('should return true for user with MFA enabled', async () => {
      await MFA.generateSecret(testUser.id)
      await MFA.enableMFA(testUser.id, '123456')
      
      const result = await MFA.isEnabled(testUser.id)
      expect(result).toBe(true)
    })

    it('should return false for non-existent user', async () => {
      const result = await MFA.isEnabled('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalCreate = prisma.user.create
      prisma.user.create = jest.fn().mockRejectedValue(new Error('Database error'))
      
      await expect(MFA.generateSecret('invalid-id')).rejects.toThrow('Failed to generate MFA secret')
      
      // Restore original function
      prisma.user.create = originalCreate
    })

    it('should handle invalid user ID in verification', async () => {
      const result = await MFA.verifyToken('invalid-id', '123456')
      expect(result.isValid).toBe(false)
    })
  })
})

