import { prisma } from './prisma'
import { logger } from './logging'
import { encryption } from './encryption'

interface SessionConfig {
  maxConcurrentSessions: number
  sessionTimeout: number // in milliseconds
  extendOnActivity: boolean
  requireReauthForSensitive: boolean
}

interface SessionData {
  sessionId: string
  userId: string
  userAgent: string
  ipAddress: string
  createdAt: Date
  lastActivityAt: Date
  expiresAt: Date
  isActive: boolean
}

export class SessionManager {
  private static instance: SessionManager
  private config: SessionConfig
  private activeSessions: Map<string, SessionData> = new Map()

  private constructor() {
    this.config = {
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5'),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000'), // 30 minutes
      extendOnActivity: process.env.EXTEND_SESSION_ON_ACTIVITY === 'true',
      requireReauthForSensitive: process.env.REQUIRE_REAUTH_SENSITIVE === 'true'
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string, 
    userAgent: string, 
    ipAddress: string
  ): Promise<SessionData> {
    try {
      // Check concurrent session limit
      await this.enforceConcurrentSessionLimit(userId)

      const sessionId = encryption.generateSessionId()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + this.config.sessionTimeout)

      const sessionData: SessionData = {
        sessionId,
        userId,
        userAgent,
        ipAddress,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        isActive: true
      }

      // Store in memory
      this.activeSessions.set(sessionId, sessionData)

      // Store in database
      await prisma.session.create({
        data: {
          id: sessionId,
          userId,
          userAgent,
          ipAddress,
          expiresAt,
          createdAt: now,
          lastActivityAt: now
        }
      })

      logger.info('Session created', { 
        sessionId, 
        userId, 
        ipAddress,
        expiresAt 
      })

      return sessionData
    } catch (error) {
      logger.error('Failed to create session', { error, userId })
      throw new Error('Session creation failed')
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<{
    isValid: boolean
    userId?: string
    needsReauth?: boolean
  }> {
    try {
      // Check memory first
      let sessionData = this.activeSessions.get(sessionId)
      
      if (!sessionData) {
        // Check database
        const dbSession = await prisma.session.findUnique({
          where: { id: sessionId }
        })

        if (!dbSession || dbSession.expiresAt < new Date()) {
          return { isValid: false }
        }

        sessionData = {
          sessionId: dbSession.id,
          userId: dbSession.userId,
          userAgent: dbSession.userAgent || '',
          ipAddress: dbSession.ipAddress || '',
          createdAt: dbSession.createdAt,
          lastActivityAt: dbSession.lastActivityAt,
          expiresAt: dbSession.expiresAt,
          isActive: true
        }
      }

      // Check if session is expired
      if (sessionData.expiresAt < new Date()) {
        await this.destroySession(sessionId)
        return { isValid: false }
      }

      // Update last activity
      if (this.config.extendOnActivity) {
        await this.updateLastActivity(sessionId)
      }

      return { 
        isValid: true, 
        userId: sessionData.userId 
      }
    } catch (error) {
      logger.error('Session validation failed', { error, sessionId })
      return { isValid: false }
    }
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      // Remove from memory
      this.activeSessions.delete(sessionId)

      // Remove from database
      await prisma.session.delete({
        where: { id: sessionId }
      })

      logger.info('Session destroyed', { sessionId })
      return true
    } catch (error) {
      logger.error('Failed to destroy session', { error, sessionId })
      return false
    }
  }

  /**
   * Destroy all user sessions
   */
  async destroyAllUserSessions(userId: string): Promise<number> {
    try {
      // Remove from memory
      let removedCount = 0
      for (const [sessionId, sessionData] of this.activeSessions.entries()) {
        if (sessionData.userId === userId) {
          this.activeSessions.delete(sessionId)
          removedCount++
        }
      }

      // Remove from database
      const result = await prisma.session.deleteMany({
        where: { userId }
      })

      logger.info('All user sessions destroyed', { 
        userId, 
        memorySessions: removedCount,
        dbSessions: result.count 
      })

      return removedCount + result.count
    } catch (error) {
      logger.error('Failed to destroy user sessions', { error, userId })
      return 0
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() }
        },
        orderBy: { lastActivityAt: 'desc' }
      })

      return sessions.map(session => ({
        sessionId: session.id,
        userId: session.userId,
        userAgent: session.userAgent || '',
        ipAddress: session.ipAddress || '',
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        isActive: true
      }))
    } catch (error) {
      logger.error('Failed to get user sessions', { error, userId })
      return []
    }
  }

  /**
   * Update session last activity
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    try {
      const now = new Date()
      
      // Update memory
      const sessionData = this.activeSessions.get(sessionId)
      if (sessionData) {
        sessionData.lastActivityAt = now
        // Extend expiration if configured
        if (this.config.extendOnActivity) {
          sessionData.expiresAt = new Date(now.getTime() + this.config.sessionTimeout)
        }
      }

      // Update database
      await prisma.session.update({
        where: { id: sessionId },
        data: { 
          lastActivityAt: now,
          ...(this.config.extendOnActivity && {
            expiresAt: new Date(now.getTime() + this.config.sessionTimeout)
          })
        }
      })
    } catch (error) {
      logger.error('Failed to update session activity', { error, sessionId })
    }
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    try {
      const userSessions = await this.getUserSessions(userId)
      
      if (userSessions.length >= this.config.maxConcurrentSessions) {
        // Remove oldest sessions
        const sessionsToRemove = userSessions
          .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
          .slice(0, userSessions.length - this.config.maxConcurrentSessions + 1)

        for (const session of sessionsToRemove) {
          await this.destroySession(session.sessionId)
        }

        logger.info('Concurrent session limit enforced', { 
          userId, 
          removedSessions: sessionsToRemove.length 
        })
      }
    } catch (error) {
      logger.error('Failed to enforce session limit', { error, userId })
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date()
      
      // Clean memory
      let memoryCleaned = 0
      for (const [sessionId, sessionData] of this.activeSessions.entries()) {
        if (sessionData.expiresAt < now) {
          this.activeSessions.delete(sessionId)
          memoryCleaned++
        }
      }

      // Clean database
      const result = await prisma.session.deleteMany({
        where: { expiresAt: { lt: now } }
      })

      logger.info('Expired sessions cleaned up', { 
        memorySessions: memoryCleaned,
        dbSessions: result.count 
      })

      return memoryCleaned + result.count
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error })
      return 0
    }
  }

  /**
   * Update session configuration
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    logger.info('Session configuration updated', { config: this.config })
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeSessions: number
    memorySessions: number
    config: SessionConfig
  } {
    return {
      activeSessions: this.activeSessions.size,
      memorySessions: this.activeSessions.size,
      config: this.config
    }
  }

  /**
   * Check if session needs re-authentication for sensitive operations
   */
  async requiresReauth(sessionId: string, operation: string): Promise<boolean> {
    if (!this.config.requireReauthForSensitive) {
      return false
    }

    const sensitiveOperations = [
      'change_password',
      'change_email',
      'delete_account',
      'payment',
      'admin_operations'
    ]

    if (!sensitiveOperations.includes(operation)) {
      return false
    }

    // Check if session is recent enough for sensitive operations
    const sessionData = this.activeSessions.get(sessionId)
    if (!sessionData) return true

    const sessionAge = Date.now() - sessionData.createdAt.getTime()
    const maxAgeForSensitive = 15 * 60 * 1000 // 15 minutes

    return sessionAge > maxAgeForSensitive
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()