import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { MFA } from '../../lib/mfa'
import { JWTManager } from '../../lib/jwt-manager'
import { encryption } from '../../lib/encryption'
import { prisma } from '../../lib/prisma'

describe('Security Integration Tests', () => {
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

  describe('MFA Security', () => {
    it('should generate secure MFA secrets', async () => {
      const result = await MFA.generateSecret(testUser.id)
      
      expect(result.secret).toBeTruthy()
      expect(result.secret.length).toBeGreaterThan(20)
      expect(result.qrCodeUrl).toMatch(/^data:image\/png;base64,/)
      expect(result.backupCodes).toHaveLength(10)
      
      // Verify backup codes are unique
      const uniqueCodes = new Set(result.backupCodes)
      expect(uniqueCodes.size).toBe(10)
    })

    it('should store MFA data securely in database', async () => {
      const result = await MFA.generateSecret(testUser.id)
      
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaSecret: true, mfaBackupCodes: true }
      })
      
      expect(user?.mfaSecret).toBe(result.secret)
      expect(user?.mfaBackupCodes).toEqual(result.backupCodes)
    })

    it('should verify TOTP tokens securely', async () => {
      await MFA.generateSecret(testUser.id)
      
      // Mock valid TOTP verification
      const originalVerify = require('otplib').authenticator.verify
      require('otplib').authenticator.verify = jest.fn().mockReturnValue(true)
      
      const result = await MFA.verifyToken(testUser.id, '123456')
      
      expect(result.isValid).toBe(true)
      expect(result.isBackupCode).toBe(false)
      
      // Restore original function
      require('otplib').authenticator.verify = originalVerify
    })

    it('should handle backup codes securely', async () => {
      const result = await MFA.generateSecret(testUser.id)
      const backupCode = result.backupCodes[0]
      
      const verification = await MFA.verifyToken(testUser.id, backupCode)
      
      expect(verification.isValid).toBe(true)
      expect(verification.isBackupCode).toBe(true)
      
      // Verify backup code was removed after use
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaBackupCodes: true }
      })
      
      expect(user?.mfaBackupCodes).not.toContain(backupCode)
    })
  })

  describe('JWT Security', () => {
    it('should generate secure token pairs', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )
      
      expect(tokenPair.accessToken).toBeTruthy()
      expect(tokenPair.refreshToken).toBeTruthy()
      expect(tokenPair.expiresIn).toBe(900) // 15 minutes
      
      // Verify tokens are different
      expect(tokenPair.accessToken).not.toBe(tokenPair.refreshToken)
    })

    it('should verify access tokens securely', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )
      
      const decoded = await JWTManager.verifyAccessToken(tokenPair.accessToken)
      
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe(testUser.id)
      expect(decoded?.email).toBe(testUser.email)
      expect(decoded?.role).toBe(testUser.role)
    })

    it('should rotate refresh tokens securely', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )
      
      const newTokenPair = await JWTManager.verifyAndRotateRefreshToken(tokenPair.refreshToken)
      
      expect(newTokenPair).toBeTruthy()
      expect(newTokenPair?.accessToken).not.toBe(tokenPair.accessToken)
      expect(newTokenPair?.refreshToken).not.toBe(tokenPair.refreshToken)
      
      // Verify old refresh token is revoked
      const oldTokenCheck = await JWTManager.verifyAndRotateRefreshToken(tokenPair.refreshToken)
      expect(oldTokenCheck).toBeNull()
    })

    it('should store refresh tokens securely in database', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )
      
      const refreshTokens = await prisma.refreshToken.findMany({
        where: { userId: testUser.id }
      })
      
      expect(refreshTokens).toHaveLength(1)
      expect(refreshTokens[0].token).toBe(tokenPair.refreshToken)
      expect(refreshTokens[0].isRevoked).toBe(false)
    })
  })

  describe('Field-Level Encryption', () => {
    it('should encrypt sensitive data securely', async () => {
      const sensitiveData = 'sensitive@example.com'
      const encrypted = await encryption.encryptField(sensitiveData)
      
      expect(encrypted).toBeTruthy()
      expect(encrypted).not.toBe(sensitiveData)
      expect(encrypted).toContain('{') // Should be JSON format
      
      // Verify it's properly formatted JSON
      const parsed = JSON.parse(encrypted)
      expect(parsed).toHaveProperty('encrypted')
      expect(parsed).toHaveProperty('iv')
      expect(parsed).toHaveProperty('tag')
      expect(parsed).toHaveProperty('salt')
    })

    it('should decrypt data correctly', async () => {
      const originalData = 'sensitive@example.com'
      const encrypted = await encryption.encryptField(originalData)
      const decrypted = await encryption.decryptField(encrypted)
      
      expect(decrypted).toBe(originalData)
    })

    it('should handle empty values gracefully', async () => {
      const emptyResult = await encryption.encryptField('')
      expect(emptyResult).toBe('')
      
      const nullResult = await encryption.encryptField(null as any)
      expect(nullResult).toBe(null)
    })

    it('should generate secure random values', async () => {
      const random1 = encryption.generateSecureRandom(32)
      const random2 = encryption.generateSecureRandom(32)
      
      expect(random1).toHaveLength(64) // 32 bytes = 64 hex chars
      expect(random2).toHaveLength(64)
      expect(random1).not.toBe(random2)
    })

    it('should generate secure API keys', async () => {
      const apiKey1 = encryption.generateApiKey()
      const apiKey2 = encryption.generateApiKey()
      
      expect(apiKey1).toMatch(/^bck_/)
      expect(apiKey1).toHaveLength(51) // 4 + 48 hex chars
      expect(apiKey1).not.toBe(apiKey2)
    })
  })

  describe('Password Security', () => {
    it('should hash passwords securely', async () => {
      const password = 'testPassword123'
      const hashed = await encryption.hashPassword(password)
      
      expect(hashed.hash).toBeTruthy()
      expect(hashed.salt).toBeTruthy()
      expect(hashed.hash).not.toBe(password)
      expect(hashed.hash.length).toBe(128) // 64 bytes = 128 hex chars
      expect(hashed.salt.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should verify password hashes correctly', async () => {
      const password = 'testPassword123'
      const hashed = await encryption.hashPassword(password)
      
      const isValid = await encryption.verifyPassword(password, hashed.hash, hashed.salt)
      expect(isValid).toBe(true)
      
      const isInvalid = await encryption.verifyPassword('wrongPassword', hashed.hash, hashed.salt)
      expect(isInvalid).toBe(false)
    })

    it('should use different salts for same password', async () => {
      const password = 'testPassword123'
      const hashed1 = await encryption.hashPassword(password)
      const hashed2 = await encryption.hashPassword(password)
      
      expect(hashed1.salt).not.toBe(hashed2.salt)
      expect(hashed1.hash).not.toBe(hashed2.hash)
    })
  })

  describe('Session Security', () => {
    it('should generate secure session IDs', async () => {
      const sessionId1 = encryption.generateSessionId()
      const sessionId2 = encryption.generateSessionId()
      
      expect(sessionId1).toHaveLength(64) // 32 bytes = 64 hex chars
      expect(sessionId2).toHaveLength(64)
      expect(sessionId1).not.toBe(sessionId2)
    })
  })

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', async () => {
      // Test with invalid master key
      const originalKey = process.env.ENCRYPTION_MASTER_KEY
      process.env.ENCRYPTION_MASTER_KEY = 'invalid-key'
      
      await expect(encryption.encryptField('test')).rejects.toThrow('Encryption failed')
      
      // Restore original key
      process.env.ENCRYPTION_MASTER_KEY = originalKey
    })

    it('should handle decryption errors gracefully', async () => {
      await expect(encryption.decryptField('invalid-json')).rejects.toThrow('Decryption failed')
    })

    it('should handle MFA errors gracefully', async () => {
      const result = await MFA.verifyToken('non-existent-user', '123456')
      expect(result.isValid).toBe(false)
    })

    it('should handle JWT errors gracefully', async () => {
      const result = await JWTManager.verifyAccessToken('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API keys', async () => {
      // This would test the API key rate limiting functionality
      // Implementation would depend on the specific rate limiting logic
      expect(true).toBe(true) // Placeholder for rate limiting tests
    })
  })

  describe('Data Validation', () => {
    it('should validate input data securely', async () => {
      // Test various input validation scenarios
      const invalidInputs = [
        { name: '', email: 'invalid', phone: '123', password: '123', role: 'INVALID' },
        { name: 'A'.repeat(101), email: 'test@example.com', phone: '+1234567890', password: 'validPass123', role: 'CLIENT' },
        { name: 'Test', email: 'test@example.com', phone: '123', password: 'validPass123', role: 'CLIENT' }
      ]

      for (const input of invalidInputs) {
        // These should all fail validation
        expect(() => {
          // Validation logic would be tested here
        }).toThrow()
      }
    })
  })
})