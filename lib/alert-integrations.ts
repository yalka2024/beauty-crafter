import { logger } from './logging'

interface AlertData {
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  source: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface SlackAlert {
  text: string
  attachments: Array<{
    color: string
    fields: Array<{
      title: string
      value: string
      short: boolean
    }>
    footer: string
    ts: number
  }>
}

interface EmailAlert {
  to: string
  subject: string
  html: string
  text: string
}

export class AlertIntegrations {
  private static instance: AlertIntegrations
  private slackWebhookUrl: string
  private emailService: any
  private pagerDutyKey: string

  private constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || ''
    this.pagerDutyKey = process.env.PAGERDUTY_INTEGRATION_KEY || ''
    
    // Initialize email service (using Resend or similar)
    this.emailService = {
      send: async (email: EmailAlert) => {
        // Implementation would depend on your email service
        console.log('Email sent:', email.subject)
      }
    }
  }

  public static getInstance(): AlertIntegrations {
    if (!AlertIntegrations.instance) {
      AlertIntegrations.instance = new AlertIntegrations()
    }
    return AlertIntegrations.instance
  }

  /**
   * Send alert to all configured channels
   */
  async sendAlert(alertData: AlertData): Promise<{
    success: boolean
    results: Record<string, boolean>
  }> {
    const results: Record<string, boolean> = {}

    try {
      // Send to Slack
      if (this.slackWebhookUrl) {
        results.slack = await this.sendSlackAlert(alertData)
      }

      // Send to Email
      if (process.env.ALERT_EMAIL) {
        results.email = await this.sendEmailAlert(alertData)
      }

      // Send to PagerDuty for critical alerts
      if (alertData.severity === 'critical' && this.pagerDutyKey) {
        results.pagerduty = await this.sendPagerDutyAlert(alertData)
      }

      const success = Object.values(results).some(result => result)

      logger.info('Alert sent', {
        alert: alertData.title,
        severity: alertData.severity,
        results
      })

      return { success, results }
    } catch (error) {
      logger.error('Failed to send alert', { error, alert: alertData.title })
      return { success: false, results }
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alertData: AlertData): Promise<boolean> {
    try {
      const slackAlert: SlackAlert = {
        text: `🚨 ${alertData.title}`,
        attachments: [{
          color: this.getSeverityColor(alertData.severity),
          fields: [
            { title: 'Severity', value: alertData.severity.toUpperCase(), short: true },
            { title: 'Source', value: alertData.source, short: true },
            { title: 'Message', value: alertData.message, short: false },
            { title: 'Timestamp', value: alertData.timestamp.toISOString(), short: true }
          ],
          footer: 'Beauty Crafter Platform',
          ts: Math.floor(alertData.timestamp.getTime() / 1000)
        }]
      }

      // Add metadata if present
      if (alertData.metadata) {
        Object.entries(alertData.metadata).forEach(([key, value]) => {
          slackAlert.attachments[0].fields.push({
            title: key,
            value: String(value),
            short: true
          })
        })
      }

      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackAlert)
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`)
      }

      return true
    } catch (error) {
      logger.error('Slack alert failed', { error, alert: alertData.title })
      return false
    }
  }

  /**
   * Send alert to Email
   */
  private async sendEmailAlert(alertData: AlertData): Promise<boolean> {
    try {
      const emailAlert: EmailAlert = {
        to: process.env.ALERT_EMAIL!,
        subject: `[${alertData.severity.toUpperCase()}] ${alertData.title}`,
        html: this.generateEmailHTML(alertData),
        text: this.generateEmailText(alertData)
      }

      await this.emailService.send(emailAlert)
      return true
    } catch (error) {
      logger.error('Email alert failed', { error, alert: alertData.title })
      return false
    }
  }

  /**
   * Send alert to PagerDuty
   */
  private async sendPagerDutyAlert(alertData: AlertData): Promise<boolean> {
    try {
      const pagerDutyAlert = {
        routing_key: this.pagerDutyKey,
        event_action: 'trigger',
        dedup_key: `${alertData.source}-${alertData.title}`,
        payload: {
          summary: alertData.title,
          source: alertData.source,
          severity: alertData.severity,
          timestamp: alertData.timestamp.toISOString(),
          custom_details: {
            message: alertData.message,
            metadata: alertData.metadata || {}
          }
        }
      }

      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pagerDutyAlert)
      })

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.status}`)
      }

