import { prisma } from './prisma'
import { logger } from './logging'
import { encryption } from './encryption'

interface APIKeyConfig {
  name: string
  description?: string
  permissions: string[]
  rateLimit?: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
  allowedIPs?: string[]
  allowedOrigins?: string[]
  expiresAt?: Date
}

interface APIKeyData {
  id: string
  key: string
  name: string
  description?: string
  userId: string
  permissions: string[]
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
  allowedIPs: string[]
  allowedOrigins: string[]
  isActive: boolean
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class APIKeyManager {
  private static instance: APIKeyManager
  private keyCache: Map<string, APIKeyData> = new Map()
  private usageCache: Map<string, { count: number; resetTime: number }> = new Map()

  private constructor() {
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.cleanupCache()
    }, 5 * 60 * 1000)
  }

  public static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager()
    }
    return APIKeyManager.instance
  }

  /**
   * Generate new API key
   */
  async generateAPIKey(userId: string, config: APIKeyConfig): Promise<APIKeyData> {
    try {
      const keyId = encryption.generateSecureRandom(16)
      const keySecret = encryption.generateApiKey()
      const hashedKey = await encryption.hashPassword(keySecret, encryption.generateSecureRandom(32))

      const apiKeyData: APIKeyData = {
        id: keyId,
        key: keySecret,
        name: config.name,
        description: config.description,
        userId,
        permissions: config.permissions,
        rateLimit: config.rateLimit || {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        },
        allowedIPs: config.allowedIPs || [],
        allowedOrigins: config.allowedOrigins || [],
        isActive: true,
        expiresAt: config.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Store in database
      await prisma.apiKey.create({
        data: {
          id: keyId,
          keyHash: hashedKey.hash,
          keySalt: hashedKey.salt,
          name: config.name,
          description: config.description,
          userId,
          permissions: config.permissions,
          rateLimit: JSON.stringify(apiKeyData.rateLimit),
          allowedIPs: config.allowedIPs || [],
          allowedOrigins: config.allowedOrigins || [],
          isActive: true,
          expiresAt: config.expiresAt
        }
      })

      // Cache the key
      this.keyCache.set(keyId, apiKeyData)

      logger.info('API key generated', { 
        keyId, 
        userId, 
        name: config.name 
      })

      return apiKeyData
    } catch (error) {
      logger.error('Failed to generate API key', { error, userId })
      throw new Error('API key generation failed')
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(key: string, ipAddress?: string, origin?: string): Promise<{
    isValid: boolean
    keyData?: APIKeyData
    error?: string
  }> {
    try {
      // Extract key ID from key (first 16 characters)
      const keyId = key.substring(0, 16)
      
      // Check cache first
      let keyData = this.keyCache.get(keyId)
      
      if (!keyData) {
        // Load from database
        const dbKey = await prisma.apiKey.findUnique({
          where: { id: keyId }
        })

        if (!dbKey) {
          return { isValid: false, error: 'Invalid API key' }
        }

        // Verify key hash
        const isValidKey = await encryption.verifyPassword(key, dbKey.keyHash, dbKey.keySalt)
        if (!isValidKey) {
          return { isValid: false, error: 'Invalid API key' }
        }

        keyData = {
          id: dbKey.id,
          key: key, // Store original key for cache
          name: dbKey.name,
          description: dbKey.description,
          userId: dbKey.userId,
          permissions: dbKey.permissions,
          rateLimit: JSON.parse(dbKey.rateLimit),
          allowedIPs: dbKey.allowedIPs,
          allowedOrigins: dbKey.allowedOrigins,
          isActive: dbKey.isActive,
          lastUsedAt: dbKey.lastUsedAt,
          expiresAt: dbKey.expiresAt,
          createdAt: dbKey.createdAt,
          updatedAt: dbKey.updatedAt
        }

        // Cache the key
        this.keyCache.set(keyId, keyData)
      }

      // Check if key is active
      if (!keyData.isActive) {
        return { isValid: false, error: 'API key is inactive' }
      }

      // Check expiration
      if (keyData.expiresAt && keyData.expiresAt < new Date()) {
        return { isValid: false, error: 'API key has expired' }
      }

      // Check IP restrictions
      if (ipAddress && keyData.allowedIPs.length > 0) {
        if (!keyData.allowedIPs.includes(ipAddress)) {
          return { isValid: false, error: 'IP address not allowed' }
        }
      }

      // Check origin restrictions
      if (origin && keyData.allowedOrigins.length > 0) {
        if (!keyData.allowedOrigins.includes(origin)) {
          return { isValid: false, error: 'Origin not allowed' }
        }
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit(keyId, keyData.rateLimit)
      if (!rateLimitCheck.allowed) {
        return { 
          isValid: false, 
          error: `Rate limit exceeded: ${rateLimitCheck.limitType}` 
        }
      }

      // Update last used
      await this.updateLastUsed(keyId)

      return { isValid: true, keyData }
    } catch (error) {
      logger.error('API key validation failed', { error, key: key.substring(0, 8) + '...' })
      return { isValid: false, error: 'Validation failed' }
    }
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(keyId: string, rateLimit: any): Promise<{
    allowed: boolean
    limitType?: string
  }> {
    try {
      const now = Date.now()
      const minute = Math.floor(now / 60000)
      const hour = Math.floor(now / 3600000)
      const day = Math.floor(now / 86400000)

      // Check minute limit
      const minuteKey = `${keyId}:minute:${minute}`
      const minuteCount = this.usageCache.get(minuteKey)?.count || 0
      if (minuteCount >= rateLimit.requestsPerMinute) {
        return { allowed: false, limitType: 'per minute' }
      }

      // Check hour limit
      const hourKey = `${keyId}:hour:${hour}`
      const hourCount = this.usageCache.get(hourKey)?.count || 0
      if (hourCount >= rateLimit.requestsPerHour) {
        return { allowed: false, limitType: 'per hour' }
      }

      // Check day limit
      const dayKey = `${keyId}:day:${day}`
      const dayCount = this.usageCache.get(dayKey)?.count || 0
      if (dayCount >= rateLimit.requestsPerDay) {
        return { allowed: false, limitType: 'per day' }
      }

      // Increment counters
      this.incrementUsage(minuteKey)
      this.incrementUsage(hourKey)
      this.incrementUsage(dayKey)

      return { allowed: true }
    } catch (error) {
      logger.error('Rate limit check failed', { error, keyId })
      return { allowed: true } // Allow on error
    }
  }

  /**
   * Increment usage counter
   */
  private incrementUsage(key: string): void {
    const now = Date.now()
    const current = this.usageCache.get(key)
    
    if (current) {
      current.count++
    } else {
      this.usageCache.set(key, { count: 1, resetTime: now })
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() }
      })

      // Update cache
      const keyData = this.keyCache.get(keyId)
      if (keyData) {
        keyData.lastUsedAt = new Date()
      }
    } catch (error) {
      logger.error('Failed to update last used', { error, keyId })
    }
  }

  /**
   * Get user's API keys
   */
  async getUserAPIKeys(userId: string): Promise<APIKeyData[]> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return keys.map(key => ({
        id: key.id,
        key: '***' + key.id.substring(key.id.length - 4), // Masked key
        name: key.name,
        description: key.description,
        userId: key.userId,
        permissions: key.permissions,
        rateLimit: JSON.parse(key.rateLimit),
        allowedIPs: key.allowedIPs,
        allowedOrigins: key.allowedOrigins,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt
      }))
    } catch (error) {
      logger.error('Failed to get user API keys', { error, userId })
      return []
    }
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
    try {
      await prisma.apiKey.update({
        where: { 
          id: keyId,
          userId // Ensure user can only revoke their own keys
        },
        data: { isActive: false }
      })

      // Remove from cache
      this.keyCache.delete(keyId)

      logger.info('API key revoked', { keyId, userId })
      return true
    } catch (error) {
      logger.error('Failed to revoke API key', { error, keyId, userId })
      return false
    }
  }

  /**
   * Update API key
   */
  async updateAPIKey(keyId: string, userId: string, updates: Partial<APIKeyConfig>): Promise<boolean> {
    try {
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.permissions) updateData.permissions = updates.permissions
      if (updates.rateLimit) updateData.rateLimit = JSON.stringify(updates.rateLimit)
      if (updates.allowedIPs) updateData.allowedIPs = updates.allowedIPs
      if (updates.allowedOrigins) updateData.allowedOrigins = updates.allowedOrigins
      if (updates.expiresAt) updateData.expiresAt = updates.expiresAt

      await prisma.apiKey.update({
        where: { 
          id: keyId,
          userId
        },
        data: updateData
      })

      // Update cache
      const keyData = this.keyCache.get(keyId)
      if (keyData) {
        Object.assign(keyData, updates)
        keyData.updatedAt = new Date()
      }

      logger.info('API key updated', { keyId, userId })
      return true
    } catch (error) {
      logger.error('Failed to update API key', { error, keyId, userId })
      return false
    }
  }

  /**
   * Clean up expired keys and usage cache
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const now = new Date()
      
      // Remove expired keys from database
      const result = await prisma.apiKey.deleteMany({
        where: {
          expiresAt: { lt: now }
        }
      })

      // Remove from cache
      for (const [keyId, keyData] of this.keyCache.entries()) {
        if (keyData.expiresAt && keyData.expiresAt < now) {
          this.keyCache.delete(keyId)
        }
      }

      logger.info('Expired API keys cleaned up', { count: result.count })
      return result.count
    } catch (error) {
      logger.error('Failed to cleanup expired keys', { error })
      return 0
    }
  }

  /**
   * Clean up usage cache
   */
  private cleanupCache(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, data] of this.usageCache.entries()) {
      // Remove entries older than 1 hour
      if (now - data.resetTime > 3600000) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.usageCache.delete(key))
  }

  /**
   * Get API key statistics
   */
  async getAPIKeyStats(): Promise<{
    totalKeys: number
    activeKeys: number
    expiredKeys: number
    totalUsage: number
  }> {
    try {
      const totalKeys = await prisma.apiKey.count()
      const activeKeys = await prisma.apiKey.count({
        where: { isActive: true }
      })
      const expiredKeys = await prisma.apiKey.count({
        where: { 
          expiresAt: { lt: new Date() }
        }
      })

      return {
        totalKeys,
        activeKeys,
        expiredKeys,
        totalUsage: this.usageCache.size
      }
    } catch (error) {
      logger.error('Failed to get API key stats', { error })
      return {
        totalKeys: 0,
        activeKeys: 0,
        expiredKeys: 0,
        totalUsage: 0
      }
    }
  }
}

// Export singleton instance
export const apiKeyManager = APIKeyManager.getInstance()