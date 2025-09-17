import { monitoring } from './monitoring'
import { logger } from './logging'
import { cache } from './cache'
import { dbPool } from './database-pool'
import { enhancedAuth } from './auth-enhanced'

// System component status
export interface ComponentStatus {
  name: string
  status: 'initializing' | 'ready' | 'error' | 'shutdown'
  lastCheck: Date
  error?: string
  metrics?: Record<string, any>
}

// System health status
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  components: ComponentStatus[]
  timestamp: Date
  uptime: number
  version: string
  environment: string
}

// System configuration
export interface SystemConfig {
  autoStart: boolean
  healthCheckInterval: number
  gracefulShutdownTimeout: number
  enableMetrics: boolean
  enableLogging: boolean
  enableCaching: boolean
  enableDatabasePooling: boolean
  enableAuthentication: boolean
}

const DEFAULT_CONFIG: SystemConfig = {
  autoStart: true,
  healthCheckInterval: 30000, // 30 seconds
  gracefulShutdownTimeout: 30000, // 30 seconds
  enableMetrics: true,
  enableLogging: true,
  enableCaching: true,
  enableDatabasePooling: true,
  enableAuthentication: true
}

// Enterprise system manager
export class SystemManager {
  private static instance: SystemManager
  private config: SystemConfig
  private components: Map<string, ComponentStatus> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private startTime: Date
  private isShuttingDown: boolean = false

  private constructor(config: Partial<SystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startTime = new Date()
  }

  public static getInstance(config?: Partial<SystemConfig>): SystemManager {
    if (!SystemManager.instance) {
      SystemManager.instance = new SystemManager(config)
    }
    return SystemManager.instance
  }