      return true
    } catch (error) {
      logger.error('PagerDuty alert failed', { error, alert: alertData.title })
      return false
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(alertData: AlertData): string {
    const severityColor = this.getSeverityColor(alertData.severity)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { background-color: ${severityColor}; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f5f5f5; border-radius: 5px; margin-top: 10px; }
          .field { margin: 10px 0; }
          .field-label { font-weight: bold; }
          .metadata { background-color: #e9e9e9; padding: 10px; border-radius: 3px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 ${alertData.title}</h1>
          <p>Severity: ${alertData.severity.toUpperCase()}</p>
        </div>
        <div class="content">
          <div class="field">
            <span class="field-label">Source:</span> ${alertData.source}
          </div>
          <div class="field">
            <span class="field-label">Message:</span> ${alertData.message}
          </div>
          <div class="field">
            <span class="field-label">Timestamp:</span> ${alertData.timestamp.toISOString()}
          </div>
          ${alertData.metadata ? `
            <div class="metadata">
              <h3>Additional Details:</h3>
              ${Object.entries(alertData.metadata).map(([key, value]) => 
                `<div><strong>${key}:</strong> ${value}</div>`
              ).join('')}
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(alertData: AlertData): string {
    let text = `ALERT: ${alertData.title}\n`
    text += `Severity: ${alertData.severity.toUpperCase()}\n`
    text += `Source: ${alertData.source}\n`
    text += `Message: ${alertData.message}\n`
    text += `Timestamp: ${alertData.timestamp.toISOString()}\n`
    
    if (alertData.metadata) {
      text += `\nAdditional Details:\n`
      Object.entries(alertData.metadata).forEach(([key, value]) => {
        text += `${key}: ${value}\n`
      })
    }
    
    return text
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
   * Test alert integrations
   */
  async testIntegrations(): Promise<{
    slack: boolean
    email: boolean
    pagerduty: boolean
  }> {
    const testAlert: AlertData = {
      severity: 'low',
      title: 'Test Alert',
      message: 'This is a test alert to verify integration functionality',
      source: 'Alert System Test',
      timestamp: new Date(),
      metadata: {
        test: true,
        environment: process.env.NODE_ENV || 'development'
      }
    }

    const results = await this.sendAlert(testAlert)
    
    logger.info('Alert integration test completed', { results })
    
    return {
      slack: results.results.slack || false,
      email: results.results.email || false,
      pagerduty: results.results.pagerduty || false
    }
  }

  /**
   * Send system health alert
   */
  async sendHealthAlert(healthData: {
    status: string
    services: Record<string, { status: string; responseTime: number }>
    timestamp: Date
  }): Promise<void> {
    const alertData: AlertData = {
      severity: healthData.status === 'healthy' ? 'low' : 'critical',
      title: `System Health: ${healthData.status.toUpperCase()}`,
      message: `System health check completed with status: ${healthData.status}`,
      source: 'Health Check System',
      timestamp: healthData.timestamp,
      metadata: healthData.services
    }

    await this.sendAlert(alertData)
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(securityData: {
    type: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    source: string
    metadata?: Record<string, any>
  }): Promise<void> {
    const alertData: AlertData = {
      severity: securityData.severity,
      title: `Security Alert: ${securityData.type}`,
      message: securityData.description,
      source: securityData.source,
      timestamp: new Date(),
      metadata: securityData.metadata
    }

    await this.sendAlert(alertData)
  }
}

// Export singleton instance
export const alertIntegrations = AlertIntegrations.getInstance()