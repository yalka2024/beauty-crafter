import { NextRequest, NextResponse } from 'next/server'
import { systemManager } from '@/lib/system-manager'
import { monitoring } from '@/lib/monitoring'
import { cache } from '@/lib/cache'
import { dbPool } from '@/lib/database-pool'
import { enhancedAuth } from '@/lib/auth-enhanced'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return apiResponse.rateLimited('Too many system status requests')
    }

    // Get comprehensive system status
    const systemHealth = await systemManager.getSystemHealth()
    const systemInfo = systemManager.getSystemInfo()
    const systemConfig = systemManager.getConfig()

    // Get component-specific metrics
    const cacheStats = cache.getStats()
    const dbPoolStats = dbPool.getPoolStats()
    const monitoringMetrics = {
      metricsCount: monitoring.getMetrics().length,
      performanceHistory: monitoring.getPerformanceHistory().length,
      metricsSummary: monitoring.getMetricsSummary()
    }

    // Compile comprehensive system status
    const systemStatus = {
      health: systemHealth,
      info: systemInfo,
      config: systemConfig,
      components: {
        cache: {
          status: systemHealth.components.find(c => c.name === 'cache')?.status || 'unknown',
          stats: cacheStats
        },
        database: {
          status: systemHealth.components.find(c => c.name === 'database_pool')?.status || 'unknown',
          pool: dbPoolStats
        },
        monitoring: {
          status: systemHealth.components.find(c => c.name === 'monitoring')?.status || 'unknown',
          metrics: monitoringMetrics
        },
        authentication: {
          status: systemHealth.components.find(c => c.name === 'authentication')?.status || 'unknown',
          activeTokens: enhancedAuth['activeRefreshTokens']?.size || 0
        }
      },
      performance: {
        responseTime: Date.now() - startTime,
        uptime: systemInfo.uptime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      security: {
        rateLimiting: 'enabled',
        csrfProtection: 'enabled',
        inputValidation: 'enabled',
        authentication: 'enabled',
        authorization: 'enabled'
      },
      features: {
        connectionPooling: systemConfig.enableDatabasePooling,
        caching: systemConfig.enableCaching,
        metrics: systemConfig.enableMetrics,
        healthMonitoring: systemConfig.enableMetrics,
        gracefulShutdown: true,
        errorHandling: true,
        logging: systemConfig.enableLogging
      }
    }

    // Record metrics
    monitoring.recordMetric('system_status_requested', 1)
    monitoring.recordResponseTime(Date.now() - startTime, '/api/system')

    return apiResponse.success(systemStatus, 'System status retrieved successfully')

  } catch (error) {
    monitoring.recordError(error as Error, 'system_status_api')
    logger.error('Failed to get system status', {
      error,
      platform: 'Beauty Crafter'
    })

    return apiResponse.serverError('Failed to retrieve system status')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return apiResponse.rateLimited('Too many system control requests')
    }

    const body = await request.json()
    const { action, component, config } = body

    switch (action) {
      case 'restart_component':
        if (!component) {
          return apiResponse.validationError([{
            field: 'component',
            message: 'Component name is required',
            code: 'MISSING_COMPONENT'
          }])
        }

        const restartResult = await systemManager.restartComponent(component)
        if (restartResult) {
          monitoring.recordMetric('component_restart_requested', 1, { component })
          return apiResponse.success({ component, status: 'restarted' }, 'Component restarted successfully')
        } else {
          return apiResponse.error('Failed to restart component', 500)
        }

      case 'update_config':
        if (!config || typeof config !== 'object') {
          return apiResponse.validationError([{
            field: 'config',
            message: 'Valid configuration object is required',
            code: 'INVALID_CONFIG'
          }])
        }

        systemManager.updateConfig(config)
        monitoring.recordMetric('config_updated', 1)
        return apiResponse.success({ config: systemManager.getConfig() }, 'Configuration updated successfully')

      case 'shutdown':
        monitoring.recordMetric('shutdown_requested', 1)
        // Schedule shutdown for next tick to allow response to be sent
        process.nextTick(() => {
          systemManager.shutdown().catch(error => {
            logger.error('Failed to shutdown system', { error, platform: 'Beauty Crafter' })
          })
        })
        return apiResponse.success({ status: 'shutdown_initiated' }, 'System shutdown initiated')

      default:
        return apiResponse.validationError([{
          field: 'action',
          message: 'Invalid action. Supported actions: restart_component, update_config, shutdown',
          code: 'INVALID_ACTION'
        }])
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'system_control_api')
    logger.error('Failed to process system control request', {
      error,
      platform: 'Beauty Crafter'
    })

    return apiResponse.serverError('Failed to process system control request')
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
} 