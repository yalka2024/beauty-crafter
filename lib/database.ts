import { PrismaClient } from '@prisma/client'
import { logger } from './logging'

class DatabaseManager {
  private static instance: DatabaseManager
  private prisma: PrismaClient
  private isConnected: boolean = false
  private connectionAttempts: number = 0
  private readonly maxRetries = 5
  private readonly retryDelay = 1000

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'query', emit: 'event' }
      ],
      errorFormat: 'pretty'
    })

    this.setupEventListeners()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private setupEventListeners(): void {
    this.prisma.$on('warn', (e) => {
      logger.warn('Database warning:', e)
    })

    this.prisma.$on('error', (e) => {
      logger.error('Database error:', e)
      this.isConnected = false
    })

    this.prisma.$on('info', (e) => {
      logger.info('Database info:', e)
    })

    this.prisma.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Database query:', {
          query: e.query,
          params: e.params,
          duration: e.duration
        })
      }
    })
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      // Test connection with timeout
      const connectionPromise = this.prisma.$connect()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      })
      
      await Promise.race([connectionPromise, timeoutPromise])
      
      this.isConnected = true
      this.connectionAttempts = 0
      
      // Test actual query to ensure connection is working
      await this.prisma.$queryRaw`SELECT 1 as connection_test`
      
      logger.info('Database connected successfully', { platform: 'Beauty Crafter' })
      
      // Start periodic health checks
      this.startHealthMonitoring()
      
    } catch (error) {
      this.connectionAttempts++
      logger.error(`Database connection attempt ${this.connectionAttempts} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
        platform: 'Beauty Crafter'
      })

      if (this.connectionAttempts < this.maxRetries) {
        // Exponential backoff
        const delay = Math.min(this.retryDelay * Math.pow(2, this.connectionAttempts - 1), 30000)
        logger.info(`Retrying in ${delay}ms...`, { platform: 'Beauty Crafter' })
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.connect()
      } else {
        throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`)
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      this.isConnected = false
      logger.info('Database disconnected successfully')
    } catch (error) {
      logger.error('Error disconnecting from database:', error)
    }
  }

  public async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const startTime = Date.now()
      await this.prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: this.isConnected,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  public getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.prisma
  }

  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number }
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn, options)
    } catch (error) {
      logger.error('Transaction failed:', error)
      throw error
    }
  }

  public async cleanup(): Promise<void> {
    try {
      // Clean up any stale connections or resources
      await this.prisma.$executeRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()`
      logger.info('Database cleanup completed', { platform: 'Beauty Crafter' })
    } catch (error) {
      logger.warn('Database cleanup warning:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Clear any existing interval
    if ((this as any).healthCheckInterval) {
      clearInterval((this as any).healthCheckInterval)
    }

    // Start health monitoring every 30 seconds
    (this as any).healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck()
      } catch (error) {
        logger.warn('Periodic health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          platform: 'Beauty Crafter'
        })
      }
    }, 30000)

    logger.info('Database health monitoring started', { platform: 'Beauty Crafter' })
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    isConnected: boolean
    connectionAttempts: number
    lastHealthCheck?: Date
  } {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      lastHealthCheck: (this as any).lastHealthCheck
    }
  }
}

// Global database instance
export const db = DatabaseManager.getInstance()

// Export the Prisma client for direct use when needed
export const prisma = db.getClient()

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down database...')
  await db.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down database...')
  await db.disconnect()
  process.exit(0)
})

export default DatabaseManager 