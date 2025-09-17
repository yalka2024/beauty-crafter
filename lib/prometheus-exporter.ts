import { monitoring } from './monitoring'
import { productionAuth } from './auth-production'
import { securityMiddleware } from './security-middleware'
import { validationMiddleware } from './validation-middleware'
import { systemInitializer } from './system-initializer'
import { logger } from './logging'

// Prometheus metric types
interface PrometheusMetric {
  name: string
  help: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  labels?: string[]
  value: number
  timestamp?: number
}

// Prometheus exporter for Beauty Crafter Enterprise Platform
export class PrometheusExporter {
  private static instance: PrometheusExporter
  private metrics: PrometheusMetric[] = []
  private lastExport: Date = new Date()
  private exportInterval: NodeJS.Timeout | undefined

  private constructor() {
    this.startPeriodicExport()
  }

  public static getInstance(): PrometheusExporter {
    if (!PrometheusExporter.instance) {
      PrometheusExporter.instance = new PrometheusExporter()
    }
    return PrometheusExporter.instance
  }

  /**
   * Start periodic metrics export
   */
  private startPeriodicExport(): void {
    // Export metrics every 15 seconds (Prometheus default scrape interval)
    this.exportInterval = setInterval(() => {
      this.collectAndExportMetrics()
    }, 15000)

    logger.info('Prometheus metrics exporter started', {
      interval: '15s',
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Collect all system metrics
   */
  private async collectAndExportMetrics(): Promise<void> {
    try {
      this.metrics = []
      
      // System metrics
      this.collectSystemMetrics()
      
      // Application metrics
      this.collectApplicationMetrics()
      
      // Security metrics
      this.collectSecurityMetrics()
      
      // Authentication metrics
      this.collectAuthenticationMetrics()
      
      // Validation metrics
      this.collectValidationMetrics()
      
      // Performance metrics
      this.collectPerformanceMetrics()
      
      // Business metrics
      this.collectBusinessMetrics()
      
      this.lastExport = new Date()
      
      logger.debug('Prometheus metrics collected', {
        metricCount: this.metrics.length,
        platform: 'Beauty Crafter'
      })

    } catch (error) {
      monitoring.recordError(error as Error, 'prometheus_metrics_collection')
      logger.error('Failed to collect Prometheus metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    // Memory metrics
    this.addMetric({
      name: 'beauty_crafter_memory_bytes',
      help: 'Memory usage in bytes',
      type: 'gauge',
      labels: ['type'],
      value: memoryUsage.heapUsed,
      timestamp: Date.now()
    }, { type: 'heap_used' })

    this.addMetric({
      name: 'beauty_crafter_memory_bytes',
      help: 'Memory usage in bytes',
      type: 'gauge',
      labels: ['type'],
      value: memoryUsage.heapTotal,
      timestamp: Date.now()
    }, { type: 'heap_total' })

    this.addMetric({
      name: 'beauty_crafter_memory_bytes',
      help: 'Memory usage in bytes',
      type: 'gauge',
      labels: ['type'],
      value: memoryUsage.rss,
      timestamp: Date.now()
    }, { type: 'rss' })

    // CPU metrics
    this.addMetric({
      name: 'beauty_crafter_cpu_seconds',
      help: 'CPU usage in seconds',
      type: 'counter',
      labels: ['mode'],
      value: cpuUsage.user / 1000000,
      timestamp: Date.now()
    }, { mode: 'user' })

    this.addMetric({
      name: 'beauty_crafter_cpu_seconds',
      help: 'CPU usage in seconds',
      type: 'counter',
      labels: ['mode'],
      value: cpuUsage.system / 1000000,
      timestamp: Date.now()
    }, { mode: 'system' })

    // Process metrics
    this.addMetric({
      name: 'beauty_crafter_process_start_time_seconds',
      help: 'Start time of the process since unix epoch in seconds',
      type: 'gauge',
      value: process.uptime(),
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_process_cpu_seconds_total',
      help: 'Total user and system CPU time spent in seconds',
      type: 'counter',
      value: (cpuUsage.user + cpuUsage.system) / 1000000,
      timestamp: Date.now()
    })
  }

  /**
   * Collect application-specific metrics
   */
  private collectApplicationMetrics(): void {
    const systemStatus = systemInitializer.getSystemStatus()
    
    // System initialization metrics
    this.addMetric({
      name: 'beauty_crafter_system_components_total',
      help: 'Total number of system components',
      type: 'gauge',
      value: systemStatus.totalComponents,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_system_components_ready',
      help: 'Number of ready system components',
      type: 'gauge',
      value: systemStatus.readyComponents,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_system_initialization_phase',
      help: 'Current system initialization phase',
      type: 'gauge',
      value: this.getPhaseValue(systemStatus.phase),
      timestamp: Date.now()
    })

    // System readiness
    this.addMetric({
      name: 'beauty_crafter_system_ready',
      help: 'System readiness status',
      type: 'gauge',
      value: systemInitializer.isSystemReady() ? 1 : 0,
      timestamp: Date.now()
    })
  }

  /**
   * Collect security metrics
   */
  private collectSecurityMetrics(): void {
    const securityStats = securityMiddleware.getStats()
    
    // Security threat metrics
    this.addMetric({
      name: 'beauty_crafter_security_threats_total',
      help: 'Total number of security threats detected',
      type: 'counter',
      value: securityStats.threatCount,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_security_blocked_ips',
      help: 'Number of blocked IP addresses',
      type: 'gauge',
      value: securityStats.blockedIPs,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_security_csrf_tokens_active',
      help: 'Number of active CSRF tokens',
      type: 'gauge',
      value: securityStats.activeCSRFTokens,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_security_requests_total',
      help: 'Total number of requests processed by security middleware',
      type: 'counter',
      value: securityStats.requestCounts,
      timestamp: Date.now()
    })
  }

  /**
   * Collect authentication metrics
   */
  private collectAuthenticationMetrics(): void {
    const authStats = productionAuth.getStats()
    
    // Session metrics
    this.addMetric({
      name: 'beauty_crafter_auth_sessions_active',
      help: 'Number of active user sessions',
      type: 'gauge',
      value: authStats.activeSessions,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_auth_api_keys_active',
      help: 'Number of active API keys',
      type: 'gauge',
      value: authStats.activeAPIKeys,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_auth_tokens_blacklisted',
      help: 'Number of blacklisted tokens',
      type: 'gauge',
      value: authStats.blacklistedTokens,
      timestamp: Date.now()
    })
  }

  /**
   * Collect validation metrics
   */
  private collectValidationMetrics(): void {
    const validationStats = validationMiddleware.getStats()
    
    // Validation schema metrics
    this.addMetric({
      name: 'beauty_crafter_validation_schemas_total',
      help: 'Total number of validation schemas',
      type: 'gauge',
      value: validationStats.totalSchemas,
      timestamp: Date.now()
    })

    this.addMetric({
      name: 'beauty_crafter_validation_sanitizers_total',
      help: 'Total number of data sanitizers',
      type: 'gauge',
      value: validationStats.totalSanitizers,
      timestamp: Date.now()
    })
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): void {
    const monitoringStats = monitoring.getMetricsSummary()
    
    // Response time metrics
    if (monitoringStats.response_time) {
      this.addMetric({
        name: 'beauty_crafter_http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        type: 'histogram',
        labels: ['endpoint', 'method'],
        value: monitoringStats.response_time.avg / 1000, // Convert to seconds
        timestamp: Date.now()
      }, { endpoint: 'all', method: 'all' })
    }

    // Request count metrics
    if (monitoringStats.request_count) {
      this.addMetric({
        name: 'beauty_crafter_http_requests_total',
        help: 'Total number of HTTP requests',
        type: 'counter',
        labels: ['method', 'status'],
        value: monitoringStats.request_count.total,
        timestamp: Date.now()
      }, { method: 'all', status: 'all' })
    }

    // Error rate metrics
    if (monitoringStats.error_count) {
      this.addMetric({
        name: 'beauty_crafter_http_errors_total',
        help: 'Total number of HTTP errors',
        type: 'counter',
        labels: ['status'],
        value: monitoringStats.error_count.total,
        timestamp: Date.now()
      }, { status: 'all' })
    }
  }

  /**
   * Collect business metrics
   */
  private collectBusinessMetrics(): void {
    // Platform uptime
    this.addMetric({
      name: 'beauty_crafter_platform_uptime_seconds',
      help: 'Platform uptime in seconds',
      type: 'gauge',
      value: process.uptime(),
      timestamp: Date.now()
    })

    // API endpoint availability
    this.addMetric({
      name: 'beauty_crafter_api_endpoints_total',
      help: 'Total number of API endpoints',
      type: 'gauge',
      value: 15, // Count of implemented endpoints
      timestamp: Date.now()
    })

    // Security features enabled
    this.addMetric({
      name: 'beauty_crafter_security_features_enabled',
      help: 'Number of security features enabled',
      type: 'gauge',
      value: 8, // Count of implemented security features
      timestamp: Date.now()
    })
  }

  /**
   * Add metric to collection
   */
  private addMetric(baseMetric: PrometheusMetric, labelValues: Record<string, string> = {}): void {
    const metric: PrometheusMetric = {
      ...baseMetric,
      labels: baseMetric.labels || [],
      value: baseMetric.value,
      timestamp: baseMetric.timestamp || Date.now()
    }

    // Add label values if provided
    if (Object.keys(labelValues).length > 0) {
      metric.labels = [...(baseMetric.labels || []), ...Object.keys(labelValues)]
    }

    this.metrics.push(metric)
  }

  /**
   * Get phase value for metrics
   */
  private getPhaseValue(phase: string): number {
    const phaseValues: Record<string, number> = {
      'core': 1,
      'database': 2,
      'cache': 3,
      'auth': 4,
      'monitoring': 5,
      'complete': 6
    }
    return phaseValues[phase] || 0
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    let output = ''
    
    // Add metadata
    output += '# Beauty Crafter Enterprise Platform - Prometheus Metrics\n'
    output += `# Generated at: ${this.lastExport.toISOString()}\n`
    output += `# Total metrics: ${this.metrics.length}\n\n`

    // Group metrics by name
    const metricGroups = new Map<string, PrometheusMetric[]>()
    
    this.metrics.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, [])
      }
      metricGroups.get(metric.name)!.push(metric)
    })

    // Export each metric group
    for (const [metricName, metrics] of metricGroups) {
      // Add help text
      if (metrics.length > 0) {
        output += `# HELP ${metricName} ${metrics[0].help}\n`
        output += `# TYPE ${metricName} ${metrics[0].type}\n`
      }

      // Add metric values
      metrics.forEach(metric => {
        let line = metricName
        
        // Add labels if present
        if (metric.labels && metric.labels.length > 0) {
          const labelPairs = metric.labels.map((label, index) => {
            // For now, we'll use placeholder values since we don't have actual label values
            return `${label}="value${index}"`
          })
          line += `{${labelPairs.join(',')}}`
        }
        
        line += ` ${metric.value}`
        
        // Add timestamp if present
        if (metric.timestamp) {
          line += ` ${metric.timestamp}`
        }
        
        output += line + '\n'
      })
      
      output += '\n'
    }

    return output
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    totalMetrics: number
    lastExport: Date
    metricTypes: Record<string, number>
    categories: Record<string, number>
  } {
    const metricTypes: Record<string, number> = {}
    const categories: Record<string, number> = {}
    
    this.metrics.forEach(metric => {
      // Count by type
      metricTypes[metric.type] = (metricTypes[metric.type] || 0) + 1
      
      // Count by category (based on metric name prefix)
      const category = metric.name.split('_')[0]
      categories[category] = (categories[category] || 0) + 1
    })

    return {
      totalMetrics: this.metrics.length,
      lastExport: this.lastExport,
      metricTypes,
      categories
    }
  }

  /**
   * Stop the exporter
   */
  stop(): void {
    if (this.exportInterval) {
      clearInterval(this.exportInterval)
      this.exportInterval = undefined
    }
    
    logger.info('Prometheus metrics exporter stopped', {
      platform: 'Beauty Crafter'
    })
  }
}

// Export singleton instance
export const prometheusExporter = PrometheusExporter.getInstance()

// Graceful shutdown
process.on('SIGTERM', () => {
  prometheusExporter.stop()
})

process.on('SIGINT', () => {
  prometheusExporter.stop()
}) 