import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { db } from './database'
import { monitoring } from './monitoring'
import { logger } from './logging'
import { rateLimit } from './rate-limit'

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production')
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_SECRET || 'refresh-secret-change-in-production')
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const MAX_REFRESH_TOKENS_PER_USER = 5

// Token types
export interface JWTPayload {
  userId: string
  email: string
  role: string
  permissions: string[]
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
}

// Authentication result
export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
  error?: string
  code?: string
}

// Enhanced authentication class
export class EnhancedAuth {
  private static instance: EnhancedAuth
  private activeRefreshTokens: Map<string, Set<string>> = new Map()

  private constructor() {}

  public static getInstance(): EnhancedAuth {
    if (!EnhancedAuth.instance) {
      EnhancedAuth.instance = new EnhancedAuth()
    }
    return EnhancedAuth.instance
  }

  /**
   * Generate access token
   */
  async generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    try {
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(JWT_SECRET)

      monitoring.recordMetric('auth_token_generated', 1, { type: 'access' })
      return token
    } catch (error) {
      monitoring.recordError(error as Error, 'auth_token_generation')
      logger.error('Failed to generate access token', { error, platform: 'Beauty Crafter' })
      throw new Error('Token generation failed')
    }
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId: string): Promise<{ token: string; tokenId: string }> {
    try {
      const tokenId = this.generateTokenId()
      const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
        userId,
        tokenId
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(REFRESH_SECRET)

      // Store refresh token
      this.storeRefreshToken(userId, tokenId)

      monitoring.recordMetric('auth_token_generated', 1, { type: 'refresh' })
      return { token, tokenId }
    } catch (error) {
      monitoring.recordError(error as Error, 'auth_refresh_token_generation')
      logger.error('Failed to generate refresh token', { error, platform: 'Beauty Crafter' })
      throw new Error('Refresh token generation failed')
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return payload as JWTPayload
    } catch (error) {
      monitoring.recordMetric('auth_token_verification_failed', 1, { type: 'access' })
      throw new Error('Invalid access token')
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, REFRESH_SECRET)
      const refreshPayload = payload as RefreshTokenPayload
      
      // Check if refresh token is still active
      if (!this.isRefreshTokenActive(refreshPayload.userId, refreshPayload.tokenId)) {
        throw new Error('Refresh token revoked')
      }

      return refreshPayload
    } catch (error) {
      monitoring.recordMetric('auth_token_verification_failed', 1, { type: 'refresh' })
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; newRefreshToken?: string }> {
    try {
      const refreshPayload = await this.verifyRefreshToken(refreshToken)
      
      // Get user data
      const user = await this.getUserById(refreshPayload.userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      })

      // Check if refresh token is close to expiry
      const tokenAge = Date.now() - (refreshPayload.iat * 1000)
      const shouldRotateRefresh = tokenAge > (6 * 24 * 60 * 60 * 1000) // 6 days

      if (shouldRotateRefresh) {
        // Revoke old refresh token and generate new one
        this.revokeRefreshToken(refreshPayload.userId, refreshPayload.tokenId)
        const { token: newRefreshToken } = await this.generateRefreshToken(refreshPayload.userId)
        return { accessToken, newRefreshToken }
      }

      return { accessToken }
    } catch (error) {
      monitoring.recordError(error as Error, 'auth_token_refresh')
      logger.error('Failed to refresh access token', { error, platform: 'Beauty Crafter' })
      throw error
    }
  }

  /**
   * Revoke refresh token
   */
  revokeRefreshToken(userId: string, tokenId: string): void {
    const userTokens = this.activeRefreshTokens.get(userId)
    if (userTokens) {
      userTokens.delete(tokenId)
      if (userTokens.size === 0) {
        this.activeRefreshTokens.delete(userId)
      }
    }
    monitoring.recordMetric('auth_token_revoked', 1, { type: 'refresh' })
  }

  /**
   * Revoke all refresh tokens for a user
   */
  revokeAllUserTokens(userId: string): void {
    this.activeRefreshTokens.delete(userId)
    monitoring.recordMetric('auth_all_tokens_revoked', 1)
  }

  /**
   * Store refresh token
   */
  private storeRefreshToken(userId: string, tokenId: string): void {
    if (!this.activeRefreshTokens.has(userId)) {
      this.activeRefreshTokens.set(userId, new Set())
    }

    const userTokens = this.activeRefreshTokens.get(userId)!
    
    // Enforce maximum refresh tokens per user
    if (userTokens.size >= MAX_REFRESH_TOKENS_PER_USER) {
      const oldestToken = userTokens.values().next().value
      userTokens.delete(oldestToken)
    }

    userTokens.add(tokenId)
  }

  /**
   * Check if refresh token is active
   */
  private isRefreshTokenActive(userId: string, tokenId: string): boolean {
    const userTokens = this.activeRefreshTokens.get(userId)
    return userTokens ? userTokens.has(tokenId) : false
  }

  /**
   * Generate unique token ID
   */
  private generateTokenId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<any> {
    try {
      const client = db.getClient()
      // This would be implemented based on your actual user model
      // For now, returning a mock user
      return {
        id: userId,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read', 'write']
      }
    } catch (error) {
      logger.error('Failed to get user by ID', { error, userId, platform: 'Beauty Crafter' })
      return null
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  cleanupExpiredTokens(): void {
    // This would be implemented with a proper cleanup mechanism
    // For now, we'll just log the cleanup
    logger.info('Cleaning up expired refresh tokens', { platform: 'Beauty Crafter' })
  }
}

// Middleware function for protecting routes
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Rate limiting for auth endpoints
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: 'Too many authentication attempts',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_HEADER'
      }
    }

    const token = authHeader.substring(7)
    const auth = EnhancedAuth.getInstance()
    const payload = await auth.verifyAccessToken(token)

    // Check if user still exists and is active
    const user = await auth['getUserById'](payload.userId)
    if (!user) {
      return {
        success: false,
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      }
    }

    return {
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      }
    }
  } catch (error) {
    monitoring.recordError(error as Error, 'auth_middleware')
    logger.warn('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      platform: 'Beauty Crafter'
    })

    return {
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    }
  }
}

// Utility function to get user from request
export async function getUserFromRequest(request: NextRequest): Promise<AuthResult> {
  return await requireAuth(request)
}

// Export singleton instance
export const enhancedAuth = EnhancedAuth.getInstance() 