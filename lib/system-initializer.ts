import { logger } from './logging'
import { monitoring } from './monitoring'
import { db } from './database'
import { cache } from './cache'
import { dbPool } from './database-pool'
import { enhancedAuth } from './auth-enhanced'

// Initialization phases
enum InitPhase {
  CORE = 'core',
  DATABASE = 'database',
  CACHE = 'cache',
  AUTH = 'auth',
  MONITORING = 'monitoring',
  COMPLETE = 'complete'
}

// Component status
interface ComponentStatus {
  name: string
  phase: InitPhase
  status: 'pending' | 'initializing' | 'ready' | 'error'
  error?: string
  startTime?: Date
  endTime?: Date
  duration?: number
}

// System initialization manager
export class SystemInitializer {
  private static instance: SystemInitializer
  private components: Map<string, ComponentStatus> = new Map()
  private currentPhase: InitPhase = InitPhase.CORE
  private isInitializing: boolean = false
  private initializationPromise?: Promise<void>

  private constructor() {
    this.initializeComponentMap()
  }

  public static getInstance(): SystemInitializer {
    if (!SystemInitializer.instance) {
      SystemInitializer.instance = new SystemInitializer()
    }
    return SystemInitializer.instance
  }

  /**
   * Initialize component map
   */
  private initializeComponentMap(): void {
    // Core components (always available)
    this.components.set('logging', {
      name: 'Logging System',
      phase: InitPhase.CORE,
      status: 'ready'
    })

    this.components.set('monitoring', {
      name: 'Monitoring System',
      phase: InitPhase.CORE,
      status: 'ready'
    })

    // Database components
    this.components.set('database', {
      name: 'Database Manager',
      phase: InitPhase.DATABASE,
      status: 'pending'
    })

    this.components.set('database_pool', {
      name: 'Database Connection Pool',
      phase: InitPhase.DATABASE,
      status: 'pending'
    })

    // Cache components
    this.components.set('cache', {
      name: 'Cache System',
      phase: InitPhase.CACHE,
      status: 'pending'
    })

    // Authentication components
    this.components.set('auth', {
      name: 'Authentication System',
      phase: InitPhase.AUTH,
      status: 'pending'
    })
  }

