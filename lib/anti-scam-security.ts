import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

export interface FraudDetectionRule {
  id: string
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  conditions: any
  action: 'alert' | 'block' | 'review'
  isActive: boolean
}

export interface DeviceFingerprintData {
  userId: string
  fingerprint: string
  userAgent: string
  ipAddress: string
  location?: any
  isTrusted: boolean
}

export interface DisputeData {
  bookingId: string
  clientId: string
  providerId: string
  type: 'payment' | 'service' | 'cancellation' | 'no_show'
  reason: string
  description: string
  evidence?: any
}

export class AntiScamSecurityManager {
  private fraudRules: FraudDetectionRule[] = [
    {
      id: 'rapid_bookings',
      name: 'Rapid Bookings',
      description: 'Multiple bookings from new account in short time',
      severity: 'medium',
      conditions: {
        maxBookings: 3,
        timeWindow: 24 * 60 * 60 * 1000, // 24 hours
        accountAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      action: 'alert',
      isActive: true
    },
    {
      id: 'fake_reviews',
      name: 'Fake Reviews',
      description: 'Suspicious review patterns',
      severity: 'high',
      conditions: {
        maxReviewsPerDay: 5,
        identicalReviews: 3,
        reviewBurst: 10
      },
      action: 'block',
      isActive: true
    },
    {
      id: 'account_takeover',
      name: 'Account Takeover',
      description: 'Login from new device/location',
      severity: 'critical',
      conditions: {
        newDevice: true,
        locationChange: true,
        timeOfDay: 'unusual'
      },
      action: 'block',
      isActive: true
    },
    {
      id: 'payment_fraud',
      name: 'Payment Fraud',
      description: 'Suspicious payment patterns',
      severity: 'high',
      conditions: {
        multipleCards: 3,
        failedPayments: 5,
        highValue: 1000
      },
      action: 'review',
      isActive: true
    }
  ]

  /**
   * Detect fraud patterns
   */
  async detectFraud(userId: string, action: string, data: any): Promise<boolean> {
    try {
      for (const rule of this.fraudRules) {
        if (!rule.isActive) continue

        const isTriggered = await this.evaluateRule(rule, userId, action, data)
        if (isTriggered) {
          await this.handleFraudDetection(rule, userId, action, data)
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error detecting fraud:', error)
      return false
    }
  }

  /**
   * Create device fingerprint
   */
  async createDeviceFingerprint(data: DeviceFingerprintData): Promise<string> {
    try {
      const fingerprint = await prisma.deviceFingerprint.upsert({
        where: { fingerprint: data.fingerprint },
        update: {
          lastSeenAt: new Date(),
          isTrusted: data.isTrusted
        },
        create: {
          userId: data.userId,
          fingerprint: data.fingerprint,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          location: data.location,
          isTrusted: data.isTrusted
        }
      })

      return fingerprint.id
    } catch (error) {
      console.error('Error creating device fingerprint:', error)
      throw new Error('Failed to create device fingerprint')
    }
  }

  /**
   * Verify device trust
   */
  async verifyDeviceTrust(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const device = await prisma.deviceFingerprint.findUnique({
        where: { fingerprint }
      })

      if (!device) return false

      // Check if device belongs to user
      if (device.userId !== userId) return false

      // Check if device is trusted
      return device.isTrusted
    } catch (error) {
      console.error('Error verifying device trust:', error)
      return false
    }
  }

  /**
   * Create dispute
   */
  async createDispute(data: DisputeData): Promise<string> {
    try {
      const dispute = await prisma.dispute.create({
        data: {
          bookingId: data.bookingId,
          clientId: data.clientId,
          providerId: data.providerId,
          type: data.type,
          reason: data.reason,
          description: data.description,
          evidence: data.evidence,
          status: 'open'
        }
      })

      // Send notifications
      await this.sendDisputeNotifications(dispute.id)

      return dispute.id
    } catch (error) {
      console.error('Error creating dispute:', error)
      throw new Error('Failed to create dispute')
    }
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    adminId: string
  ): Promise<void> {
    try {
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'resolved',
          resolution,
          adminId,
          resolvedAt: new Date()
        }
      })

      // Send resolution notifications
      await this.sendDisputeResolutionNotifications(disputeId, resolution)
    } catch (error) {
      console.error('Error resolving dispute:', error)
      throw new Error('Failed to resolve dispute')
    }
  }

  /**
   * Get user disputes
   */
  async getUserDisputes(userId: string, role: 'client' | 'provider') {
    try {
      const whereClause = role === 'client' 
        ? { clientId: userId }
        : { providerId: userId }

      const disputes = await prisma.dispute.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              service: true,
              client: { include: { user: true } },
              provider: { include: { user: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return disputes
    } catch (error) {
      console.error('Error getting user disputes:', error)
      throw new Error('Failed to get user disputes')
    }
  }

  /**
   * Get fraud alerts
   */
  async getFraudAlerts(severity?: string, isResolved?: boolean) {
    try {
      const whereClause: any = {}
      
      if (severity) {
        whereClause.severity = severity
      }
      
      if (isResolved !== undefined) {
        whereClause.isResolved = isResolved
      }

      const alerts = await prisma.fraudAlert.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return alerts
    } catch (error) {
      console.error('Error getting fraud alerts:', error)
      throw new Error('Failed to get fraud alerts')
    }
  }

  /**
   * Resolve fraud alert
   */
  async resolveFraudAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      await prisma.fraudAlert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedBy,
          resolvedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error resolving fraud alert:', error)
      throw new Error('Failed to resolve fraud alert')
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(dateRange?: { start: Date; end: Date }) {
    try {
      const now = new Date()
      const startDate = dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = dateRange?.end || now

      const [
        totalAlerts,
        resolvedAlerts,
        criticalAlerts,
        disputes,
        resolvedDisputes,
        deviceFingerprints
      ] = await Promise.all([
        prisma.fraudAlert.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.fraudAlert.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            isResolved: true
          }
        }),
        prisma.fraudAlert.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            severity: 'critical'
          }
        }),
        prisma.dispute.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.dispute.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'resolved'
          }
        }),
        prisma.deviceFingerprint.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        })
      ])

      return {
        totalAlerts,
        resolvedAlerts,
        criticalAlerts,
        alertResolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
        disputes,
        resolvedDisputes,
        disputeResolutionRate: disputes > 0 ? (resolvedDisputes / disputes) * 100 : 0,
        newDevices: deviceFingerprints,
        securityScore: this.calculateSecurityScore({
          totalAlerts,
          resolvedAlerts,
          criticalAlerts,
          disputes,
          resolvedDisputes
        })
      }
    } catch (error) {
      console.error('Error generating security report:', error)
      throw new Error('Failed to generate security report')
    }
  }

  /**
   * Evaluate fraud rule
   */
  private async evaluateRule(
    rule: FraudDetectionRule,
    userId: string,
    action: string,
    data: any
  ): Promise<boolean> {
    try {
      switch (rule.id) {
        case 'rapid_bookings':
          return await this.checkRapidBookings(userId, rule.conditions)
        
        case 'fake_reviews':
          return await this.checkFakeReviews(userId, rule.conditions)
        
        case 'account_takeover':
          return await this.checkAccountTakeover(userId, data, rule.conditions)
        
        case 'payment_fraud':
          return await this.checkPaymentFraud(userId, data, rule.conditions)
        
        default:
          return false
      }
    } catch (error) {
      console.error('Error evaluating rule:', error)
      return false
    }
  }

  /**
   * Check rapid bookings
   */
  private async checkRapidBookings(userId: string, conditions: any): Promise<boolean> {
    const timeWindow = conditions.timeWindow
    const maxBookings = conditions.maxBookings
    const accountAge = conditions.accountAge

    // Check account age
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })

    if (!user) return false

    const accountAgeMs = Date.now() - user.createdAt.getTime()
    if (accountAgeMs > accountAge) return false

    // Check booking count in time window
    const startTime = new Date(Date.now() - timeWindow)
    const bookingCount = await prisma.booking.count({
      where: {
        client: { userId },
        createdAt: { gte: startTime }
      }
    })

    return bookingCount >= maxBookings
  }

  /**
   * Check fake reviews
   */
  private async checkFakeReviews(userId: string, conditions: any): Promise<boolean> {
    const maxReviewsPerDay = conditions.maxReviewsPerDay
    const identicalReviews = conditions.identicalReviews

    // Check reviews per day
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayReviews = await prisma.review.count({
      where: {
        client: { userId },
        createdAt: { gte: today, lt: tomorrow }
      }
    })

    if (todayReviews >= maxReviewsPerDay) return true

    // Check for identical reviews
    const recentReviews = await prisma.review.findMany({
      where: {
        client: { userId },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { comment: true }
    })

    const commentCounts: Record<string, number> = {}
    recentReviews.forEach(review => {
      if (review.comment) {
        commentCounts[review.comment] = (commentCounts[review.comment] || 0) + 1
      }
    })

    const maxIdentical = Math.max(...Object.values(commentCounts))
    return maxIdentical >= identicalReviews
  }

  /**
   * Check account takeover
   */
  private async checkAccountTakeover(userId: string, data: any, conditions: any): Promise<boolean> {
    const { fingerprint, ipAddress, location } = data

    // Check if device is new
    const existingDevice = await prisma.deviceFingerprint.findUnique({
      where: { fingerprint }
    })

    if (!existingDevice) return true

    // Check if device belongs to user
    if (existingDevice.userId !== userId) return true

    // Check location change
    if (conditions.locationChange && location) {
      const lastLocation = existingDevice.location
      if (lastLocation && this.calculateDistance(lastLocation, location) > 1000) {
        return true
      }
    }

    return false
  }

  /**
   * Check payment fraud
   */
  private async checkPaymentFraud(userId: string, data: any, conditions: any): Promise<boolean> {
    const { amount, paymentMethod } = data

    // Check high value transactions
    if (amount > conditions.highValue) return true

    // Check failed payments
    const failedPayments = await prisma.payment.count({
      where: {
        client: { userId },
        status: 'FAILED',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })

    if (failedPayments >= conditions.failedPayments) return true

    return false
  }

  /**
   * Handle fraud detection
   */
  private async handleFraudDetection(
    rule: FraudDetectionRule,
    userId: string,
    action: string,
    data: any
  ): Promise<void> {
    try {
      // Create fraud alert
      await prisma.fraudAlert.create({
        data: {
          userId,
          type: rule.id,
          severity: rule.severity,
          description: `${rule.name}: ${rule.description}`,
          evidence: data
        }
      })

      // Take action based on rule
      switch (rule.action) {
        case 'block':
          await this.blockUser(userId, rule.id)
          break
        case 'alert':
          await this.sendSecurityAlert(userId, rule)
          break
        case 'review':
          await this.flagForReview(userId, rule)
          break
      }
    } catch (error) {
      console.error('Error handling fraud detection:', error)
    }
  }

  /**
   * Block user
   */
  private async blockUser(userId: string, reason: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'BANNED' }
      })

      // Send notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Account Suspended',
          message: `Your account has been suspended due to: ${reason}`,
          type: 'account_suspended'
        }
      })
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(userId: string, rule: FraudDetectionRule): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Security Alert',
          message: `Suspicious activity detected: ${rule.description}`,
          type: 'security_alert'
        }
      })
    } catch (error) {
      console.error('Error sending security alert:', error)
    }
  }

  /**
   * Flag for review
   */
  private async flagForReview(userId: string, rule: FraudDetectionRule): Promise<void> {
    try {
      // This would typically send to admin queue for review
      console.log(`User ${userId} flagged for review: ${rule.name}`)
    } catch (error) {
      console.error('Error flagging for review:', error)
    }
  }

  /**
   * Send dispute notifications
   */
  private async sendDisputeNotifications(disputeId: string): Promise<void> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          client: { include: { user: true } },
          provider: { include: { user: true } }
        }
      })

      if (!dispute) return

      // Notify client
      await prisma.notification.create({
        data: {
          userId: dispute.client.userId,
          title: 'Dispute Created',
          message: 'Your dispute has been created and is under review',
          type: 'dispute_created'
        }
      })

      // Notify provider
      await prisma.notification.create({
        data: {
          userId: dispute.provider.userId,
          title: 'Dispute Filed',
          message: `A dispute has been filed against you by ${dispute.client.user.name}`,
          type: 'dispute_filed'
        }
      })
    } catch (error) {
      console.error('Error sending dispute notifications:', error)
    }
  }

  /**
   * Send dispute resolution notifications
   */
  private async sendDisputeResolutionNotifications(disputeId: string, resolution: string): Promise<void> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          client: { include: { user: true } },
          provider: { include: { user: true } }
        }
      })

      if (!dispute) return

      // Notify both parties
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: dispute.client.userId,
            title: 'Dispute Resolved',
            message: `Your dispute has been resolved: ${resolution}`,
            type: 'dispute_resolved'
          }
        }),
        prisma.notification.create({
          data: {
            userId: dispute.provider.userId,
            title: 'Dispute Resolved',
            message: `The dispute has been resolved: ${resolution}`,
            type: 'dispute_resolved'
          }
        })
      ])
    } catch (error) {
      console.error('Error sending dispute resolution notifications:', error)
    }
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(metrics: any): number {
    const { totalAlerts, resolvedAlerts, criticalAlerts, disputes, resolvedDisputes } = metrics

    let score = 100

    // Deduct points for unresolved alerts
    const unresolvedAlerts = totalAlerts - resolvedAlerts
    score -= unresolvedAlerts * 5

    // Deduct more points for critical alerts
    score -= criticalAlerts * 10

    // Deduct points for unresolved disputes
    const unresolvedDisputes = disputes - resolvedDisputes
    score -= unresolvedDisputes * 3

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(loc1: any, loc2: any): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = loc1.lat * Math.PI / 180
    const φ2 = loc2.lat * Math.PI / 180
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180
    const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }
}

export const antiScamSecurityManager = new AntiScamSecurityManager()
