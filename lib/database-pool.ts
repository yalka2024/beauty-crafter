import { PrismaClient } from '@prisma/client'
import { monitoring } from './monitoring'
import { logger } from './logging'

// Connection pool configuration
interface PoolConfig {
  minConnections: number
  maxConnections: number
  acquireTimeout: number
  idleTimeout: number
  reapInterval: number
  healthCheckInterval: number
}

const DEFAULT_POOL_CONFIG: PoolConfig = {
  minConnections: 2,
  maxConnections: 10,
  acquireTimeout: 30000, // 30 seconds
  idleTimeout: 60000, // 1 minute
  reapInterval: 30000, // 30 seconds
  healthCheckInterval: 60000 // 1 minute
}

// Connection status
interface ConnectionStatus {
  id: string
  client: PrismaClient
  createdAt: Date
  lastUsed: Date
  isActive: boolean
  isHealthy: boolean
  errorCount: number
}

// Enhanced database pool manager
export class DatabasePoolManager {
  private static instance: DatabasePoolManager
  private connections: Map<string, ConnectionStatus> = new Map()
  private config: PoolConfig
  private isInitialized: boolean = false
  private healthCheckInterval?: NodeJS.Timeout
  private reapInterval?: NodeJS.Timeout
  private connectionCounter: number = 0

