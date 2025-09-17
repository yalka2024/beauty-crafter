import { logger } from './logging'
import { monitoring } from './monitoring'
import { cache } from './cache'
import { db } from './database'

// Performance configuration
interface PerformanceConfig {
  queryTimeout: number
  maxConcurrentQueries: number
  cacheWarmupEnabled: boolean
  cacheWarmupInterval: number
  queryOptimizationEnabled: boolean
  loadBalancingEnabled: boolean
  performanceMonitoringEnabled: boolean
}

// Query performance metrics
interface QueryMetrics {
  query: string
  executionTime: number
  timestamp: Date
  success: boolean
  error?: string
  parameters?: any[]
}

// Cache performance metrics
interface CacheMetrics {
  operation: 'get' | 'set' | 'delete' | 'hit' | 'miss'
  key: string
  executionTime: number
  timestamp: Date
  success: boolean
  size?: number
}

// Performance optimization manager
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private config: PerformanceConfig
  private queryMetrics: QueryMetrics[] = []
  private cacheMetrics: CacheMetrics[] = []
  private slowQueries: QueryMetrics[] = []
  private queryCache: Map<string, { result: any; timestamp: Date; ttl: number }> = new Map()
  private performanceInterval: NodeJS.Timeout | undefined

  private constructor() {
    this.config = {
      queryTimeout: parseInt(process.env.QUERY_TIMEOUT || '5000'), // 5 seconds
      maxConcurrentQueries: parseInt(process.env.MAX_CONCURRENT_QUERIES || '10'),
      cacheWarmupEnabled: process.env.CACHE_WARMUP_ENABLED !== 'false',
      cacheWarmupInterval: parseInt(process.env.CACHE_WARMUP_INTERVAL || '300000'), // 5 minutes
      queryOptimizationEnabled: process.env.QUERY_OPTIMIZATION_ENABLED !== 'false',
      loadBalancingEnabled: process.env.LOAD_BALANCING_ENABLED !== 'false',
      performanceMonitoringEnabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false'
    }

    if (this.config.performanceMonitoringEnabled) {
      this.startPerformanceMonitoring()
    }

    if (this.config.cacheWarmupEnabled) {
      this.startCacheWarmup()
    }

    logger.info('Performance optimizer initialized', {
      config: this.config,
      platform: 'Beauty Crafter'
    })
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  /**
   * Execute database query with performance optimization
   */
  async executeQuery<T>(
    query: string,
    parameters: any[] = [],
    options: {
      useCache?: boolean
      cacheTTL?: number
      timeout?: number
      optimize?: boolean
    } = {}
  ): Promise<T> {
    const startTime = Date.now()
    const queryId = this.generateQueryId(query, parameters)
    
    try {
      // Check query cache first
      if (options.useCache !== false) {
        const cachedResult = this.getCachedQuery(queryId)
        if (cachedResult) {
          this.recordCacheMetrics('hit', queryId, Date.now() - startTime, true)
          return cachedResult as T
        }
      }

      // Execute query with timeout
      const timeout = options.timeout || this.config.queryTimeout
      const queryPromise = this.executeDatabaseQuery(query, parameters)
      
      const result = await Promise.race([
        queryPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ])

      const executionTime = Date.now() - startTime

      // Record query metrics
      this.recordQueryMetrics(query, executionTime, true, undefined, parameters)

      // Cache result if requested
      if (options.useCache !== false) {
        const ttl = options.cacheTTL || 300000 // 5 minutes default
        this.cacheQueryResult(queryId, result, ttl)
      }

      // Check for slow queries
      if (executionTime > 1000) { // 1 second threshold
        this.slowQueries.push({
          query,
          executionTime,
          timestamp: new Date(),
          success: true,
          parameters
        })
        
        logger.warn('Slow query detected', {
          query: query.substring(0, 100) + '...',
          executionTime: `${executionTime}ms`,
          platform: 'Beauty Crafter'
        })
      }

      // Record performance metrics
      monitoring.recordMetric('database_query_executed', 1, {
        executionTime: executionTime.toString(),
        success: 'true'
      })

      return result as T

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      // Record failed query
      this.recordQueryMetrics(query, executionTime, false, error instanceof Error ? error.message : 'Unknown error', parameters)
      
      // Record performance metrics
      monitoring.recordMetric('database_query_failed', 1, {
        executionTime: executionTime.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      logger.error('Database query failed', {
        query: query.substring(0, 100) + '...',
        executionTime: `${executionTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })

      throw error
    }
  }

  /**
   * Execute database query with optimization
   */
  private async executeDatabaseQuery(query: string, parameters: any[]): Promise<any> {
    // Apply query optimization if enabled
    if (this.config.queryOptimizationEnabled) {
      query = this.optimizeQuery(query)
    }

    // Execute query using Prisma
    try {
      // Use dynamic import to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      // Execute raw query for maximum performance
      const result = await prisma.$queryRawUnsafe(query, ...parameters)
      
      await prisma.$disconnect()
      return result
      
    } catch (error) {
      throw error
    }
  }

  /**
   * Optimize SQL query for better performance
   */
  private optimizeQuery(query: string): string {
    let optimizedQuery = query

    // Remove unnecessary whitespace
    optimizedQuery = optimizedQuery.replace(/\s+/g, ' ').trim()

    // Add LIMIT if SELECT without LIMIT and potentially large result set
    if (optimizedQuery.toLowerCase().includes('select') && 
        !optimizedQuery.toLowerCase().includes('limit') &&
        !optimizedQuery.toLowerCase().includes('count(')) {
      optimizedQuery += ' LIMIT 1000'
    }

    // Add index hints for common patterns
    if (optimizedQuery.toLowerCase().includes('where') && 
        optimizedQuery.toLowerCase().includes('user')) {
      // Add index hint for user-related queries
      optimizedQuery = optimizedQuery.replace(
        /FROM\s+(\w+)/i,
        'FROM $1 USE INDEX (idx_user_id)'
      )
    }

    return optimizedQuery
  }

  /**
   * Get cached query result
   */
  private getCachedQuery(queryId: string): any | null {
    const cached = this.queryCache.get(queryId)
    
    if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
      return cached.result
    }
    
    // Remove expired cache entry
    if (cached) {
      this.queryCache.delete(queryId)
    }
    
    return null
  }

  /**
   * Cache query result
   */
  private cacheQueryResult(queryId: string, result: any, ttl: number): void {
    this.queryCache.set(queryId, {
      result,
      timestamp: new Date(),
      ttl
    })

    // Limit cache size
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value
      this.queryCache.delete(oldestKey)
    }
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(query: string, parameters: any[]): string {
    const queryHash = require('crypto').createHash('md5')
      .update(query + JSON.stringify(parameters))
      .digest('hex')
    
    return `query_${queryHash}`
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(
    query: string,
    executionTime: number,
    success: boolean,
    error?: string,
    parameters?: any[]
  ): void {
    const metric: QueryMetrics = {
      query: query.substring(0, 200), // Truncate long queries
      executionTime,
      timestamp: new Date(),
      success,
      error,
      parameters
    }

    this.queryMetrics.push(metric)

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000)
    }

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100)
    }
  }

  /**
   * Record cache performance metrics
   */
  recordCacheMetrics(
    operation: 'get' | 'set' | 'delete' | 'hit' | 'miss',
    key: string,
    executionTime: number,
    success: boolean,
    size?: number
  ): void {
    const metric: CacheMetrics = {
      operation,
      key: key.substring(0, 100), // Truncate long keys
      executionTime,
      timestamp: new Date(),
      success,
      size
    }

    this.cacheMetrics.push(metric)

    // Keep only last 1000 metrics
    if (this.cacheMetrics.length > 1000) {
      this.cacheMetrics = this.cacheMetrics.slice(-1000)
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceInterval = setInterval(() => {
      this.analyzePerformance()
    }, 60000) // Every minute

    logger.info('Performance monitoring started', {
      interval: '1m',
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(): void {
    try {
      // Analyze query performance
      if (this.queryMetrics.length > 0) {
        const recentMetrics = this.queryMetrics.filter(
          m => Date.now() - m.timestamp.getTime() < 60000 // Last minute
        )

        if (recentMetrics.length > 0) {
          const avgExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length
          const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length

          // Record performance metrics
          monitoring.recordMetric('query_performance_analysis', 1, {
            avgExecutionTime: avgExecutionTime.toString(),
            successRate: successRate.toString(),
            queryCount: recentMetrics.length.toString()
          })

          // Alert on poor performance
          if (avgExecutionTime > 2000) { // 2 seconds
            logger.warn('Poor query performance detected', {
              avgExecutionTime: `${avgExecutionTime}ms`,
              successRate: `${(successRate * 100).toFixed(1)}%`,
              platform: 'Beauty Crafter'
            })
          }
        }
      }

      // Analyze cache performance
      if (this.cacheMetrics.length > 0) {
        const recentCacheMetrics = this.cacheMetrics.filter(
          m => Date.now() - m.timestamp.getTime() < 60000 // Last minute
        )

        if (recentCacheMetrics.length > 0) {
          const hitRate = recentCacheMetrics.filter(m => m.operation === 'hit').length / 
                         recentCacheMetrics.filter(m => m.operation === 'get').length

          monitoring.recordMetric('cache_performance_analysis', 1, {
            hitRate: hitRate.toString(),
            operationCount: recentCacheMetrics.length.toString()
          })
        }
      }

    } catch (error) {
      monitoring.recordError(error as Error, 'performance_analysis')
      logger.error('Performance analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Start cache warmup process
   */
  private startCacheWarmup(): void {
    setInterval(async () => {
      await this.warmupCache()
    }, this.config.cacheWarmupInterval)

    logger.info('Cache warmup process started', {
      interval: `${this.config.cacheWarmupInterval / 1000}s`,
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Warm up cache with frequently accessed data
   */
  private async warmupCache(): Promise<void> {
    try {
      logger.info('Starting cache warmup', { platform: 'Beauty Crafter' })

      // Warm up common queries
      const warmupQueries = [
        { query: 'SELECT COUNT(*) FROM User', key: 'user_count' },
        { query: 'SELECT COUNT(*) FROM Service', key: 'service_count' },
        { query: 'SELECT COUNT(*) FROM Booking', key: 'booking_count' }
      ]

      for (const warmupQuery of warmupQueries) {
        try {
          const result = await this.executeQuery(warmupQuery.query, [], { useCache: true, cacheTTL: 300000 })
          
          // Store in cache
          await cache.set(warmupQuery.key, result, { ttl: 300000 })
          
          logger.debug('Cache warmed up', {
            key: warmupQuery.key,
            platform: 'Beauty Crafter'
          })
        } catch (error) {
          logger.warn('Cache warmup failed for query', {
            query: warmupQuery.query,
            error: error instanceof Error ? error.message : 'Unknown error',
            platform: 'Beauty Crafter'
          })
        }
      }

      logger.info('Cache warmup completed', { platform: 'Beauty Crafter' })

    } catch (error) {
      monitoring.recordError(error as Error, 'cache_warmup')
      logger.error('Cache warmup process failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    queryMetrics: {
      total: number
      successful: number
      failed: number
      avgExecutionTime: number
      slowQueries: number
    }
    cacheMetrics: {
      total: number
      hits: number
      misses: number
      hitRate: number
    }
    systemPerformance: {
      memoryUsage: number
      cpuUsage: number
      uptime: number
    }
  } {
    const totalQueries = this.queryMetrics.length
    const successfulQueries = this.queryMetrics.filter(m => m.success).length
    const failedQueries = totalQueries - successfulQueries
    const avgExecutionTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0

    const totalCacheOps = this.cacheMetrics.filter(m => m.operation === 'get').length
    const cacheHits = this.cacheMetrics.filter(m => m.operation === 'hit').length
    const cacheMisses = totalCacheOps - cacheHits
    const hitRate = totalCacheOps > 0 ? cacheHits / totalCacheOps : 0

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB
    const cpuUsage = process.cpuUsage()
    const uptime = process.uptime()

    return {
      queryMetrics: {
        total: totalQueries,
        successful: successfulQueries,
        failed: failedQueries,
        avgExecutionTime,
        slowQueries: this.slowQueries.length
      },
      cacheMetrics: {
        total: totalCacheOps,
        hits: cacheHits,
        misses: cacheMisses,
        hitRate
      },
      systemPerformance: {
        memoryUsage: Math.round(memoryUsage),
        cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000),
        uptime: Math.round(uptime)
      }
    }
  }

  /**
   * Stop performance optimizer
   */
  stop(): void {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval)
      this.performanceInterval = undefined
    }
    
    logger.info('Performance optimizer stopped', { platform: 'Beauty Crafter' })
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Graceful shutdown
process.on('SIGTERM', () => {
  performanceOptimizer.stop()
})

process.on('SIGINT', () => {
  performanceOptimizer.stop()
}) 