  /**
   * Initialize the entire system
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      if (this.initializationPromise) {
        return this.initializationPromise
      }
    }

    this.isInitializing = true
    this.initializationPromise = this.performInitialization()
    
    try {
      await this.initializationPromise
    } finally {
      this.isInitializing = false
    }
  }

  /**
   * Perform system initialization
   */
  private async performInitialization(): Promise<void> {
    const startTime = Date.now()
    
    try {
      logger.info('Starting Beauty Crafter Enterprise System initialization', {
        platform: 'Beauty Crafter',
        startTime: new Date().toISOString()
      })

      // Phase 1: Core Systems (already ready)
      await this.initializePhase(InitPhase.CORE)
      
      // Phase 2: Database Systems
      await this.initializePhase(InitPhase.DATABASE)
      
      // Phase 3: Cache Systems
      await this.initializePhase(InitPhase.CACHE)
      
      // Phase 4: Authentication Systems
      await this.initializePhase(InitPhase.AUTH)
      
      // Phase 5: Final Monitoring Setup
      await this.initializePhase(InitPhase.MONITORING)
      
      // Mark as complete
      this.currentPhase = InitPhase.COMPLETE
      
      const totalDuration = Date.now() - startTime
      
      logger.info('Beauty Crafter Enterprise System initialization completed successfully', {
        platform: 'Beauty Crafter',
        duration: `${totalDuration}ms`,
        components: Array.from(this.components.values()).map(c => ({
          name: c.name,
          status: c.status,
          duration: c.duration
        }))
      })

      // Record successful initialization
      monitoring.recordMetric('system_initialization_success', 1, { duration: totalDuration.toString() })

    } catch (error) {
      const totalDuration = Date.now() - startTime
      
      monitoring.recordError(error as Error, 'system_initialization')
      logger.error('Beauty Crafter Enterprise System initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phase: this.currentPhase,
        duration: `${totalDuration}ms`,
        platform: 'Beauty Crafter'
      })

      throw error
    }
  }

  /**
   * Initialize a specific phase
   */
  private async initializePhase(phase: InitPhase): Promise<void> {
    this.currentPhase = phase
    
    logger.info(`Initializing phase: ${phase}`, {
      platform: 'Beauty Crafter'
    })

    const phaseComponents = Array.from(this.components.values())
      .filter(c => c.phase === phase)

    for (const component of phaseComponents) {
      await this.initializeComponent(component)
    }

    logger.info(`Phase ${phase} initialization completed`, {
      platform: 'Beauty Crafter',
      components: phaseComponents.length
    })
  }

  /**
   * Initialize a specific component
   */
  private async initializeComponent(component: ComponentStatus): Promise<void> {
    const startTime = Date.now()
    component.status = 'initializing'
    component.startTime = new Date()

    try {
      logger.info(`Initializing component: ${component.name}`, {
        platform: 'Beauty Crafter'
      })

      switch (component.name) {
        case 'Database Manager':
          await this.initializeDatabase()
          break

        case 'Database Connection Pool':
          await this.initializeDatabasePool()
          break

        case 'Cache System':
          await this.initializeCache()
          break

        case 'Authentication System':
          await this.initializeAuth()
          break

        default:
          logger.warn(`Unknown component: ${component.name}`, {
            platform: 'Beauty Crafter'
          })
          break
      }

      component.status = 'ready'
      component.endTime = new Date()
      component.duration = Date.now() - startTime

      logger.info(`Component ${component.name} initialized successfully`, {
        platform: 'Beauty Crafter',
        duration: `${component.duration}ms`
      })

      // Record component initialization metric
      monitoring.recordMetric('component_initialization_success', 1, {
        component: component.name,
        duration: component.duration.toString()
      })

    } catch (error) {
      component.status = 'error'
      component.error = error instanceof Error ? error.message : 'Unknown error'
      component.endTime = new Date()
      component.duration = Date.now() - startTime

      monitoring.recordError(error as Error, 'component_initialization')
      logger.error(`Component ${component.name} initialization failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })

      throw error
    }
  }

  /**
   * Initialize database manager
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await db.connect()
      logger.info('Database manager initialized successfully', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      logger.error('Database manager initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      throw error
    }
  }

  /**
   * Initialize database connection pool
   */
  private async initializeDatabasePool(): Promise<void> {
    try {
      await dbPool.initialize()
      logger.info('Database connection pool initialized successfully', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      logger.warn('Database connection pool initialization failed, continuing without pooling', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      // Don't throw error for pool initialization failure
    }
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    try {
      cache.initialize()
      logger.info('Cache system initialized successfully', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      logger.warn('Cache system initialization failed, continuing without cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      // Don't throw error for cache initialization failure
    }
  }

  /**
   * Initialize authentication system
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Authentication system is already initialized as a singleton
      logger.info('Authentication system initialized successfully', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      logger.warn('Authentication system initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
      // Don't throw error for auth initialization failure
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    phase: InitPhase
    isInitializing: boolean
    components: ComponentStatus[]
    readyComponents: number
    totalComponents: number
  } {
    const components = Array.from(this.components.values())
    const readyComponents = components.filter(c => c.status === 'ready').length

    return {
      phase: this.currentPhase,
      isInitializing: this.isInitializing,
      components,
      readyComponents,
      totalComponents: components.length
    }
  }

  /**
   * Check if system is ready
   */
  isSystemReady(): boolean {
    return this.currentPhase === InitPhase.COMPLETE && !this.isInitializing
  }

  /**
   * Get component status by name
   */
  getComponentStatus(name: string): ComponentStatus | undefined {
    return this.components.get(name)
  }
}

// Export singleton instance
export const systemInitializer = SystemInitializer.getInstance()

// Auto-initialize system if not in test environment
if (process.env.NODE_ENV !== 'test') {
  process.nextTick(() => {
    systemInitializer.initialize().catch(error => {
      console.error('Failed to auto-initialize Beauty Crafter Enterprise System:', error)
    })
  })
} 