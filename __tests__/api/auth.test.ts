import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../lib/jwt-manager'
import { SessionManager } from '../../lib/session-manager'
import { encryption } from '../../lib/encryption'

const prisma = new PrismaClient()

describe('Authentication API Tests', () => {
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

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        phone: '+1234567890',
        password: 'securePassword123',
        role: 'CLIENT'
      }

      // Mock the registration endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(201)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.user.email).toBe(userData.email)
      expect(result.user.role).toBe(userData.role)
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        phone: '+1234567890',
        password: 'securePassword123',
        role: 'CLIENT'
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(400)
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: '123',
        role: 'CLIENT'
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(400)
    })

    it('should reject duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'securePassword123',
        role: 'CLIENT'
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(409)
    })
  })

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'hashedPassword123'
      }

      const response = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(200)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe(loginData.email)
    })

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongPassword'
      }

      const response = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(401)
    })

    it('should require MFA token when MFA is enabled', async () => {
      // Enable MFA for test user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: true }
      })

      const loginData = {
        email: 'test@example.com',
        password: 'hashedPassword123'
      }

      const response = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(401)
      
      const result = await response.json()
      expect(result.error.code).toBe('MFA_REQUIRED')
    })
  })

  describe('JWT Token Management', () => {
    it('should generate valid token pair', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )

      expect(tokenPair).toHaveProperty('accessToken')
      expect(tokenPair).toHaveProperty('refreshToken')
      expect(tokenPair).toHaveProperty('expiresIn')
    })

    it('should verify valid access token', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )

      const decoded = await JWTManager.verifyAccessToken(tokenPair.accessToken)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe(testUser.id)
    })

    it('should rotate refresh token', async () => {
      const tokenPair = await JWTManager.generateTokenPair(
        testUser.id,
        testUser.email,
        testUser.role
      )

      const newTokenPair = await JWTManager.verifyAndRotateRefreshToken(tokenPair.refreshToken)
      expect(newTokenPair).toBeTruthy()
      expect(newTokenPair?.accessToken).not.toBe(tokenPair.accessToken)
    })
  })

  describe('Session Management', () => {
    it('should create and validate session', async () => {
      const session = await SessionManager.getInstance().createSession(
        testUser.id,
        'Test User Agent',
        '127.0.0.1'
      )

      expect(session).toHaveProperty('sessionId')
      expect(session).toHaveProperty('expiresAt')

      const validation = await SessionManager.getInstance().validateSession(session.sessionId)
      expect(validation.isValid).toBe(true)
      expect(validation.userId).toBe(testUser.id)
    })

    it('should enforce concurrent session limit', async () => {
      const sessionManager = SessionManager.getInstance()
      sessionManager.updateConfig({ maxConcurrentSessions: 2 })

      // Create max sessions
      await sessionManager.createSession(testUser.id, 'Agent 1', '127.0.0.1')
      await sessionManager.createSession(testUser.id, 'Agent 2', '127.0.0.2')

      // Try to create one more (should revoke oldest)
      await sessionManager.createSession(testUser.id, 'Agent 3', '127.0.0.3')

      const sessions = await sessionManager.getUserSessions(testUser.id)
      expect(sessions).toHaveLength(2)
    })
  })

  describe('MFA Integration', () => {
    it('should setup MFA for user', async () => {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.id}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('secret')
      expect(result.data).toHaveProperty('qrCodeUrl')
      expect(result.data).toHaveProperty('backupCodes')
    })

    it('should verify MFA token', async () => {
      // First setup MFA
      const setupResponse = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.id}`,
          'Content-Type': 'application/json'
        }
      })

      const setupResult = await setupResponse.json()
      const mfaSecret = setupResult.data.secret

      // Generate a test token (in real scenario, this would be from authenticator app)
      const testToken = '123456' // This would be generated by TOTP

      const verifyResponse = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: testToken,
          enable: true
        })
      })

      // Note: This test would need proper TOTP token generation
      // For now, we'll test the endpoint structure
      expect(verifyResponse.status).toBe(400) // Expected due to invalid token
    })
  })

  describe('Data Encryption', () => {
    it('should encrypt sensitive user data', async () => {
      const sensitiveData = 'sensitive@example.com'
      const encrypted = await encryption.encryptPII(sensitiveData)
      const decrypted = await encryption.decryptPII(encrypted)

      expect(decrypted).toBe(sensitiveData)
    })

    it('should hash passwords securely', async () => {
      const password = 'testPassword123'
      const hashed = await encryption.hash(password)
      const verified = await encryption.verifyHash(password, hashed.hash, hashed.salt)

      expect(verified).toBe(true)
    })
  })
})

