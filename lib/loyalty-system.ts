import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface LoyaltyTierData {
  name: string
  description?: string
  minPoints: number
  maxPoints?: number
  benefits: string[]
  discountPercent?: number
  priorityBooking: boolean
}

export interface PointsEarningRule {
  source: string
  points: number
  description: string
  multiplier?: number
}

export class LoyaltySystemManager {
  private pointsRules: PointsEarningRule[] = [
    { source: 'booking', points: 10, description: 'Points per dollar spent on bookings' },
    { source: 'review', points: 5, description: 'Points for leaving a review' },
    { source: 'referral', points: 50, description: 'Points for successful referral' },
    { source: 'social_share', points: 2, description: 'Points for social media sharing' },
    { source: 'first_booking', points: 25, description: 'Bonus points for first booking' },
    { source: 'birthday', points: 20, description: 'Birthday bonus points' },
    { source: 'anniversary', points: 30, description: 'Anniversary bonus points' }
  ]

  /**
   * Create a new loyalty tier
   */
  async createLoyaltyTier(data: LoyaltyTierData): Promise<string> {
    try {
      const tier = await prisma.loyaltyTier.create({
        data: {
          name: data.name,
          description: data.description,
          minPoints: data.minPoints,
          maxPoints: data.maxPoints,
          benefits: data.benefits,
          discountPercent: data.discountPercent,
          priorityBooking: data.priorityBooking
        }
      })

      return tier.id
    } catch (error) {
      console.error('Error creating loyalty tier:', error)
      throw new Error('Failed to create loyalty tier')
    }
  }

  /**
   * Get user's current loyalty tier
   */
  async getUserLoyaltyTier(userId: string) {
    try {
      const userTier = await prisma.userLoyaltyTier.findFirst({
        where: { userId },
        include: {
          tier: true
        },
        orderBy: { joinedAt: 'desc' }
      })

      return userTier
    } catch (error) {
      console.error('Error getting user loyalty tier:', error)
      throw new Error('Failed to get user loyalty tier')
    }
  }

  /**
   * Get user's loyalty points
   */
  async getUserPoints(userId: string): Promise<number> {
    try {
      const userTier = await this.getUserLoyaltyTier(userId)
      return userTier?.currentPoints || 0
    } catch (error) {
      console.error('Error getting user points:', error)
      return 0
    }
  }

