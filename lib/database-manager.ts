import { PrismaClient } from '@prisma/client'
import { monitoring } from './monitoring'
import { logger } from './logging'

// Database connection configuration
interface DatabaseConfig {
  maxRetries: number
  retryDelay: number
  maxRetryDelay: number
  healthCheckInterval: number
  connectionTimeout: number
}

const DEFAULT_CONFIG: DatabaseConfig = {
  maxRetries: 5,
  retryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  healthCheckInterval: 30000, // 30 seconds
  connectionTimeout: 10000 // 10 seconds
}

// Database connection state
interface ConnectionState {
  isConnected: boolean
  isInitializing: boolean
  lastHealthCheck: Date
  connectionAttempts: number
  lastError?: string
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
}

// Enhanced database manager with robust connection handling
export class DatabaseManager {
  private static instance: DatabaseManager
  private prisma: PrismaClient
  private config: DatabaseConfig
  private state: ConnectionState
  private healthCheckInterval?: NodeJS.Timeout
  private connectionPromise?: Promise<void>
  private shutdownInProgress: boolean = false

  private constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = {
      isConnected: false,
      isInitializing: false,
      lastHealthCheck: new Date(),
      connectionAttempts: 0,
      healthStatus: 'unhealthy'
    }
    
    // Initialize Prisma client with optimized configuration
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Connection pool configuration
      __internal: {
        engine: {
          connectionLimit: 10,
          pool: {
            min: 2,
            max: 10
          }
        }
      }
    })

    // Set up graceful shutdown
    this.setupGracefulShutdown()
  }

  public static getInstance(config?: Partial<DatabaseConfig>): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config)
    }
    return DatabaseManager.instance
  }

  /**
   * Initialize database connection with retry logic
   */
  async initialize(): Promise<void> {
    if (this.state.isInitializing) {
      // Wait for existing initialization
      if (this.connectionPromise) {
        return this.connectionPromise
      }
    }

    if (this.state.isConnected) {
      return
    }

    this.state.isInitializing = true
    this.connectionPromise = this.performInitialization()
    
    try {
      await this.connectionPromise
    } finally {
      this.state.isInitializing = false
    }
  }

  /**
   * Perform database initialization with exponential backoff retry
   */
  private async performInitialization(): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.info(`Database connection attempt ${attempt}/${this.config.maxRetries}`, {
          platform: 'Beauty Crafter'
        })

        // Test connection with timeout
        await this.testConnection()
        
        // Connection successful
        this.state.isConnected = true
        this.state.connectionAttempts = 0
        this.state.lastError = undefined
        this.state.healthStatus = 'healthy'
        
        // Start health monitoring
        this.startHealthMonitoring()
        
        // Record successful connection
        monitoring.recordMetric('db_connection_successful', 1)
        logger.info('Database connection established successfully', {
          platform: 'Beauty Crafter',
          attempts: attempt
        })
        
        return
        
      } catch (error) {
        lastError = error as Error
        this.state.connectionAttempts = attempt
        this.state.lastError = error instanceof Error ? error.message : 'Unknown error'
        
        // Record connection failure
        monitoring.recordMetric('db_connection_failed', 1, { attempt: attempt.toString() })
        monitoring.recordError(error as Error, 'database_connection')
        
        logger.warn(`Database connection attempt ${attempt} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt,
          maxRetries: this.config.maxRetries,
          platform: 'Beauty Crafter'
        })
        
        if (attempt < this.config.maxRetries) {
          // Calculate delay with exponential backoff
          const delay = Math.min(
            this.config.retryDelay * Math.pow(2, attempt - 1),
            this.config.maxRetryDelay
          )
          
          logger.info(`Retrying database connection in ${delay}ms`, {
            platform: 'Beauty Crafter'
          })
          
          await this.sleep(delay)
        }
      }
    }
    
    // All retries exhausted
    this.state.isConnected = false
    this.state.healthStatus = 'unhealthy'
    
    const error = new Error(`Database connection failed after ${this.config.maxRetries} attempts. Last error: ${lastError?.message}`)
    monitoring.recordError(error, 'database_connection_final_failure')
    logger.error('Database connection failed after all retry attempts', {
      error: lastError?.message,
      attempts: this.config.maxRetries,
      platform: 'Beauty Crafter'
    })
    
    throw error
  }

  /**
   * Test database connection with timeout
   */
  private async testConnection(): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout)
    })
    
    const connectionPromise = this.prisma.$queryRaw`SELECT 1 as test`
    
    await Promise.race([connectionPromise, timeoutPromise])
  }

  /**
   * Get database client (throws if not connected)
   */
  getClient(): PrismaClient {
    if (!this.state.isConnected) {
      throw new Error('Database not connected. Call initialize() first.')
    }
    return this.prisma
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.state.isConnected
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.state }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      if (!this.state.isConnected) {
        return {
          status: 'unavailable',
          details: {
            reason: 'Database not connected',
            lastError: this.state.lastError,
            connectionAttempts: this.state.connectionAttempts
          }
        }
      }

      // Perform actual health check
      const startTime = Date.now()
      await this.prisma.$queryRaw`SELECT 1 as health_check`
      const responseTime = Date.now() - startTime

      // Update health status based on response time
      if (responseTime < 100) {
        this.state.healthStatus = 'healthy'
      } else if (responseTime < 500) {
        this.state.healthStatus = 'degraded'
      } else {
        this.state.healthStatus = 'unhealthy'
      }

      this.state.lastHealthCheck = new Date()

      // Record health check metrics
      monitoring.recordMetric('db_health_check_response_time', responseTime)
      monitoring.recordMetric('db_health_check_success', 1)

      return {
        status: this.state.healthStatus,
        details: {
          responseTime,
          lastHealthCheck: this.state.lastHealthCheck,
          connectionAttempts: this.state.connectionAttempts
        }
      }

    } catch (error) {
      this.state.healthStatus = 'unhealthy'
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error'
      
      // Record health check failure
      monitoring.recordMetric('db_health_check_failed', 1)
      monitoring.recordError(error as Error, 'database_health_check')
      
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })

      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          lastError: this.state.lastError,
          connectionAttempts: this.state.connectionAttempts
        }
      }
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck()
      } catch (error) {
        logger.warn('Health check monitoring failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          platform: 'Beauty Crafter'
        })
      }
    }, this.config.healthCheckInterval)

    logger.info('Database health monitoring started', {
      interval: this.config.healthCheckInterval,
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Reconnect to database
   */
  async reconnect(): Promise<void> {
    logger.info('Initiating database reconnection', {
      platform: 'Beauty Crafter'
    })

    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = undefined
      }

      // Reset state
      this.state.isConnected = false
      this.state.healthStatus = 'unhealthy'
      this.state.connectionAttempts = 0

      // Close existing connection
      await this.prisma.$disconnect()

      // Reinitialize
      await this.initialize()

      logger.info('Database reconnection successful', {
        platform: 'Beauty Crafter'
      })

    } catch (error) {
      logger.error('Database reconnection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Gracefully disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.shutdownInProgress) {
      return
    }

    this.shutdownInProgress = true
    logger.info('Disconnecting from database', {
      platform: 'Beauty Crafter'
    })

    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = undefined
      }

      // Disconnect Prisma client
      await this.prisma.$disconnect()

      // Update state
      this.state.isConnected = false
      this.state.healthStatus = 'unhealthy'

      monitoring.recordMetric('db_disconnected', 1)
      logger.info('Database disconnected successfully', {
        platform: 'Beauty Crafter'
      })

    } catch (error) {
      monitoring.recordError(error as Error, 'database_disconnect')
      logger.error('Error during database disconnect', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, disconnecting database', { platform: 'Beauty Crafter' })
      this.disconnect().catch(error => {
        logger.error('Failed to disconnect database during shutdown', {
          error: error instanceof Error ? error.message : 'Unknown error',
          platform: 'Beauty Crafter'
        })
      })
    })

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, disconnecting database', { platform: 'Beauty Crafter' })
      this.disconnect().catch(error => {
        logger.error('Failed to disconnect database during shutdown', {
          error: error instanceof Error ? error.message : 'Unknown error',
          platform: 'Beauty Crafter'
        })
      })
    })
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get database statistics
   */
  getStats(): {
    isConnected: boolean
    healthStatus: string
    connectionAttempts: number
    lastHealthCheck: Date
    lastError?: string
  } {
    return {
      isConnected: this.state.isConnected,
      healthStatus: this.state.healthStatus,
      connectionAttempts: this.state.connectionAttempts,
      lastHealthCheck: this.state.lastHealthCheck,
      lastError: this.state.lastError
    }
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance()

// Auto-initialize database connection
if (process.env.NODE_ENV !== 'test') {
  process.nextTick(() => {
    db.initialize().catch(error => {
      console.error('Failed to auto-initialize database:', error)
    })
  })
} 