  private constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config }
  }

  public static getInstance(config?: Partial<PoolConfig>): DatabasePoolManager {
    if (!DatabasePoolManager.instance) {
      DatabasePoolManager.instance = new DatabasePoolManager(config)
    }
    return DatabasePoolManager.instance
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      logger.info('Initializing database connection pool', {
        config: this.config,
        platform: 'Beauty Crafter'
      })

      // Create minimum connections
      await this.createConnections(this.config.minConnections)

      // Start health check and cleanup intervals
      this.startHealthCheckInterval()
      this.startReapInterval()

      this.isInitialized = true
      monitoring.recordMetric('db_pool_initialized', 1)

      logger.info('Database connection pool initialized successfully', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      monitoring.recordError(error as Error, 'db_pool_initialization')
      logger.error('Failed to initialize database connection pool', {
        error,
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<PrismaClient> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Try to find an available healthy connection
      let connection = this.findAvailableConnection()
      
      if (!connection) {
        // Create new connection if under max limit
        if (this.connections.size < this.config.maxConnections) {
          connection = await this.createConnection()
        } else {
          // Wait for a connection to become available
          connection = await this.waitForConnection()
        }
      }

      if (!connection) {
        throw new Error('Failed to acquire database connection')
      }

      // Update connection usage
      connection.lastUsed = new Date()
      connection.isActive = true

      monitoring.recordMetric('db_connection_acquired', 1)
      return connection.client
    } catch (error) {
      monitoring.recordError(error as Error, 'db_connection_acquisition')
      logger.error('Failed to acquire database connection', {
        error,
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(client: PrismaClient): void {
    try {
      const connection = this.findConnectionByClient(client)
      if (connection) {
        connection.isActive = false
        connection.lastUsed = new Date()
        monitoring.recordMetric('db_connection_released', 1)
      }
    } catch (error) {
      logger.warn('Error releasing database connection', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): {
    totalConnections: number
    activeConnections: number
    idleConnections: number
    healthyConnections: number
    unhealthyConnections: number
  } {
    const total = this.connections.size
    const active = Array.from(this.connections.values()).filter(c => c.isActive).length
    const healthy = Array.from(this.connections.values()).filter(c => c.isHealthy).length

    return {
      totalConnections: total,
      activeConnections: active,
      idleConnections: total - active,
      healthyConnections: healthy,
      unhealthyConnections: total - healthy
    }
  }

  /**
   * Perform health check on all connections
   */
  async performHealthCheck(): Promise<void> {
    try {
      const connections = Array.from(this.connections.values())
      const healthPromises = connections.map(async (connection) => {
        try {
          // Simple health check query
          await connection.client.$queryRaw`SELECT 1`
          connection.isHealthy = true
          connection.errorCount = 0
        } catch (error) {
          connection.isHealthy = false
          connection.errorCount++
          
          // Remove connection if it has too many errors
          if (connection.errorCount > 3) {
            this.removeConnection(connection.id)
          }
        }
      })

      await Promise.all(healthPromises)
      monitoring.recordMetric('db_health_check_completed', 1)
    } catch (error) {
      monitoring.recordError(error as Error, 'db_health_check')
      logger.error('Database health check failed', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down database connection pool', {
        platform: 'Beauty Crafter'
      })

      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
      }
      if (this.reapInterval) {
        clearInterval(this.reapInterval)
      }

      // Close all connections
      const closePromises = Array.from(this.connections.values()).map(async (connection) => {
        try {
          await connection.client.$disconnect()
        } catch (error) {
          logger.warn('Error closing database connection', {
            error,
            connectionId: connection.id,
            platform: 'Beauty Crafter'
          })
        }
      })

      await Promise.all(closePromises)
      this.connections.clear()
      this.isInitialized = false

      monitoring.recordMetric('db_pool_shutdown', 1)
      logger.info('Database connection pool shutdown completed', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      monitoring.recordError(error as Error, 'db_pool_shutdown')
      logger.error('Error during database pool shutdown', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Create new connections
   */
  private async createConnections(count: number): Promise<void> {
    const promises = Array.from({ length: count }, () => this.createConnection())
    await Promise.all(promises)
  }

  /**
   * Create a single connection
   */
  private async createConnection(): Promise<ConnectionStatus> {
    try {
      const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      // Test the connection
      await client.$queryRaw`SELECT 1`

      const connection: ConnectionStatus = {
        id: `conn_${++this.connectionCounter}`,
        client,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: false,
        isHealthy: true,
        errorCount: 0
      }

      this.connections.set(connection.id, connection)
      monitoring.recordMetric('db_connection_created', 1)

      return connection
    } catch (error) {
      monitoring.recordError(error as Error, 'db_connection_creation')
      throw new Error(`Failed to create database connection: ${error}`)
    }
  }

  /**
   * Find an available connection
   */
  private findAvailableConnection(): ConnectionStatus | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive && connection.isHealthy) {
        return connection
      }
    }
    return null
  }

  /**
   * Find connection by client
   */
  private findConnectionByClient(client: PrismaClient): ConnectionStatus | null {
    for (const connection of this.connections.values()) {
      if (connection.client === client) {
        return connection
      }
    }
    return null
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(): Promise<ConnectionStatus | null> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < this.config.acquireTimeout) {
      const connection = this.findAvailableConnection()
      if (connection) {
        return connection
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error('Connection acquisition timeout')
  }

  /**
   * Remove a connection from the pool
   */
  private async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (connection) {
      try {
        await connection.client.$disconnect()
      } catch (error) {
        logger.warn('Error disconnecting database connection', {
          error,
          connectionId,
          platform: 'Beauty Crafter'
        })
      }
      
      this.connections.delete(connectionId)
      monitoring.recordMetric('db_connection_removed', 1)
    }
  }

  /**
   * Start health check interval
   */
  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  /**
   * Start connection cleanup interval
   */
  private startReapInterval(): void {
    this.reapInterval = setInterval(() => {
      this.reapIdleConnections()
    }, this.config.reapInterval)
  }

  /**
   * Remove idle connections
   */
  private async reapIdleConnections(): Promise<void> {
    try {
      const now = Date.now()
      const connectionsToRemove: string[] = []

      for (const [id, connection] of this.connections.entries()) {
        if (!connection.isActive && 
            (now - connection.lastUsed.getTime()) > this.config.idleTimeout &&
            this.connections.size > this.config.minConnections) {
          connectionsToRemove.push(id)
        }
      }

      for (const id of connectionsToRemove) {
        await this.removeConnection(id)
      }

      if (connectionsToRemove.length > 0) {
        monitoring.recordMetric('db_idle_connections_reaped', connectionsToRemove.length)
      }
    } catch (error) {
      logger.warn('Error reaping idle connections', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }
}

// Export singleton instance
export const dbPool = DatabasePoolManager.getInstance()

// Enhanced database client wrapper
export class EnhancedDatabaseClient {
  private pool: DatabasePoolManager

  constructor(pool: DatabasePoolManager = dbPool) {
    this.pool = pool
  }

  /**
   * Execute a database operation with automatic connection management
   */
  async execute<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = await this.pool.getConnection()
    
    try {
      const result = await operation(client)
      return result
    } finally {
      this.pool.releaseConnection(client)
    }
  }

  /**
   * Get raw client (use with caution)
   */
  async getClient(): Promise<PrismaClient> {
    return await this.pool.getConnection()
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return this.pool.getPoolStats()
  }
}

// Export enhanced client instance
export const enhancedDb = new EnhancedDatabaseClient() 