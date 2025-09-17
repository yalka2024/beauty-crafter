import { logger } from './logging'
import { prisma } from './prisma'

export interface MetricData {
  name: string
  value: number
  timestamp: Date
  labels: Record<string, string>
  metadata?: Record<string, any>
}

export interface AlertRule {
  id: string
  name: string
  description: string
  metric: string
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  cooldown: number // in seconds
  lastTriggered?: Date
}

export interface Alert {
  id: string
  ruleId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metricValue: number
  threshold: number
  timestamp: Date
  isResolved: boolean
  resolvedAt?: Date
  metadata?: Record<string, any>
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastCheck: Date
  details?: Record<string, any>
}

export class MonitoringSystem {
  private static instance: MonitoringSystem
  private metrics: Map<string, MetricData[]> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private alerts: Map<string, Alert> = new Map()
  private healthChecks: Map<string, HealthCheck> = new Map()
  private alertHandlers: Map<string, (alert: Alert) => void> = new Map()
  
  private constructor() {
    this.initializeDefaultAlertRules()
    this.startPeriodicHealthChecks()
  }
  
  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem()
    }
    return MonitoringSystem.instance
  }
  
  /**
   * Record a metric
   */
  recordMetric(metric: Omit<MetricData, 'timestamp'>): void {
    const metricData: MetricData = {
      ...metric,
      timestamp: new Date()
    }
    
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, [])
    }
    
    this.metrics.get(metric.name)!.push(metricData)
    
    // Keep only last 1000 metrics per name
    const metrics = this.metrics.get(metric.name)!
    if (metrics.length > 1000) {
      this.metrics.set(metric.name, metrics.slice(-1000))
    }
    
    // Check alert rules
    this.checkAlertRules(metricData)
    
    logger.info('Metric recorded', { metric: metric.name, value: metric.value })
  }
  
  /**
   * Get metrics for a specific name and time range
   */
  getMetrics(name: string, startTime: Date, endTime: Date): MetricData[] {
    const metrics = this.metrics.get(name) || []
    return metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
  }
  
  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(name: string, interval: '1m' | '5m' | '15m' | '1h' | '1d'): {
    timestamp: Date
    count: number
    sum: number
    avg: number
    min: number
    max: number
  }[] {
    const metrics = this.metrics.get(name) || []
    if (metrics.length === 0) return []
    
    const intervals: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    }
    
    const intervalMs = intervals[interval]
    const now = new Date()
    const startTime = new Date(now.getTime() - intervalMs)
    
    const filteredMetrics = metrics.filter(m => m.timestamp >= startTime)
    
    // Group by interval
    const grouped: { [key: string]: MetricData[] } = {}
    filteredMetrics.forEach(metric => {
      const intervalKey = Math.floor(metric.timestamp.getTime() / intervalMs) * intervalMs
      if (!grouped[intervalKey]) {
        grouped[intervalKey] = []
      }
      grouped[intervalKey].push(metric)
    })
    
    return Object.entries(grouped).map(([timestamp, metrics]) => {
      const values = metrics.map(m => m.value)
      return {
        timestamp: new Date(parseInt(timestamp)),
        count: metrics.length,
        sum: values.reduce((sum, val) => sum + val, 0),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }
  
  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
    logger.info('Alert rule added', { ruleId: rule.id, name: rule.name })
  }
  
  /**
   * Remove an alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId)
    if (removed) {
      logger.info('Alert rule removed', { ruleId })
    }
    return removed
  }
  
  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.isResolved)
  }
  
  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values())
  }
  
  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert && !alert.isResolved) {
      alert.isResolved = true
      alert.resolvedAt = new Date()
      logger.info('Alert resolved', { alertId, ruleId: alert.ruleId })
      return true
    }
    return false
  }
  
  /**
   * Add an alert handler
   */
  addAlertHandler(ruleId: string, handler: (alert: Alert) => void): void {
    this.alertHandlers.set(ruleId, handler)
  }
  
  /**
   * Remove an alert handler
   */
  removeAlertHandler(ruleId: string): boolean {
    return this.alertHandlers.delete(ruleId)
  }
  
  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: HealthCheck[]
    summary: {
      total: number
      healthy: number
      degraded: number
      unhealthy: number
    }
  } {
    const services = Array.from(this.healthChecks.values())
    const healthy = services.filter(s => s.status === 'healthy').length
    const degraded = services.filter(s => s.status === 'degraded').length
    const unhealthy = services.filter(s => s.status === 'unhealthy').length
    const total = services.length
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (unhealthy > 0) {
      overall = 'unhealthy'
    } else if (degraded > 0) {
      overall = 'degraded'
    }
    
    return {
      overall,
      services,
      summary: { total, healthy, degraded, unhealthy }
    }
  }
  
  /**
   * Update health check
   */
  updateHealthCheck(service: string, status: HealthCheck['status'], responseTime: number, details?: Record<string, any>): void {
    this.healthChecks.set(service, {
      service,
      status,
      responseTime,
      lastCheck: new Date(),
      details
    })
  }
  
  /**
   * Check alert rules for a metric
   */
  private checkAlertRules(metric: MetricData): void {
    for (const rule of this.alertRules.values()) {
      if (rule.metric === metric.name && rule.enabled) {
        const shouldTrigger = this.evaluateAlertRule(rule, metric.value)
        
        if (shouldTrigger) {
          // Check cooldown
          if (rule.lastTriggered) {
            const timeSinceLastTrigger = (Date.now() - rule.lastTriggered.getTime()) / 1000
            if (timeSinceLastTrigger < rule.cooldown) {
              continue
            }
          }
          
          this.triggerAlert(rule, metric)
          rule.lastTriggered = new Date()
        }
      }
    }
  }
  
  /**
   * Evaluate if an alert rule should trigger
   */
  private evaluateAlertRule(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold
      case 'gte':
        return value >= rule.threshold
      case 'lt':
        return value < rule.threshold
      case 'lte':
        return value <= rule.threshold
      case 'eq':
        return value === rule.threshold
      default:
        return false
    }
  }
  
  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, metric: MetricData): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${metric.name} = ${metric.value} ${rule.condition} ${rule.threshold}`,
      metricValue: metric.value,
      threshold: rule.threshold,
      timestamp: new Date(),
      isResolved: false,
      metadata: {
        metricName: metric.name,
        metricLabels: metric.labels,
        ruleDescription: rule.description
      }
    }
    
    this.alerts.set(alert.id, alert)
    
    // Call alert handler if exists
    const handler = this.alertHandlers.get(rule.id)
    if (handler) {
      try {
        handler(alert)
      } catch (error) {
        logger.error('Error in alert handler', { error, ruleId: rule.id })
      }
    }
    
    logger.warn('Alert triggered', { 
      alertId: alert.id, 
      ruleId: rule.id, 
      severity: rule.severity,
      message: alert.message 
    })
  }
  
  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    // High response time alert
    this.addAlertRule({
      id: 'high_response_time',
      name: 'High Response Time',
      description: 'API response time is too high',
      metric: 'api_response_time',
      condition: 'gt',
      threshold: 5000, // 5 seconds
      severity: 'high',
      enabled: true,
      cooldown: 300 // 5 minutes
    })
    
    // High error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate is too high',
      metric: 'error_rate',
      condition: 'gt',
      threshold: 0.1, // 10%
      severity: 'critical',
      enabled: true,
      cooldown: 60 // 1 minute
    })
    
    // Low availability alert
    this.addAlertRule({
      id: 'low_availability',
      name: 'Low Availability',
      description: 'Service availability is too low',
      metric: 'availability',
      condition: 'lt',
      threshold: 0.99, // 99%
      severity: 'critical',
      enabled: true,
      cooldown: 300 // 5 minutes
    })
    
    // High memory usage alert
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage is too high',
      metric: 'memory_usage',
      condition: 'gt',
      threshold: 0.9, // 90%
      severity: 'medium',
      enabled: true,
      cooldown: 600 // 10 minutes
    })
  }
  
  /**
   * Start periodic health checks
   */
  private startPeriodicHealthChecks(): void {
    // Check database connection every 30 seconds
    setInterval(async () => {
      try {
        const start = Date.now()
        await prisma.$queryRaw`SELECT 1`
        const responseTime = Date.now() - start
        
        this.updateHealthCheck('database', 'healthy', responseTime)
             } catch (error) {
         this.updateHealthCheck('database', 'unhealthy', 0, { error: error instanceof Error ? error.message : String(error) })
       }
    }, 30000)
    
    // Check external services every minute
    setInterval(async () => {
      // Check payment gateway
      try {
        const start = Date.now()
        // Simulate payment gateway check
        await new Promise(resolve => setTimeout(resolve, 100))
        const responseTime = Date.now() - start
        
        this.updateHealthCheck('payment_gateway', 'healthy', responseTime)
             } catch (error) {
         this.updateHealthCheck('payment_gateway', 'unhealthy', 0, { error: error instanceof Error ? error.message : String(error) })
       }
      
      // Check email service
      try {
        const start = Date.now()
        // Simulate email service check
        await new Promise(resolve => setTimeout(resolve, 50))
        const responseTime = Date.now() - start
        
        this.updateHealthCheck('email_service', 'healthy', responseTime)
             } catch (error) {
         this.updateHealthCheck('email_service', 'unhealthy', 0, { error: error instanceof Error ? error.message : String(error) })
       }
    }, 60000)
  }
  
  /**
   * Export metrics for Prometheus
   */
  exportPrometheusMetrics(): string {
    let metrics = ''
    
    // Export custom metrics
    for (const [name, data] of this.metrics.entries()) {
      if (data.length > 0) {
        const latest = data[data.length - 1]
        const labels = Object.entries(latest.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',')
        
        metrics += `# HELP ${name} ${name} metric\n`
        metrics += `# TYPE ${name} gauge\n`
        metrics += `${name}{${labels}} ${latest.value}\n`
      }
    }
    
    // Export health check metrics
    for (const [service, health] of this.healthChecks.entries()) {
      const statusValue = health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0
      metrics += `# HELP service_health Service health status\n`
      metrics += `# TYPE service_health gauge\n`
      metrics += `service_health{service="${service}"} ${statusValue}\n`
      
      metrics += `# HELP service_response_time Service response time\n`
      metrics += `# TYPE service_response_time gauge\n`
      metrics += `service_response_time{service="${service}"} ${health.responseTime}\n`
    }
    
    // Export alert metrics
    const activeAlerts = this.getActiveAlerts()
    for (const severity of ['low', 'medium', 'high', 'critical'] as const) {
      const count = activeAlerts.filter(a => a.severity === severity).length
      metrics += `# HELP active_alerts Active alerts count\n`
      metrics += `# TYPE active_alerts gauge\n`
      metrics += `active_alerts{severity="${severity}"} ${count}\n`
    }
    
    return metrics
  }
  
  /**
   * Get dashboard data
   */
  getDashboardData(): {
    metrics: { [key: string]: number }
    alerts: { [severity: string]: number }
    health: { [service: string]: string }
    trends: { [metric: string]: { value: number; change: number } }
  } {
    const metrics: { [key: string]: number } = {}
    const alerts: { [severity: string]: number } = {}
    const health: { [service: string]: string } = {}
    const trends: { [metric: string]: { value: number; change: number } } = {}
    
    // Current metric values
    for (const [name, data] of this.metrics.entries()) {
      if (data.length > 0) {
        metrics[name] = data[data.length - 1].value
      }
    }
    
    // Alert counts by severity
    const activeAlerts = this.getActiveAlerts()
    for (const severity of ['low', 'medium', 'high', 'critical'] as const) {
      alerts[severity] = activeAlerts.filter(a => a.severity === severity).length
    }
    
    // Health status
    for (const [service, healthCheck] of this.healthChecks.entries()) {
      health[service] = healthCheck.status
    }
    
    // Trend analysis (simple change from 1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    for (const [name, data] of this.metrics.entries()) {
      if (data.length > 1) {
        const current = data[data.length - 1].value
        const past = data.find(m => m.timestamp >= oneHourAgo)?.value || current
        const change = ((current - past) / past) * 100
        
        trends[name] = { value: current, change }
      }
    }
    
    return { metrics, alerts, health, trends }
  }
}

// Export singleton instance
export const monitoring = MonitoringSystem.getInstance()

// Export convenience functions
export const recordMetric = (metric: Omit<MetricData, 'timestamp'>) => monitoring.recordMetric(metric)
export const getSystemHealth = () => monitoring.getSystemHealth()
export const getDashboardData = () => monitoring.getDashboardData()
export const exportPrometheusMetrics = () => monitoring.exportPrometheusMetrics() 