  /**
   * Earn points for user
   */
  async earnPoints(
    userId: string,
    source: string,
    sourceId?: string,
    amount?: number,
    description?: string
  ): Promise<void> {
    try {
      const rule = this.pointsRules.find(r => r.source === source)
      if (!rule) {
        console.warn(`No points rule found for source: ${source}`)
        return
      }

      let points = rule.points
      if (amount && rule.multiplier) {
        points = Math.floor(amount * rule.multiplier)
      }

      // Check if user has a loyalty tier, create one if not
      let userTier = await this.getUserLoyaltyTier(userId)
      if (!userTier) {
        await this.assignInitialTier(userId)
        userTier = await this.getUserLoyaltyTier(userId)
      }

      if (!userTier) {
        throw new Error('Failed to create user loyalty tier')
      }

      // Add points to user's current tier
      await prisma.userLoyaltyTier.update({
        where: { id: userTier.id },
        data: {
          currentPoints: userTier.currentPoints + points,
          totalEarned: userTier.totalEarned + points,
          lastEarnedAt: new Date()
        }
      })

      // Create transaction record
      await prisma.loyaltyTransaction.create({
        data: {
          userId,
          points,
          transactionType: 'earn',
          source,
          sourceId,
          description: description || rule.description,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      })

      // Check if user should be upgraded to a higher tier
      await this.checkTierUpgrade(userId)

      // Send notification
      await this.sendPointsEarnedNotification(userId, points, source)
    } catch (error) {
      console.error('Error earning points:', error)
      throw new Error('Failed to earn points')
    }
  }

  /**
   * Redeem points for user
   */
  async redeemPoints(
    userId: string,
    points: number,
    description: string
  ): Promise<boolean> {
    try {
      const userTier = await this.getUserLoyaltyTier(userId)
      if (!userTier || userTier.currentPoints < points) {
        return false
      }

      // Deduct points
      await prisma.userLoyaltyTier.update({
        where: { id: userTier.id },
        data: {
          currentPoints: userTier.currentPoints - points,
          totalRedeemed: userTier.totalRedeemed + points,
          lastRedeemedAt: new Date()
        }
      })

      // Create transaction record
      await prisma.loyaltyTransaction.create({
        data: {
          userId,
          points: -points,
          transactionType: 'redeem',
          source: 'manual',
          description
        }
      })

      return true
    } catch (error) {
      console.error('Error redeeming points:', error)
      return false
    }
  }

  /**
   * Get user's loyalty transaction history
   */
  async getUserTransactionHistory(userId: string, limit: number = 50) {
    try {
      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return transactions
    } catch (error) {
      console.error('Error getting transaction history:', error)
      throw new Error('Failed to get transaction history')
    }
  }

  /**
   * Get available loyalty tiers
   */
  async getLoyaltyTiers() {
    try {
      const tiers = await prisma.loyaltyTier.findMany({
        where: { isActive: true },
        orderBy: { minPoints: 'asc' }
      })

      return tiers
    } catch (error) {
      console.error('Error getting loyalty tiers:', error)
      throw new Error('Failed to get loyalty tiers')
    }
  }

  /**
   * Assign initial tier to new user
   */
  private async assignInitialTier(userId: string): Promise<void> {
    try {
      // Get the lowest tier (bronze)
      const bronzeTier = await prisma.loyaltyTier.findFirst({
        where: { isActive: true },
        orderBy: { minPoints: 'asc' }
      })

      if (!bronzeTier) {
        // Create default tiers if none exist
        await this.createDefaultTiers()
        const newBronzeTier = await prisma.loyaltyTier.findFirst({
          where: { isActive: true },
          orderBy: { minPoints: 'asc' }
        })
        
        if (!newBronzeTier) {
          throw new Error('Failed to create default tiers')
        }

        await prisma.userLoyaltyTier.create({
          data: {
            userId,
            tierId: newBronzeTier.id,
            currentPoints: 0,
            totalEarned: 0,
            totalRedeemed: 0
          }
        })
      } else {
        await prisma.userLoyaltyTier.create({
          data: {
            userId,
            tierId: bronzeTier.id,
            currentPoints: 0,
            totalEarned: 0,
            totalRedeemed: 0
          }
        })
      }
    } catch (error) {
      console.error('Error assigning initial tier:', error)
      throw new Error('Failed to assign initial tier')
    }
  }

  /**
   * Check if user should be upgraded to a higher tier
   */
  private async checkTierUpgrade(userId: string): Promise<void> {
    try {
      const userTier = await this.getUserLoyaltyTier(userId)
      if (!userTier) return

      const currentPoints = userTier.currentPoints
      const currentTier = userTier.tier

      // Find next tier
      const nextTier = await prisma.loyaltyTier.findFirst({
        where: {
          isActive: true,
          minPoints: { gt: currentTier.minPoints }
        },
        orderBy: { minPoints: 'asc' }
      })

      if (nextTier && currentPoints >= nextTier.minPoints) {
        // Upgrade user to next tier
        await prisma.userLoyaltyTier.update({
          where: { id: userTier.id },
          data: { tierId: nextTier.id }
        })

        // Send upgrade notification
        await this.sendTierUpgradeNotification(userId, nextTier.name)
      }
    } catch (error) {
      console.error('Error checking tier upgrade:', error)
    }
  }

  /**
   * Create default loyalty tiers
   */
  private async createDefaultTiers(): Promise<void> {
    const defaultTiers = [
      {
        name: 'Bronze',
        description: 'Welcome to Beauty Crafter!',
        minPoints: 0,
        maxPoints: 499,
        benefits: ['Welcome bonus', 'Basic support'],
        discountPercent: 0,
        priorityBooking: false
      },
      {
        name: 'Silver',
        description: 'You\'re getting the hang of it!',
        minPoints: 500,
        maxPoints: 1499,
        benefits: ['5% discount on bookings', 'Priority support', 'Exclusive offers'],
        discountPercent: 5,
        priorityBooking: false
      },
      {
        name: 'Gold',
        description: 'You\'re a beauty enthusiast!',
        minPoints: 1500,
        maxPoints: 4999,
        benefits: ['10% discount on bookings', 'Priority booking', 'VIP support', 'Free consultations'],
        discountPercent: 10,
        priorityBooking: true
      },
      {
        name: 'Platinum',
        description: 'You\'re a beauty expert!',
        minPoints: 5000,
        maxPoints: null,
        benefits: ['15% discount on bookings', 'Priority booking', 'VIP support', 'Free consultations', 'Exclusive events'],
        discountPercent: 15,
        priorityBooking: true
      }
    ]

    for (const tierData of defaultTiers) {
      await prisma.loyaltyTier.create({
        data: tierData
      })
    }
  }

  /**
   * Send points earned notification
   */
  private async sendPointsEarnedNotification(
    userId: string,
    points: number,
    source: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Points Earned!',
          message: `You earned ${points} points for ${source}. Keep it up!`,
          type: 'points_earned',
          data: { points, source }
        }
      })
    } catch (error) {
      console.error('Error sending points notification:', error)
    }
  }

  /**
   * Send tier upgrade notification
   */
  private async sendTierUpgradeNotification(
    userId: string,
    tierName: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Tier Upgraded!',
          message: `Congratulations! You've been upgraded to ${tierName} tier!`,
          type: 'tier_upgrade',
          data: { tierName }
        }
      })
    } catch (error) {
      console.error('Error sending tier upgrade notification:', error)
    }
  }

  /**
   * Get loyalty system analytics
   */
  async getLoyaltyAnalytics() {
    try {
      const totalUsers = await prisma.userLoyaltyTier.count()
      const totalPointsEarned = await prisma.loyaltyTransaction.aggregate({
        where: { transactionType: 'earn' },
        _sum: { points: true }
      })
      const totalPointsRedeemed = await prisma.loyaltyTransaction.aggregate({
        where: { transactionType: 'redeem' },
        _sum: { points: true }
      })

      const tierDistribution = await prisma.userLoyaltyTier.groupBy({
        by: ['tierId'],
        _count: { tierId: true },
        include: {
          tier: {
            select: { name: true }
          }
        }
      })

      return {
        totalUsers,
        totalPointsEarned: totalPointsEarned._sum.points || 0,
        totalPointsRedeemed: totalPointsRedeemed._sum.points || 0,
        tierDistribution
      }
    } catch (error) {
      console.error('Error getting loyalty analytics:', error)
      throw new Error('Failed to get loyalty analytics')
    }
  }
}

export const loyaltySystemManager = new LoyaltySystemManager()