  /**
   * Initialize the entire system
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Beauty Crafter Enterprise System', {
        config: this.config,
        platform: 'Beauty Crafter'
      })

      // Initialize core components
      await this.initializeCoreComponents()

      // Initialize optional components based on config
      if (this.config.enableCaching) {
        await this.initializeCache()
      }

      if (this.config.enableDatabasePooling) {
        await this.initializeDatabasePool()
      }

      if (this.config.enableAuthentication) {
        await this.initializeAuthentication()
      }

      // Start health monitoring
      if (this.config.enableMetrics) {
        this.startHealthMonitoring()
      }

      logger.info('Beauty Crafter Enterprise System initialized successfully', {
        platform: 'Beauty Crafter',
        components: Array.from(this.components.keys())
      })

      // Record system initialization metric
      monitoring.recordMetric('system_initialized', 1)

    } catch (error) {
      monitoring.recordError(error as Error, 'system_initialization')
      logger.error('Failed to initialize Beauty Crafter Enterprise System', {
        error,
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Initialize core system components
   */
  private async initializeCoreComponents(): Promise<void> {
    // Initialize monitoring system
    this.registerComponent('monitoring', 'initializing')
    try {
      // Monitoring is already initialized as a singleton
      this.updateComponentStatus('monitoring', 'ready')
      logger.info('Monitoring system ready', { platform: 'Beauty Crafter' })
    } catch (error) {
      this.updateComponentStatus('monitoring', 'error', error as Error)
      throw error
    }

    // Initialize logging system
    this.registerComponent('logging', 'initializing')
    try {
      // Logging is already initialized as a singleton
      this.updateComponentStatus('logging', 'ready')
      logger.info('Logging system ready', { platform: 'Beauty Crafter' })
    } catch (error) {
      this.updateComponentStatus('logging', 'error', error as Error)
      throw error
    }
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    this.registerComponent('cache', 'initializing')
    try {
      cache.initialize()
      this.updateComponentStatus('cache', 'ready')
      logger.info('Cache system ready', { platform: 'Beauty Crafter' })
    } catch (error) {
      this.updateComponentStatus('cache', 'error', error as Error)
      logger.warn('Cache system initialization failed, continuing without cache', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Initialize database connection pool
   */
  private async initializeDatabasePool(): Promise<void> {
    this.registerComponent('database_pool', 'initializing')
    try {
      await dbPool.initialize()
      this.updateComponentStatus('database_pool', 'ready')
      logger.info('Database connection pool ready', { platform: 'Beauty Crafter' })
    } catch (error) {
      this.updateComponentStatus('database_pool', 'error', error as Error)
      logger.warn('Database pool initialization failed, continuing without pooling', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Initialize authentication system
   */
  private async initializeAuthentication(): Promise<void> {
    this.registerComponent('authentication', 'initializing')
    try {
      // Authentication system is already initialized as a singleton
      this.updateComponentStatus('authentication', 'ready')
      logger.info('Authentication system ready', { platform: 'Beauty Crafter' })
    } catch (error) {
      this.updateComponentStatus('authentication', 'error', error as Error)
      logger.warn('Authentication system initialization failed', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)

    logger.info('Health monitoring started', {
      interval: this.config.healthCheckInterval,
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthStatus = await this.getSystemHealth()
      
      // Update component statuses
      for (const component of healthStatus.components) {
        this.updateComponentStatus(component.name, component.status, component.error ? new Error(component.error) : undefined)
      }

      // Record overall health metric
      monitoring.recordMetric('system_health_check', 1, { status: healthStatus.overall })

      // Log health status
      if (healthStatus.overall === 'unhealthy') {
        logger.error('System health check failed', {
          status: healthStatus.overall,
          components: healthStatus.components.filter(c => c.status === 'error'),
          platform: 'Beauty Crafter'
        })
      } else if (healthStatus.overall === 'degraded') {
        logger.warn('System health check shows degraded performance', {
          status: healthStatus.overall,
          components: healthStatus.components.filter(c => c.status === 'error'),
          platform: 'Beauty Crafter'
        })
      }

    } catch (error) {
      monitoring.recordError(error as Error, 'health_check')
      logger.error('Health check failed', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const componentStatuses: ComponentStatus[] = []
    let healthyComponents = 0
    let totalComponents = 0

    // Check each component
    for (const [name, status] of this.components.entries()) {
      totalComponents++
      if (status.status === 'ready') {
        healthyComponents++
      }

      // Get component-specific metrics
      const metrics = await this.getComponentMetrics(name)
      status.metrics = metrics
      status.lastCheck = new Date()

      componentStatuses.push({ ...status })
    }

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyComponents === totalComponents) {
      overall = 'healthy'
    } else if (healthyComponents > totalComponents * 0.5) {
      overall = 'degraded'
    } else {
      overall = 'unhealthy'
    }

    return {
      overall,
      components: componentStatuses,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  }

  /**
   * Get component-specific metrics
   */
  private async getComponentMetrics(componentName: string): Promise<Record<string, any>> {
    try {
      switch (componentName) {
        case 'cache':
          return cache.getStats()
        
        case 'database_pool':
          return dbPool.getPoolStats()
        
        case 'monitoring':
          return {
            metricsCount: monitoring.getMetrics().length,
            performanceHistory: monitoring.getPerformanceHistory().length
          }
        
        default:
          return {}
      }
    } catch (error) {
      logger.warn(`Failed to get metrics for component: ${componentName}`, {
        error,
        platform: 'Beauty Crafter'
      })
      return {}
    }
  }

  /**
   * Register a component
   */
  private registerComponent(name: string, status: ComponentStatus['status']): void {
    this.components.set(name, {
      name,
      status,
      lastCheck: new Date()
    })
  }

  /**
   * Update component status
   */
  private updateComponentStatus(name: string, status: ComponentStatus['status'], error?: Error): void {
    const component = this.components.get(name)
    if (component) {
      component.status = status
      component.lastCheck = new Date()
      if (error) {
        component.error = error.message
      }
    }
  }

  /**
   * Gracefully shutdown the system
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    this.isShuttingDown = true
    logger.info('Initiating graceful system shutdown', {
      timeout: this.config.gracefulShutdownTimeout,
      platform: 'Beauty Crafter'
    })

    try {
      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
      }

      // Shutdown components in reverse order
      const shutdownPromises: Promise<void>[] = []

      if (this.config.enableAuthentication) {
        this.updateComponentStatus('authentication', 'shutdown')
      }

      if (this.config.enableDatabasePooling) {
        this.updateComponentStatus('database_pool', 'shutdown')
        shutdownPromises.push(dbPool.shutdown())
      }

      if (this.config.enableCaching) {
        this.updateComponentStatus('cache', 'shutdown')
        cache.shutdown()
      }

      // Wait for all shutdown operations to complete
      await Promise.allSettled(shutdownPromises)

      // Update all component statuses
      for (const [name] of this.components) {
        this.updateComponentStatus(name, 'shutdown')
      }

      monitoring.recordMetric('system_shutdown', 1)
      logger.info('Beauty Crafter Enterprise System shutdown completed', {
        platform: 'Beauty Crafter'
      })

    } catch (error) {
      monitoring.recordError(error as Error, 'system_shutdown')
      logger.error('Error during system shutdown', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Restart a specific component
   */
  async restartComponent(componentName: string): Promise<boolean> {
    try {
      logger.info(`Restarting component: ${componentName}`, {
        platform: 'Beauty Crafter'
      })

      this.updateComponentStatus(componentName, 'initializing')

      switch (componentName) {
        case 'cache':
          cache.shutdown()
          cache.initialize()
          break

        case 'database_pool':
          await dbPool.shutdown()
          await dbPool.initialize()
          break

        default:
          logger.warn(`Component restart not implemented for: ${componentName}`, {
            platform: 'Beauty Crafter'
          })
          return false
      }

      this.updateComponentStatus(componentName, 'ready')
      monitoring.recordMetric('component_restarted', 1, { component: componentName })
      
      logger.info(`Component restarted successfully: ${componentName}`, {
        platform: 'Beauty Crafter'
      })

      return true

    } catch (error) {
      this.updateComponentStatus(componentName, 'error', error as Error)
      monitoring.recordError(error as Error, 'component_restart')
      logger.error(`Failed to restart component: ${componentName}`, {
        error,
        platform: 'Beauty Crafter'
      })
      return false
    }
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    version: string
    environment: string
    uptime: number
    startTime: Date
    config: SystemConfig
    componentCount: number
  } {
    return {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Date.now() - this.startTime.getTime(),
      startTime: this.startTime,
      config: this.config,
      componentCount: this.components.size
    }
  }

  /**
   * Update system configuration
   */
  updateConfig(updates: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...updates }
    logger.info('System configuration updated', {
      updates,
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Get current configuration
   */
  getConfig(): SystemConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const systemManager = SystemManager.getInstance()

// Auto-initialize if enabled
if (systemManager.getConfig().autoStart) {
  // Initialize on next tick to allow other modules to load
  process.nextTick(() => {
    systemManager.initialize().catch(error => {
      console.error('Failed to auto-initialize system:', error)
    })
  })
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, initiating graceful shutdown', { platform: 'Beauty Crafter' })
  systemManager.shutdown().then(() => {
    process.exit(0)
  }).catch(() => {
    process.exit(1)
  })
})

process.on('SIGINT', () => {
  logger.info('Received SIGINT, initiating graceful shutdown', { platform: 'Beauty Crafter' })
  systemManager.shutdown().then(() => {
    process.exit(0)
  }).catch(() => {
    process.exit(1)
  })
})

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  monitoring.recordError(error, 'uncaught_exception')
  logger.error('Uncaught exception', {
    error,
    platform: 'Beauty Crafter'
  })
  
  // Attempt graceful shutdown
  systemManager.shutdown().finally(() => {
    process.exit(1)
  })
})

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  monitoring.recordError(error, 'unhandled_rejection')
  logger.error('Unhandled promise rejection', {
    error,
    promise: promise.toString(),
    platform: 'Beauty Crafter'
  })
}) 