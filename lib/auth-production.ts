import { SignJWT, jwtVerify, decodeJwt } from 'jose'
import { randomBytes, createHash } from 'crypto'
import { logger } from './logging'
import { monitoring } from './monitoring'
import { cache } from './cache'

// JWT configuration
interface JWTConfig {
  accessTokenSecret: string
  refreshTokenSecret: string
  accessTokenExpiry: string
  refreshTokenExpiry: string
  issuer: string
  audience: string
}

// API Key configuration
interface APIKeyConfig {
  keyLength: number
  prefix: string
  rateLimitPerKey: number
  maxKeysPerUser: number
}

// User session information
interface UserSession {
  userId: string
  email: string
  role: string
  permissions: string[]
  lastActivity: Date
  ipAddress: string
  userAgent: string
}

// API Key information
interface APIKey {
  keyId: string
  userId: string
  name: string
  permissions: string[]
  rateLimit: number
  createdAt: Date
  lastUsed: Date
  isActive: boolean
  expiresAt?: Date
}

// Production authentication manager
export class ProductionAuthManager {
  private static instance: ProductionAuthManager
  private config: JWTConfig
  private apiKeyConfig: APIKeyConfig
  private activeSessions: Map<string, UserSession> = new Map()
  private apiKeys: Map<string, APIKey> = new Map()
  private refreshTokenBlacklist: Set<string> = new Set()

  private constructor() {
    this.config = {
      accessTokenSecret: process.env.JWT_ACCESS_SECRET || this.generateSecret(32),
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || this.generateSecret(32),
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: 'beauty-crafter-enterprise',
      audience: 'beauty-crafter-users'
    }

    this.apiKeyConfig = {
      keyLength: 32,
      prefix: 'bc_',
      rateLimitPerKey: 1000, // requests per hour
      maxKeysPerUser: 5
    }

    // Start session cleanup
    this.startSessionCleanup()
  }

  public static getInstance(): ProductionAuthManager {
    if (!ProductionAuthManager.instance) {
      ProductionAuthManager.instance = new ProductionAuthManager()
    }
    return ProductionAuthManager.instance
  }

