import { MonitoringSystem, MetricData, AlertRule, Alert } from '@/lib/monitoring'

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn()
  }
}))

describe('MonitoringSystem', () => {
  let monitoring: MonitoringSystem

  beforeEach(() => {
    // Reset singleton instance
    (MonitoringSystem as any).instance = undefined
    monitoring = MonitoringSystem.getInstance()
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MonitoringSystem.getInstance()
      const instance2 = MonitoringSystem.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('recordMetric', () => {
    it('should record a metric successfully', () => {
      const metric: Omit<MetricData, 'timestamp'> = {
        name: 'test_metric',
        value: 42,
        labels: { service: 'test', endpoint: '/api/test' }
      }

      monitoring.recordMetric(metric)

      const metrics = monitoring['metrics'].get('test_metric')
      expect(metrics).toHaveLength(1)
      expect(metrics![0].value).toBe(42)
      expect(metrics![0].labels).toEqual({ service: 'test', endpoint: '/api/test' })
      expect(metrics![0].timestamp).toBeInstanceOf(Date)
    })

    it('should limit metrics to 1000 per name', () => {
      const metric: Omit<MetricData, 'timestamp'> = {
        name: 'test_metric',
        value: 0,
        labels: { service: 'test' }
      }

      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        monitoring.recordMetric({ ...metric, value: i })
      }

      const metrics = monitoring['metrics'].get('test_metric')
      expect(metrics).toHaveLength(1000)
      expect(metrics![0].value).toBe(1) // First one should be removed
      expect(metrics![999].value).toBe(1000) // Last one should remain
    })

    it('should check alert rules when recording metrics', () => {
      // Add an alert rule
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 60
      }
      monitoring.addAlertRule(rule)

      // Record a metric that should trigger the alert
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      const alerts = monitoring.getActiveAlerts()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].ruleId).toBe('test_rule')
      expect(alerts[0].severity).toBe('high')
    })
  })

  describe('getMetrics', () => {
    it('should return metrics within time range', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      // Add metrics at different times
      monitoring.recordMetric({
        name: 'test_metric',
        value: 10,
        labels: { service: 'test' }
      })

      // Mock timestamp for older metric
      const metrics = monitoring['metrics'].get('test_metric')!
      metrics[0].timestamp = twoHoursAgo

      const result = monitoring.getMetrics('test_metric', oneHourAgo, now)
      expect(result).toHaveLength(1)
      expect(result[0].value).toBe(10)
    })

    it('should return empty array for non-existent metric', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const result = monitoring.getMetrics('non_existent', oneHourAgo, now)
      expect(result).toHaveLength(0)
    })
  })

  describe('getAggregatedMetrics', () => {
    it('should aggregate metrics by interval', () => {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

      // Add multiple metrics
      for (let i = 0; i < 5; i++) {
        monitoring.recordMetric({
          name: 'test_metric',
          value: i + 1,
          labels: { service: 'test' }
        })
      }

      const aggregated = monitoring.getAggregatedMetrics('test_metric', '1m')
      expect(aggregated).toHaveLength(1)
      expect(aggregated[0].count).toBe(5)
      expect(aggregated[0].sum).toBe(15)
      expect(aggregated[0].avg).toBe(3)
      expect(aggregated[0].min).toBe(1)
      expect(aggregated[0].max).toBe(5)
    })

    it('should handle empty metrics gracefully', () => {
      const aggregated = monitoring.getAggregatedMetrics('non_existent', '1m')
      expect(aggregated).toHaveLength(0)
    })
  })

  describe('Alert Rules', () => {
    it('should add alert rule successfully', () => {
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 100,
        severity: 'critical',
        enabled: true,
        cooldown: 300
      }

      monitoring.addAlertRule(rule)
      const rules = monitoring.getAlertRules()
      
      expect(rules).toHaveLength(4) // 3 default + 1 custom
      expect(rules.find(r => r.id === 'test_rule')).toEqual(rule)
    })

    it('should remove alert rule successfully', () => {
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 100,
        severity: 'critical',
        enabled: true,
        cooldown: 300
      }

      monitoring.addAlertRule(rule)
      const removed = monitoring.removeAlertRule('test_rule')
      
      expect(removed).toBe(true)
      expect(monitoring.getAlertRules().find(r => r.id === 'test_rule')).toBeUndefined()
    })

    it('should return false when removing non-existent rule', () => {
      const removed = monitoring.removeAlertRule('non_existent')
      expect(removed).toBe(false)
    })
  })

  describe('Alert Handling', () => {
    it('should trigger alert when condition is met', () => {
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 60
      }

      monitoring.addAlertRule(rule)

      // Record metric that triggers alert
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      const alerts = monitoring.getActiveAlerts()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].ruleId).toBe('test_rule')
      expect(alerts[0].metricValue).toBe(75)
      expect(alerts[0].threshold).toBe(50)
      expect(alerts[0].isResolved).toBe(false)
    })

    it('should respect alert cooldown', () => {
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 1 // 1 second cooldown
      }

      monitoring.addAlertRule(rule)

      // First metric should trigger alert
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      expect(monitoring.getActiveAlerts()).toHaveLength(1)

      // Second metric within cooldown should not trigger
      monitoring.recordMetric({
        name: 'test_metric',
        value: 80,
        labels: { service: 'test' }
      })

      expect(monitoring.getActiveAlerts()).toHaveLength(1) // Still only one alert
    })

    it('should resolve alert successfully', () => {
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 60
      }

      monitoring.addAlertRule(rule)

      // Trigger alert
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      const alerts = monitoring.getActiveAlerts()
      expect(alerts).toHaveLength(1)

      const alertId = alerts[0].id
      const resolved = monitoring.resolveAlert(alertId)
      
      expect(resolved).toBe(true)
      expect(monitoring.getActiveAlerts()).toHaveLength(0)
      
      const allAlerts = monitoring.getAllAlerts()
      const resolvedAlert = allAlerts.find(a => a.id === alertId)
      expect(resolvedAlert?.isResolved).toBe(true)
      expect(resolvedAlert?.resolvedAt).toBeInstanceOf(Date)
    })

    it('should return false when resolving non-existent alert', () => {
      const resolved = monitoring.resolveAlert('non_existent')
      expect(resolved).toBe(false)
    })
  })

  describe('Alert Handlers', () => {
    it('should call alert handler when alert is triggered', () => {
      const handler = jest.fn()
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 60
      }

      monitoring.addAlertRule(rule)
      monitoring.addAlertHandler('test_rule', handler)

      // Trigger alert
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        ruleId: 'test_rule',
        severity: 'high'
      }))
    })

    it('should handle alert handler errors gracefully', () => {
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })

      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 60
      }

      monitoring.addAlertRule(rule)
      monitoring.addAlertHandler('test_rule', handler)

      // Should not throw error
      expect(() => {
        monitoring.recordMetric({
          name: 'test_metric',
          value: 75,
          labels: { service: 'test' }
        })
      }).not.toThrow()

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Health Checks', () => {
    it('should update health check successfully', () => {
      monitoring.updateHealthCheck('test_service', 'healthy', 150, { version: '1.0.0' })

      const health = monitoring.getSystemHealth()
      const service = health.services.find(s => s.service === 'test_service')
      
      expect(service).toBeDefined()
      expect(service!.status).toBe('healthy')
      expect(service!.responseTime).toBe(150)
      expect(service!.details).toEqual({ version: '1.0.0' })
    })

    it('should calculate overall health status correctly', () => {
      monitoring.updateHealthCheck('service1', 'healthy', 100)
      monitoring.updateHealthCheck('service2', 'degraded', 500)
      monitoring.updateHealthCheck('service3', 'unhealthy', 0)

      const health = monitoring.getSystemHealth()
      
      expect(health.overall).toBe('unhealthy')
      expect(health.summary.total).toBe(3)
      expect(health.summary.healthy).toBe(1)
      expect(health.summary.degraded).toBe(1)
      expect(health.summary.unhealthy).toBe(1)
    })
  })

  describe('Prometheus Export', () => {
    it('should export metrics in Prometheus format', () => {
      monitoring.recordMetric({
        name: 'test_metric',
        value: 42,
        labels: { service: 'test', endpoint: '/api/test' }
      })

      monitoring.updateHealthCheck('test_service', 'healthy', 150)

      const prometheusMetrics = monitoring.exportPrometheusMetrics()
      
      expect(prometheusMetrics).toContain('# HELP test_metric test_metric metric')
      expect(prometheusMetrics).toContain('# TYPE test_metric gauge')
      expect(prometheusMetrics).toContain('test_metric{service="test",endpoint="/api/test"} 42')
      expect(prometheusMetrics).toContain('service_health{service="test_service"} 1')
      expect(prometheusMetrics).toContain('service_response_time{service="test_service"} 150')
    })
  })

  describe('Dashboard Data', () => {
    it('should return comprehensive dashboard data', () => {
      // Add some metrics
      monitoring.recordMetric({
        name: 'response_time',
        value: 150,
        labels: { service: 'api' }
      })

      monitoring.recordMetric({
        name: 'error_rate',
        value: 0.05,
        labels: { service: 'api' }
      })

      // Add an alert
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: true,
        cooldown: 60
      }

      monitoring.addAlertRule(rule)
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      // Update health checks
      monitoring.updateHealthCheck('database', 'healthy', 50)
      monitoring.updateHealthCheck('api', 'degraded', 500)

      const dashboardData = monitoring.getDashboardData()

      expect(dashboardData.metrics.response_time).toBe(150)
      expect(dashboardData.metrics.error_rate).toBe(0.05)
      expect(dashboardData.alerts.high).toBe(1)
      expect(dashboardData.health.database).toBe('healthy')
      expect(dashboardData.health.api).toBe('degraded')
      expect(dashboardData.trends.response_time).toBeDefined()
    })
  })

  describe('Default Alert Rules', () => {
    it('should have default alert rules configured', () => {
      const rules = monitoring.getAlertRules()
      
      expect(rules).toHaveLength(4)
      
      const highResponseTime = rules.find(r => r.id === 'high_response_time')
      expect(highResponseTime).toBeDefined()
      expect(highResponseTime!.metric).toBe('api_response_time')
      expect(highResponseTime!.condition).toBe('gt')
      expect(highResponseTime!.threshold).toBe(5000)
      expect(highResponseTime!.severity).toBe('high')

      const highErrorRate = rules.find(r => r.id === 'high_error_rate')
      expect(highErrorRate).toBeDefined()
      expect(highErrorRate!.metric).toBe('error_rate')
      expect(highErrorRate!.condition).toBe('gt')
      expect(highErrorRate!.threshold).toBe(0.1)
      expect(highErrorRate!.severity).toBe('critical')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty metric labels gracefully', () => {
      monitoring.recordMetric({
        name: 'test_metric',
        value: 42,
        labels: {}
      })

      const prometheusMetrics = monitoring.exportPrometheusMetrics()
      expect(prometheusMetrics).toContain('test_metric{} 42')
    })

    it('should handle disabled alert rules', () => {
      const rule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        metric: 'test_metric',
        condition: 'gt',
        threshold: 50,
        severity: 'high',
        enabled: false, // Disabled
        cooldown: 60
      }

      monitoring.addAlertRule(rule)

      // Should not trigger alert
      monitoring.recordMetric({
        name: 'test_metric',
        value: 75,
        labels: { service: 'test' }
      })

      expect(monitoring.getActiveAlerts()).toHaveLength(0)
    })
  })
})
