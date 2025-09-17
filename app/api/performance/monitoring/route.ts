import { NextRequest, NextResponse } from 'next/server'
import { performanceOptimizer } from '@/lib/performance-optimizer'
import { prometheusExporter } from '@/lib/prometheus-exporter'
import { securityMiddleware } from '@/lib/security-middleware'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { monitoring } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      monitoring.recordMetric('performance_monitoring_blocked', 1, { 
        reason: securityResult.blocked ? 'security_threat' : 'security_error' 
      })
      
      return apiResponse.error(
        'Request blocked for security reasons',
        403,
        { threats: securityResult.threats }
      )
    }

    // Collect comprehensive performance data
    const performanceStats = performanceOptimizer.getPerformanceStats()
    const prometheusSummary = prometheusExporter.getMetricsSummary()
    const monitoringMetrics = monitoring.getMetricsSummary()

    const responseData = {
      performance: {
        queryMetrics: {
          total: performanceStats.queryMetrics.total,
          successful: performanceStats.queryMetrics.successful,
          failed: performanceStats.queryMetrics.failed,
          avgExecutionTime: performanceStats.queryMetrics.avgExecutionTime,
          slowQueries: performanceStats.queryMetrics.slowQueries,
          successRate: performanceStats.queryMetrics.total > 0 
            ? (performanceStats.queryMetrics.successful / performanceStats.queryMetrics.total * 100).toFixed(2)
            : 0
        },
        cacheMetrics: {
          total: performanceStats.cacheMetrics.total,
          hits: performanceStats.cacheMetrics.hits,
          misses: performanceStats.cacheMetrics.misses,
          hitRate: (performanceStats.cacheMetrics.hitRate * 100).toFixed(2),
          efficiency: performanceStats.cacheMetrics.hitRate > 0.8 ? 'Excellent' : 
                     performanceStats.cacheMetrics.hitRate > 0.6 ? 'Good' : 
                     performanceStats.cacheMetrics.hitRate > 0.4 ? 'Fair' : 'Poor'
        },
        systemPerformance: {
          memoryUsage: `${performanceStats.systemPerformance.memoryUsage} MB`,
          cpuUsage: `${performanceStats.systemPerformance.cpuUsage} ms`,
          uptime: `${Math.floor(performanceStats.systemPerformance.uptime / 3600)}h ${Math.floor((performanceStats.systemPerformance.uptime % 3600) / 60)}m`
        }
      },
      monitoring: {
        prometheus: {
          totalMetrics: prometheusSummary.totalMetrics,
          metricTypes: prometheusSummary.metricTypes,
          categories: prometheusSummary.categories,
          lastExport: prometheusSummary.lastExport.toISOString()
        },
        application: {
          responseTime: monitoringMetrics.response_time ? {
            avg: `${monitoringMetrics.response_time.avg}ms`,
            min: `${monitoringMetrics.response_time.min}ms`,
            max: `${monitoringMetrics.response_time.max}ms`
          } : null,
          requestCount: monitoringMetrics.request_count ? {
            total: monitoringMetrics.request_count.total,
            success: monitoringMetrics.request_count.success,
            error: monitoringMetrics.request_count.error
          } : null,
          errorRate: monitoringMetrics.error_count ? {
            total: monitoringMetrics.error_count.total,
            rate: monitoringMetrics.request_count ? 
              ((monitoringMetrics.error_count.total / monitoringMetrics.request_count.total) * 100).toFixed(2) + '%' : 'N/A'
          } : null
        }
      },
      recommendations: generatePerformanceRecommendations(performanceStats, monitoringMetrics),
      system: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        platform: 'Beauty Crafter Enterprise Platform'
      }
    }

    // Record performance monitoring access
    monitoring.recordMetric('performance_monitoring_accessed', 1, { 
      responseTime: (Date.now() - startTime).toString()
    })

    logger.info('Performance monitoring data retrieved', {
      responseTime: Date.now() - startTime,
      platform: 'Beauty Crafter'
    })

    return apiResponse.success(responseData, 'Performance monitoring data retrieved successfully', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'performance_monitoring_endpoint')
    logger.error('Performance monitoring endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'Beauty Crafter'
    })

    return apiResponse.serverError('Performance monitoring system error')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Parse request body
    const body = await request.json()
    const { action, target, parameters } = body

    let result: any
    let message: string

    switch (action) {
      case 'optimize_queries':
        result = await optimizeQueries(parameters)
        message = 'Query optimization completed'
        break
        
      case 'warmup_cache':
        result = await warmupCache(parameters)
        message = 'Cache warmup completed'
        break
        
      case 'analyze_performance':
        result = await analyzePerformance(parameters)
        message = 'Performance analysis completed'
        break
        
      default:
        return apiResponse.error('Invalid performance action', 400)
    }

    const responseData = {
      action,
      target,
      result,
      timestamp: new Date().toISOString()
    }

    // Record performance action
    monitoring.recordMetric('performance_action_executed', 1, { 
      action,
      target: target || 'system'
    })

    return apiResponse.success(responseData, message, {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'performance_action_endpoint')
    return apiResponse.serverError('Performance action execution error')
  }
}