  /**
   * Generate JWT access token
   */
  async generateAccessToken(user: UserSession): Promise<string> {
    try {
      const payload = {
        sub: user.userId,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.config.accessTokenExpiry),
        iss: this.config.issuer,
        aud: this.config.audience
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(this.config.accessTokenExpiry)
        .setIssuer(this.config.issuer)
        .setAudience(this.config.audience)
        .sign(new TextEncoder().encode(this.config.accessTokenSecret))

      // Record token generation
      monitoring.recordMetric('jwt_access_token_generated', 1, { userId: user.userId })
      logger.info('Access token generated', { userId: user.userId, platform: 'Beauty Crafter' })

      return token

    } catch (error) {
      monitoring.recordError(error as Error, 'jwt_access_token_generation')
      logger.error('Failed to generate access token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user.userId,
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Generate JWT refresh token
   */
  async generateRefreshToken(userId: string): Promise<string> {
    try {
      const tokenId = this.generateSecret(16)
      const payload = {
        sub: userId,
        jti: tokenId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.config.refreshTokenExpiry),
        iss: this.config.issuer,
        aud: this.config.audience
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(this.config.refreshTokenExpiry)
        .setIssuer(this.config.issuer)
        .setAudience(this.config.audience)
        .sign(new TextEncoder().encode(this.config.refreshTokenSecret))

      // Store refresh token in cache for validation
      await cache.set(`refresh_token:${tokenId}`, {
        userId,
        token,
        createdAt: new Date(),
        isActive: true
      }, { ttl: this.parseExpiry(this.config.refreshTokenExpiry) * 1000 })

      monitoring.recordMetric('jwt_refresh_token_generated', 1, { userId })
      logger.info('Refresh token generated', { userId, platform: 'Beauty Crafter' })

      return token

    } catch (error) {
      monitoring.recordError(error as Error, 'jwt_refresh_token_generation')
      logger.error('Failed to generate refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Verify JWT access token
   */
  async verifyAccessToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(this.config.accessTokenSecret), {
        issuer: this.config.issuer,
        audience: this.config.audience
      })

      // Check if token is blacklisted
      if (this.refreshTokenBlacklist.has(token)) {
        throw new Error('Token has been revoked')
      }

      monitoring.recordMetric('jwt_access_token_verified', 1, { userId: payload.sub as string })
      return payload

    } catch (error) {
      monitoring.recordMetric('jwt_access_token_verification_failed', 1)
      monitoring.recordError(error as Error, 'jwt_access_token_verification')
      throw error
    }
  }

  /**
   * Verify JWT refresh token
   */
  async verifyRefreshToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(this.config.refreshTokenSecret), {
        issuer: this.config.issuer,
        audience: this.config.audience
      })

      const tokenId = payload.jti as string
      if (!tokenId) {
        throw new Error('Invalid refresh token')
      }

      // Check if token exists in cache and is active
      const cachedToken = await cache.get(`refresh_token:${tokenId}`)
      if (!cachedToken || !cachedToken.isActive) {
        throw new Error('Refresh token not found or inactive')
      }

      monitoring.recordMetric('jwt_refresh_token_verified', 1, { userId: payload.sub as string })
      return payload

    } catch (error) {
      monitoring.recordMetric('jwt_refresh_token_verification_failed', 1)
      monitoring.recordError(error as Error, 'jwt_refresh_token_verification')
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken)
      const userId = payload.sub as string

      // Get user session
      const userSession = this.activeSessions.get(userId)
      if (!userSession) {
        throw new Error('User session not found')
      }

      // Generate new tokens
      const newAccessToken = await this.generateAccessToken(userSession)
      const newRefreshToken = await this.generateRefreshToken(userId)

      // Revoke old refresh token
      await this.revokeRefreshToken(userId, refreshToken)

      monitoring.recordMetric('jwt_tokens_refreshed', 1, { userId })
      logger.info('Tokens refreshed successfully', { userId, platform: 'Beauty Crafter' })

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }

    } catch (error) {
      monitoring.recordError(error as Error, 'jwt_token_refresh')
      logger.error('Failed to refresh tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const payload = decodeJwt(token)
      const tokenId = payload.jti as string

      if (tokenId) {
        // Remove from cache
        await cache.delete(`refresh_token:${tokenId}`)
        
        // Add to blacklist
        this.refreshTokenBlacklist.add(token)
        
        // Clean up blacklist periodically
        setTimeout(() => {
          this.refreshTokenBlacklist.delete(token)
        }, 60000) // Remove from blacklist after 1 minute
      }

      monitoring.recordMetric('jwt_refresh_token_revoked', 1, { userId })
      logger.info('Refresh token revoked', { userId, platform: 'Beauty Crafter' })

    } catch (error) {
      monitoring.recordError(error as Error, 'jwt_refresh_token_revocation')
      logger.error('Failed to revoke refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Generate API key
   */
  async generateAPIKey(userId: string, name: string, permissions: string[]): Promise<string> {
    try {
      // Check user's existing API keys
      const userKeys = Array.from(this.apiKeys.values()).filter(key => key.userId === userId)
      if (userKeys.length >= this.apiKeyConfig.maxKeysPerUser) {
        throw new Error(`Maximum API keys (${this.apiKeyConfig.maxKeysPerUser}) reached for user`)
      }

      const keyId = this.generateSecret(this.apiKeyConfig.keyLength)
      const apiKey = `${this.apiKeyConfig.prefix}${keyId}`

      const apiKeyData: APIKey = {
        keyId,
        userId,
        name,
        permissions,
        rateLimit: this.apiKeyConfig.rateLimitPerKey,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true
      }

      this.apiKeys.set(keyId, apiKeyData)

      // Store in cache for persistence
      await cache.set(`api_key:${keyId}`, apiKeyData, { ttl: 0 }) // No expiration

      monitoring.recordMetric('api_key_generated', 1, { userId })
      logger.info('API key generated', { userId, keyName: name, platform: 'Beauty Crafter' })

      return apiKey

    } catch (error) {
      monitoring.recordError(error as Error, 'api_key_generation')
      logger.error('Failed to generate API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(apiKey: string): Promise<{ valid: boolean; key?: APIKey; error?: string }> {
    try {
      if (!apiKey.startsWith(this.apiKeyConfig.prefix)) {
        return { valid: false, error: 'Invalid API key format' }
      }

      const keyId = apiKey.substring(this.apiKeyConfig.prefix.length)
      const keyData = this.apiKeys.get(keyId)

      if (!keyData || !keyData.isActive) {
        return { valid: false, error: 'API key not found or inactive' }
      }

      // Check expiration
      if (keyData.expiresAt && keyData.expiresAt < new Date()) {
        return { valid: false, error: 'API key expired' }
      }

      // Update last used
      keyData.lastUsed = new Date()
      this.apiKeys.set(keyId, keyData)

      // Update in cache
      await cache.set(`api_key:${keyId}`, keyData, { ttl: 0 })

      monitoring.recordMetric('api_key_validated', 1, { userId: keyData.userId })
      return { valid: true, key: keyData }

    } catch (error) {
      monitoring.recordError(error as Error, 'api_key_validation')
      return { valid: false, error: 'API key validation failed' }
    }
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(userId: string, keyId: string): Promise<boolean> {
    try {
      const keyData = this.apiKeys.get(keyId)
      if (!keyData || keyData.userId !== userId) {
        return false
      }

      keyData.isActive = false
      this.apiKeys.set(keyId, keyData)

      // Update in cache
      await cache.set(`api_key:${keyId}`, keyData, { ttl: 0 })

      monitoring.recordMetric('api_key_revoked', 1, { userId })
      logger.info('API key revoked', { userId, keyId, platform: 'Beauty Crafter' })

      return true

    } catch (error) {
      monitoring.recordError(error as Error, 'api_key_revocation')
      logger.error('Failed to revoke API key', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        keyId,
        platform: 'Beauty Crafter'
      })
      return false
    }
  }

  /**
   * Get user's API keys
   */
  async getUserAPIKeys(userId: string): Promise<APIKey[]> {
    return Array.from(this.apiKeys.values())
      .filter(key => key.userId === userId)
      .map(key => ({
        ...key,
        keyId: key.keyId.substring(0, 8) + '...' // Mask key ID for security
      }))
  }

  /**
   * Create user session
   */
  createUserSession(user: Omit<UserSession, 'lastActivity'>, ipAddress: string, userAgent: string): string {
    const sessionId = this.generateSecret(32)
    const session: UserSession = {
      ...user,
      lastActivity: new Date(),
      ipAddress,
      userAgent
    }

    this.activeSessions.set(sessionId, session)
    
    // Store in cache for persistence
    cache.set(`session:${sessionId}`, session, { ttl: 24 * 60 * 60 * 1000 }) // 24 hours

    monitoring.recordMetric('user_session_created', 1, { userId: user.userId })
    logger.info('User session created', { userId: user.userId, platform: 'Beauty Crafter' })

    return sessionId
  }

  /**
   * Get user session
   */
  getUserSession(sessionId: string): UserSession | undefined {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      // Update last activity
      session.lastActivity = new Date()
      this.activeSessions.set(sessionId, session)
      
      // Update in cache
      cache.set(`session:${sessionId}`, session, { ttl: 24 * 60 * 60 * 1000 })
    }
    return session
  }

  /**
   * Destroy user session
   */
  destroyUserSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      this.activeSessions.delete(sessionId)
      cache.delete(`session:${sessionId}`)
      
      monitoring.recordMetric('user_session_destroyed', 1, { userId: session.userId })
      logger.info('User session destroyed', { userId: session.userId, platform: 'Beauty Crafter' })
      
      return true
    }
    return false
  }

  /**
   * Start session cleanup process
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > maxAge) {
          this.destroyUserSession(sessionId)
        }
      }
    }, 60 * 60 * 1000) // Run every hour
  }

  /**
   * Generate secure random secret
   */
  private generateSecret(length: number): string {
    return randomBytes(length).toString('hex')
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 3600 // Default to 1 hour
    }

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 3600
      case 'd': return value * 86400
      default: return 3600
    }
  }

  /**
   * Get authentication statistics
   */
  getStats(): {
    activeSessions: number
    activeAPIKeys: number
    blacklistedTokens: number
  } {
    return {
      activeSessions: this.activeSessions.size,
      activeAPIKeys: Array.from(this.apiKeys.values()).filter(key => key.isActive).length,
      blacklistedTokens: this.refreshTokenBlacklist.size
    }
  }
}

// Export singleton instance
export const productionAuth = ProductionAuthManager.getInstance() 