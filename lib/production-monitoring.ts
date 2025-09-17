import { logger } from './logging'
import { prisma } from './prisma'

interface AlertRule {
  id: string
  name: string
  condition: (metrics: any) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // in milliseconds
  lastTriggered?: Date
  enabled: boolean
}

interface SystemMetrics {
  timestamp: Date
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  database: {
    connections: number
    maxConnections: number
    queryTime: number
  }
  api: {
    requestsPerMinute: number
    errorRate: number
    averageResponseTime: number
  }
  business: {
    activeUsers: number
    bookingsToday: number
    revenueToday: number
  }
}

export class ProductionMonitoring {
  private static instance: ProductionMonitoring
  private alertRules: AlertRule[] = []
  private metrics: SystemMetrics[] = []
  private isRunning: boolean = false

  private constructor() {
    this.initializeAlertRules()
  }

  public static getInstance(): ProductionMonitoring {
    if (!ProductionMonitoring.instance) {
      ProductionMonitoring.instance = new ProductionMonitoring()
    }
    return ProductionMonitoring.instance
  }

  /**
   * Start monitoring system
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    logger.info('Production monitoring started')

    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics()
    }, 30000)

    // Check alerts every 10 seconds
    setInterval(() => {
      this.checkAlerts()
    }, 10000)

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 3600000)
  }

  /**
   * Stop monitoring system
   */
  stop(): void {
    this.isRunning = false
    logger.info('Production monitoring stopped')
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: await this.getCPUUsage(),
        memory: await this.getMemoryUsage(),
        database: await this.getDatabaseMetrics(),
        api: await this.getAPIMetrics(),
        business: await this.getBusinessMetrics()
      }

      this.metrics.push(metrics)

      // Keep only last 24 hours of metrics
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff)

      logger.debug('Metrics collected', { timestamp: metrics.timestamp })
    } catch (error) {
      logger.error('Failed to collect metrics', { error })
    }
  }

  /**
   * Get CPU usage metrics
   */
  private async getCPUUsage(): Promise<{ usage: number; loadAverage: number[] }> {
    const usage = process.cpuUsage()
    const loadAverage = require('os').loadavg()

    return {
      usage: (usage.user + usage.system) / 1000000, // Convert to seconds
      loadAverage
    }
  }

  /**
   * Get memory usage metrics
   */
  private async getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    const usage = process.memoryUsage()
    const total = require('os').totalmem()
    const used = usage.heapUsed + usage.external

    return {
      used,
      total,
      percentage: (used / total) * 100
    }
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<{ connections: number; maxConnections: number; queryTime: number }> {
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const queryTime = Date.now() - start

      // Get connection pool info (this would be database-specific)
      const connections = 5 // Mock value - would get from actual pool
      const maxConnections = 20 // Mock value

      return {
        connections,
        maxConnections,
        queryTime
      }
    } catch (error) {
      logger.error('Failed to get database metrics', { error })
      return {
        connections: 0,
        maxConnections: 0,
        queryTime: 0
      }
    }
  }

  /**
   * Get API metrics
   */
  private async getAPIMetrics(): Promise<{ requestsPerMinute: number; errorRate: number; averageResponseTime: number }> {
    // This would integrate with your actual API metrics collection
    // For now, return mock values
    return {
      requestsPerMinute: 150,
      errorRate: 0.02, // 2%
      averageResponseTime: 250 // ms
    }
  }

  /**
   * Get business metrics
   */
  private async getBusinessMetrics(): Promise<{ activeUsers: number; bookingsToday: number; revenueToday: number }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const activeUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      const bookingsToday = await prisma.booking.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      })

      const revenueToday = await prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: today
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      })

      return {
        activeUsers,
        bookingsToday,
        revenueToday: Number(revenueToday._sum.amount || 0)
      }
    } catch (error) {
      logger.error('Failed to get business metrics', { error })
      return {
        activeUsers: 0,
        bookingsToday: 0,
        revenueToday: 0
      }
    }
  }

  /**
   * Check alert rules
   */
  private checkAlerts(): void {
    if (this.metrics.length === 0) return

    const latestMetrics = this.metrics[this.metrics.length - 1]

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime()
        if (timeSinceLastTrigger < rule.cooldown) continue
      }

      // Check condition
      if (rule.condition(latestMetrics)) {
        this.triggerAlert(rule, latestMetrics)
        rule.lastTriggered = new Date()
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, metrics: SystemMetrics): void {
    logger.warn(`Alert triggered: ${rule.name}`, {
      rule: rule.id,
      severity: rule.severity,
      metrics: {
        cpu: metrics.cpu.usage,
        memory: metrics.memory.percentage,
        database: metrics.database.queryTime,
        api: metrics.api.errorRate
      }
    })

    // Send alert to monitoring system
    this.sendAlert(rule, metrics)
  }

  /**
   * Send alert to external systems
   */
  private async sendAlert(rule: AlertRule, metrics: SystemMetrics): Promise<void> {
    try {
      // Send to Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Alert: ${rule.name}`,
            attachments: [{
              color: this.getSeverityColor(rule.severity),
              fields: [
                { title: 'Severity', value: rule.severity, short: true },
                { title: 'CPU Usage', value: `${metrics.cpu.usage.toFixed(2)}%`, short: true },
                { title: 'Memory Usage', value: `${metrics.memory.percentage.toFixed(2)}%`, short: true },
                { title: 'Error Rate', value: `${(metrics.api.errorRate * 100).toFixed(2)}%`, short: true }
              ]
            }]
          })
        })
      }

      // Send to email (if configured)
      if (process.env.ALERT_EMAIL) {
        // Implement email alerting
        logger.info('Email alert sent', { rule: rule.name })
      }
    } catch (error) {
      logger.error('Failed to send alert', { error })
    }
  }

  /**
   * Get severity color for alerts
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return '#36a64f'
      case 'medium': return '#ffeb3b'
      case 'high': return '#ff9800'
      case 'critical': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  /**
   * Initialize alert rules
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        condition: (metrics) => metrics.cpu.usage > 80,
        severity: 'high',
        cooldown: 300000, // 5 minutes
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: (metrics) => metrics.memory.percentage > 85,
        severity: 'high',
        cooldown: 300000,
        enabled: true
      },
      {
        id: 'database_slow_queries',
        name: 'Slow Database Queries',
        condition: (metrics) => metrics.database.queryTime > 1000,
        severity: 'medium',
        cooldown: 600000, // 10 minutes
        enabled: true
      },
      {
        id: 'high_error_rate',
        name: 'High API Error Rate',
        condition: (metrics) => metrics.api.errorRate > 0.05, // 5%
        severity: 'critical',
        cooldown: 60000, // 1 minute
        enabled: true
      },
      {
        id: 'low_active_users',
        name: 'Low Active Users',
        condition: (metrics) => metrics.business.activeUsers < 10,
        severity: 'low',
        cooldown: 1800000, // 30 minutes
        enabled: true
      }
    ]
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const beforeCount = this.metrics.length
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    const afterCount = this.metrics.length

    logger.info('Cleaned up old metrics', { 
      removed: beforeCount - afterCount,
      remaining: afterCount 
    })
  }

  /**
   * Get current metrics
   */
  getMetrics(): SystemMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId)
    if (!rule) return false

    Object.assign(rule, updates)
    return true
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule)
  }
}

// Export singleton instance
export const productionMonitoring = ProductionMonitoring.getInstance()