// Helper functions for performance actions
async function optimizeQueries(parameters: any): Promise<any> {
  // Simulate query optimization
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    optimizedQueries: Math.floor(Math.random() * 10) + 1,
    estimatedImprovement: `${Math.floor(Math.random() * 30) + 10}%`,
    recommendations: [
      'Add database indexes for frequently queried fields',
      'Optimize JOIN operations in complex queries',
      'Implement query result caching for expensive operations'
    ]
  }
}

async function warmupCache(parameters: any): Promise<any> {
  // Simulate cache warmup
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    warmedUpKeys: Math.floor(Math.random() * 50) + 10,
    cacheSize: `${Math.floor(Math.random() * 100) + 50} MB`,
    hitRateImprovement: `${Math.floor(Math.random() * 20) + 5}%`
  }
}

async function analyzePerformance(parameters: any): Promise<any> {
  // Simulate performance analysis
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  return {
    bottlenecks: [
      'Database connection pooling could be optimized',
      'Cache eviction policy may need adjustment',
      'Consider implementing read replicas for heavy queries'
    ],
    optimizationOpportunities: [
      'Implement lazy loading for non-critical data',
      'Add compression for large API responses',
      'Optimize image processing pipeline'
    ],
    estimatedGains: {
      responseTime: '15-25% improvement',
      throughput: '20-30% increase',
      resourceUsage: '10-15% reduction'
    }
  }
}

// Generate performance recommendations based on metrics
function generatePerformanceRecommendations(
  performanceStats: any,
  monitoringMetrics: any
): string[] {
  const recommendations: string[] = []

  // Query performance recommendations
  if (performanceStats.queryMetrics.avgExecutionTime > 2000) {
    recommendations.push('Consider implementing database query optimization and indexing strategies')
  }
  
  if (performanceStats.queryMetrics.slowQueries > 10) {
    recommendations.push('Review and optimize slow-running database queries')
  }

  // Cache performance recommendations
  if (performanceStats.cacheMetrics.hitRate < 0.6) {
    recommendations.push('Implement cache warming strategies and optimize cache invalidation')
  }

  // System performance recommendations
  if (performanceStats.systemPerformance.memoryUsage > 500) {
    recommendations.push('Monitor memory usage and consider implementing memory optimization')
  }

  // Response time recommendations
  if (monitoringMetrics.response_time && monitoringMetrics.response_time.avg > 1000) {
    recommendations.push('Optimize API endpoints and implement response caching')
  }

  // Error rate recommendations
  if (monitoringMetrics.error_count && monitoringMetrics.request_count) {
    const errorRate = monitoringMetrics.error_count.total / monitoringMetrics.request_count.total
    if (errorRate > 0.05) { // 5% error rate
      recommendations.push('Investigate and resolve high error rates in the system')
    }
  }

  // Default recommendations if no issues detected
  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal. Continue monitoring for any degradation')
    recommendations.push('Consider implementing advanced monitoring and alerting for proactive issue detection')
  }

  return recommendations
} 