import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import crypto from 'crypto'

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface TokenPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export class JWTManager {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

  /**
   * Generate token pair (access + refresh)
   */
  static async generateTokenPair(
    userId: string, 
    email: string, 
    role: string
  ): Promise<TokenPair> {
    try {
      // Generate JTI (JWT ID) for refresh token
      const jti = crypto.randomUUID()
      
      // Create access token
      const accessToken = jwt.sign(
        { userId, email, role },
        this.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRY }
      )
      
      // Create refresh token
      const refreshToken = jwt.sign(
        { userId, email, role, jti },
        this.JWT_REFRESH_SECRET,
        { expiresIn: this.REFRESH_TOKEN_EXPIRY }
      )
      
      // Store refresh token in database
      await this.storeRefreshToken(userId, refreshToken, jti)
      
      return {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      }
    } catch (error) {
      throw new Error(`Failed to generate token pair: ${error}`)
    }
  }
  
  /**
   * Verify access token
   */
  static async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload
      return decoded
    } catch (error) {
      return null
    }
  }
  
  /**
   * Verify and rotate refresh token
   */
  static async verifyAndRotateRefreshToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload & { jti: string }
      
      // Check if token exists in database and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { jti: decoded.jti }
      })
      
      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        return null
      }
      
      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { jti: decoded.jti },
        data: { 
          isRevoked: true,
          revokedAt: new Date()
        }
      })
      
      // Generate new token pair
      return await this.generateTokenPair(decoded.userId, decoded.email, decoded.role)
    } catch (error) {
      return null
    }
  }
  
  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload & { jti: string }
      
      await prisma.refreshToken.update({
        where: { jti: decoded.jti },
        data: { 
          isRevoked: true,
          revokedAt: new Date()
        }
      })
      
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * Revoke all user tokens
   */
  static async revokeAllUserTokens(userId: string): Promise<boolean> {
    try {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { 
          isRevoked: true,
          revokedAt: new Date()
        }
      })
      
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * Store refresh token in database
   */
  private static async storeRefreshToken(
    userId: string, 
    refreshToken: string, 
    jti: string
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId,
          jti,
          expiresAt,
          userAgent: 'Unknown', // Would be passed from request
          ipAddress: '127.0.0.1' // Would be passed from request
        }
      })
    } catch (error) {
      throw new Error(`Failed to store refresh token: ${error}`)
    }
  }
  
  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true }
          ]
        }
      })
      
      return result.count
    } catch (error) {
      return 0
    }
  }
  
  /**
   * Get user's active sessions
   */
  static async getUserSessions(userId: string): Promise<Array<{
    id: string
    userAgent: string
    ipAddress: string
    createdAt: Date
    lastUsedAt: Date
  }>> {
    try {
      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          lastUsedAt: true
        },
        orderBy: { lastUsedAt: 'desc' }
      })
      
      return sessions
    } catch (error) {
      return []
    }
  }
}

// Export singleton instance
export const jwtManager = new JWTManager()