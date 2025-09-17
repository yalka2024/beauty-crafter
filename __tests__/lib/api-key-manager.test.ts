import { APIKeyManager, APIKeyConfig } from '@/lib/api-key-manager'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    apiKeyUsage: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

describe('APIKeyManager', () => {
  let apiKeyManager: APIKeyManager
  let mockConfig: APIKeyConfig

  beforeEach(() => {
    // Reset singleton instance
    (APIKeyManager as any).instance = undefined
    apiKeyManager = APIKeyManager.getInstance()
    
    // Reset mocks
    jest.clearAllMocks()
    
    mockConfig = {
      name: 'Test API Key',
      description: 'Test description',
      permissions: ['read', 'write'],
      rateLimit: {
        requests: 1000,
        window: 3600
      },
      allowedIPs: ['127.0.0.1'],
      allowedOrigins: ['https://example.com'],
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      isActive: true
    }
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = APIKeyManager.getInstance()
      const instance2 = APIKeyManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('generateAPIKey', () => {
    it('should generate API key and secret successfully', async () => {
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: mockConfig.name,
        description: mockConfig.description,
        permissions: mockConfig.permissions,
        rateLimitRequests: mockConfig.rateLimit.requests,
        rateLimitWindow: mockConfig.rateLimit.window,
        allowedIPs: mockConfig.allowedIPs,
        allowedOrigins: mockConfig.allowedOrigins,
        expiresAt: mockConfig.expiresAt,
        isActive: mockConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)

      const result = await apiKeyManager.generateAPIKey(mockConfig)

      expect(result.key).toMatch(/^bc_[a-f0-9]{32}$/)
      expect(result.secret).toMatch(/^[a-f0-9]{64}$/)
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: result.key,
          hashedSecret: expect.any(String),
          name: mockConfig.name,
          description: mockConfig.description,
          permissions: mockConfig.permissions,
          rateLimitRequests: mockConfig.rateLimit.requests,
          rateLimitWindow: mockConfig.rateLimit.window,
          allowedIPs: mockConfig.allowedIPs,
          allowedOrigins: mockConfig.allowedOrigins,
          expiresAt: mockConfig.expiresAt,
          isActive: mockConfig.isActive
        })
      })
    })

    it('should handle database errors gracefully', async () => {
      (prisma.apiKey.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      await expect(apiKeyManager.generateAPIKey(mockConfig)).rejects.toThrow('Failed to generate API key')
    })
  })

  describe('validateAPIKey', () => {
    it('should validate cached API key successfully', async () => {
      // First generate a key to cache it
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: mockConfig.name,
        description: mockConfig.description,
        permissions: mockConfig.permissions,
        rateLimitRequests: mockConfig.rateLimit.requests,
        rateLimitWindow: mockConfig.rateLimit.window,
        allowedIPs: mockConfig.allowedIPs,
        allowedOrigins: mockConfig.allowedOrigins,
        expiresAt: mockConfig.expiresAt,
        isActive: mockConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(mockConfig)

      // Now validate the cached key
      const result = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1',
        'https://example.com'
      )

      expect(result.isValid).toBe(true)
      expect(result.config).toEqual(mockConfig)
    })

    it('should reject inactive API key', async () => {
      const inactiveConfig = { ...mockConfig, isActive: false }
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: inactiveConfig.name,
        description: inactiveConfig.description,
        permissions: inactiveConfig.permissions,
        rateLimitRequests: inactiveConfig.rateLimit.requests,
        rateLimitWindow: inactiveConfig.rateLimit.window,
        allowedIPs: inactiveConfig.allowedIPs,
        allowedOrigins: inactiveConfig.allowedOrigins,
        expiresAt: inactiveConfig.expiresAt,
        isActive: inactiveConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(inactiveConfig)

      const result = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('API key is inactive')
    })

    it('should reject expired API key', async () => {
      const expiredConfig = { 
        ...mockConfig, 
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      }
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: expiredConfig.name,
        description: expiredConfig.description,
        permissions: expiredConfig.permissions,
        rateLimitRequests: expiredConfig.rateLimit.requests,
        rateLimitWindow: expiredConfig.rateLimit.window,
        allowedIPs: expiredConfig.allowedIPs,
        allowedOrigins: expiredConfig.allowedOrigins,
        expiresAt: expiredConfig.expiresAt,
        isActive: expiredConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(expiredConfig)

      const result = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('API key has expired')
    })

    it('should reject API key from unauthorized IP', async () => {
      // Create a modified config with different allowed IPs
      const testConfig = {
        ...mockConfig,
        allowedIPs: ['192.168.1.1'] // Different IP than the one we'll test with
      }
      
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: testConfig.name,
        description: testConfig.description,
        permissions: testConfig.permissions,
        rateLimitRequests: testConfig.rateLimit.requests,
        rateLimitWindow: testConfig.rateLimit.window,
        allowedIPs: testConfig.allowedIPs,
        allowedOrigins: testConfig.allowedOrigins,
        expiresAt: testConfig.expiresAt,
        isActive: testConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(testConfig)

      const result = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1' // Different IP
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('IP address not allowed')
    })

    it('should reject API key from unauthorized origin', async () => {
      // Create a modified config with different allowed origins
      const testConfig = {
        ...mockConfig,
        allowedOrigins: ['https://trusted-site.com'] // Different origin than the one we'll test with
      }
      
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: testConfig.name,
        description: testConfig.description,
        permissions: testConfig.permissions,
        rateLimitRequests: testConfig.rateLimit.requests,
        rateLimitWindow: testConfig.rateLimit.window,
        allowedIPs: testConfig.allowedIPs,
        allowedOrigins: testConfig.allowedOrigins,
        expiresAt: testConfig.expiresAt,
        isActive: testConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(testConfig)

      const result = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1',
        'https://example.com' // Different origin
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Origin not allowed')
    })

    it('should validate API key from database when not cached', async () => {
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: mockConfig.name,
        description: mockConfig.description,
        permissions: mockConfig.permissions,
        rateLimitRequests: mockConfig.rateLimit.requests,
        rateLimitWindow: mockConfig.rateLimit.window,
        allowedIPs: mockConfig.allowedIPs,
        allowedOrigins: mockConfig.allowedOrigins,
        expiresAt: mockConfig.expiresAt,
        isActive: mockConfig.isActive
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey)

      const result = await apiKeyManager.validateAPIKey(
        'bc_test123',
        'test_secret_that_will_be_hashed',
        '127.0.0.1'
      )

      expect(result.isValid).toBe(false) // Will fail because secret doesn't match
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { key: 'bc_test123' }
      })
    })
  })

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      // First generate a key to cache it
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: mockConfig.name,
        description: mockConfig.description,
        permissions: mockConfig.permissions,
        rateLimitRequests: mockConfig.rateLimit.requests,
        rateLimitWindow: mockConfig.rateLimit.window,
        allowedIPs: mockConfig.allowedIPs,
        allowedOrigins: mockConfig.allowedOrigins,
        expiresAt: mockConfig.expiresAt,
        isActive: mockConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(mockConfig)

      const result = await apiKeyManager.checkRateLimit(generated.key, '/api/test')

      expect(result.isLimited).toBe(false)
      expect(result.remaining).toBe(999) // 1000 - 1
      expect(result.resetTime).toBeInstanceOf(Date)
    })

    it('should block requests exceeding rate limit', async () => {
      // Create a modified config with low rate limit
      const testConfig = {
        ...mockConfig,
        rateLimit: {
          requests: 2, // Low limit for testing
          window: 3600
        }
      }
      
      // First generate a key to cache it
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: testConfig.name,
        description: testConfig.description,
        permissions: testConfig.permissions,
        rateLimitRequests: testConfig.rateLimit.requests,
        rateLimitWindow: testConfig.rateLimit.window,
        allowedIPs: testConfig.allowedIPs,
        allowedOrigins: testConfig.allowedOrigins,
        expiresAt: testConfig.expiresAt,
        isActive: testConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(testConfig)

      // First request
      await apiKeyManager.checkRateLimit(generated.key, '/api/test')
      
      // Second request
      await apiKeyManager.checkRateLimit(generated.key, '/api/test')
      
      // Third request should be limited
      const result = await apiKeyManager.checkRateLimit(generated.key, '/api/test')

      expect(result.isLimited).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should reset rate limit after window expires', async () => {
      // Create a modified config with very low rate limit and short window
      const testConfig = {
        ...mockConfig,
        rateLimit: {
          requests: 1, // Very low limit for testing
          window: 1 // 1 second window
        }
      }
      
      // First generate a key to cache it
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: testConfig.name,
        description: testConfig.description,
        permissions: testConfig.permissions,
        rateLimitRequests: testConfig.rateLimit.requests,
        rateLimitWindow: testConfig.rateLimit.window,
        allowedIPs: testConfig.allowedIPs,
        allowedOrigins: testConfig.allowedOrigins,
        expiresAt: testConfig.expiresAt,
        isActive: testConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(testConfig)

      // First request
      await apiKeyManager.checkRateLimit(generated.key, '/api/test')
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should be allowed again
      const result = await apiKeyManager.checkRateLimit(generated.key, '/api/test')

      expect(result.isLimited).toBe(false)
      expect(result.remaining).toBe(0) // 1 - 1
    })
  })

  describe('logUsage', () => {
    it('should log API key usage successfully', async () => {
      const usage = {
        keyId: 'test-key-id',
        endpoint: '/api/test',
        method: 'GET',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        responseTime: 150,
        statusCode: 200,
        success: true
      }

      ;(prisma.apiKeyUsage.create as jest.Mock).mockResolvedValue({ id: 'usage-id' })

      await apiKeyManager.logUsage(usage)

      expect(prisma.apiKeyUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...usage,
          timestamp: expect.any(Date)
        })
      })
    })

    it('should handle logging errors gracefully', async () => {
      const usage = {
        keyId: 'test-key-id',
        endpoint: '/api/test',
        method: 'GET',
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        responseTime: 150,
        statusCode: 200,
        success: true
      }

      ;(prisma.apiKeyUsage.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      // Should not throw
      await expect(apiKeyManager.logUsage(usage)).resolves.toBeUndefined()
    })
  })

  describe('revokeAPIKey', () => {
    it('should revoke API key successfully', async () => {
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({ id: 'test-id', isActive: false })

      const result = await apiKeyManager.revokeAPIKey('bc_test123')

      expect(result).toBe(true)
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { key: 'bc_test123' },
        data: { isActive: false }
      })
    })

    it('should handle revocation errors gracefully', async () => {
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await apiKeyManager.revokeAPIKey('bc_test123')

      expect(result).toBe(false)
    })
  })

  describe('getAPIKeyStats', () => {
    it('should return API key statistics', async () => {
      const mockUsage = [
        {
          id: 'usage-1',
          endpoint: '/api/test1',
          method: 'GET',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          timestamp: new Date(),
          responseTime: 100,
          statusCode: 200,
          success: true
        },
        {
          id: 'usage-2',
          endpoint: '/api/test2',
          method: 'POST',
          ipAddress: '127.0.0.2',
          userAgent: 'Test Agent',
          timestamp: new Date(),
          responseTime: 200,
          statusCode: 500,
          success: false
        }
      ]

      ;(prisma.apiKeyUsage.findMany as jest.Mock).mockResolvedValue(mockUsage)

      const stats = await apiKeyManager.getAPIKeyStats('test-key-id', 30)

      expect(stats.totalRequests).toBe(2)
      expect(stats.successfulRequests).toBe(1)
      expect(stats.failedRequests).toBe(1)
      expect(stats.averageResponseTime).toBe(150)
      expect(stats.topEndpoints).toHaveLength(2)
      expect(stats.topIPs).toHaveLength(2)
    })

    it('should handle empty usage data', async () => {
      ;(prisma.apiKeyUsage.findMany as jest.Mock).mockResolvedValue([])

      const stats = await apiKeyManager.getAPIKeyStats('test-key-id', 30)

      expect(stats.totalRequests).toBe(0)
      expect(stats.successfulRequests).toBe(0)
      expect(stats.failedRequests).toBe(0)
      expect(stats.averageResponseTime).toBe(0)
      expect(stats.topEndpoints).toHaveLength(0)
      expect(stats.topIPs).toHaveLength(0)
    })
  })

  describe('Cache Management', () => {
    it('should cache API key configurations', async () => {
      const mockApiKey = {
        id: 'test-id',
        key: 'bc_test123',
        hashedSecret: 'hashed_secret',
        name: mockConfig.name,
        description: mockConfig.description,
        permissions: mockConfig.permissions,
        rateLimitRequests: mockConfig.rateLimit.requests,
        rateLimitWindow: mockConfig.rateLimit.window,
        allowedIPs: mockConfig.allowedIPs,
        allowedOrigins: mockConfig.allowedOrigins,
        expiresAt: mockConfig.expiresAt,
        isActive: mockConfig.isActive
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      const generated = await apiKeyManager.generateAPIKey(mockConfig)

      // Should be cached now
      const result = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1'
      )

      expect(result.isValid).toBe(true)
      
      // Database should not be called again for cached key
      jest.clearAllMocks()
      
      const cachedResult = await apiKeyManager.validateAPIKey(
        generated.key,
        generated.secret,
        '127.0.0.1'
      )

      expect(cachedResult.isValid).toBe(true)
      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled()
    })
  })
})
