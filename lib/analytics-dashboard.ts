import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AnalyticsMetrics {
  totalRevenue: number
  totalBookings: number
  totalUsers: number
  averageBookingValue: number
  conversionRate: number
  retentionRate: number
  churnRate: number
}

export interface ProviderAnalytics {
  totalEarnings: number
  totalBookings: number
  averageRating: number
  totalReviews: number
  clientDemographics: {
    ageGroups: Record<string, number>
    genderDistribution: Record<string, number>
    locationDistribution: Record<string, number>
  }
  peakHours: Record<string, number>
  servicePopularity: Array<{
    serviceName: string
    bookingCount: number
    revenue: number
  }>
  monthlyTrends: Array<{
    month: string
    bookings: number
    revenue: number
  }>
}

export interface AdminAnalytics {
  platformMetrics: AnalyticsMetrics
  providerMetrics: {
    totalProviders: number
    activeProviders: number
    newProvidersThisMonth: number
    averageProviderRating: number
  }
  clientMetrics: {
    totalClients: number
    activeClients: number
    newClientsThisMonth: number
    averageClientValue: number
  }
  complianceMetrics: {
    totalAlerts: number
    resolvedAlerts: number
    pendingAlerts: number
    criticalAlerts: number
  }
  revenueBreakdown: {
    bookingRevenue: number
    subscriptionRevenue: number
    commissionRevenue: number
    totalRevenue: number
  }
  regionalMetrics: Array<{
    region: string
    bookings: number
    revenue: number
    providers: number
    clients: number
  }>
}

export class AnalyticsDashboardManager {
  /**
   * Get provider analytics
   */
  async getProviderAnalytics(providerId: string, dateRange?: { start: Date; end: Date }): Promise<ProviderAnalytics> {
    try {
      const now = new Date()
      const startDate = dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = dateRange?.end || now

      // Get basic metrics
      const [totalEarnings, totalBookings, reviews] = await Promise.all([
        this.getProviderEarnings(providerId, startDate, endDate),
        this.getProviderBookings(providerId, startDate, endDate),
        this.getProviderReviews(providerId)
      ])

      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0

      // Get client demographics
      const clientDemographics = await this.getClientDemographics(providerId, startDate, endDate)

      // Get peak hours
      const peakHours = await this.getPeakHours(providerId, startDate, endDate)

      // Get service popularity
      const servicePopularity = await this.getServicePopularity(providerId, startDate, endDate)

      // Get monthly trends
      const monthlyTrends = await this.getMonthlyTrends(providerId, startDate, endDate)

      return {
        totalEarnings,
        totalBookings,
        averageRating,
        totalReviews: reviews.length,
        clientDemographics,
        peakHours,
        servicePopularity,
        monthlyTrends
      }
    } catch (error) {
      console.error('Error getting provider analytics:', error)
      throw new Error('Failed to get provider analytics')
    }
  }

  /**
   * Get admin analytics
   */
  async getAdminAnalytics(dateRange?: { start: Date; end: Date }): Promise<AdminAnalytics> {
    try {
      const now = new Date()
      const startDate = dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = dateRange?.end || now

      // Get platform metrics
      const platformMetrics = await this.getPlatformMetrics(startDate, endDate)

      // Get provider metrics
      const providerMetrics = await this.getProviderMetrics(startDate, endDate)

      // Get client metrics
      const clientMetrics = await this.getClientMetrics(startDate, endDate)

      // Get compliance metrics
      const complianceMetrics = await this.getComplianceMetrics()

      // Get revenue breakdown
      const revenueBreakdown = await this.getRevenueBreakdown(startDate, endDate)

      // Get regional metrics
      const regionalMetrics = await this.getRegionalMetrics(startDate, endDate)

      return {
        platformMetrics,
        providerMetrics,
        clientMetrics,
        complianceMetrics,
        revenueBreakdown,
        regionalMetrics
      }
    } catch (error) {
      console.error('Error getting admin analytics:', error)
      throw new Error('Failed to get admin analytics')
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    activeUsers: number
    bookingsToday: number
    revenueToday: number
    onlineProviders: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [activeUsers, bookingsToday, revenueToday, onlineProviders] = await Promise.all([
        this.getActiveUsersCount(),
        this.getBookingsCount(today, tomorrow),
        this.getRevenueForPeriod(today, tomorrow),
        this.getOnlineProvidersCount()
      ])

      return {
        activeUsers,
        bookingsToday,
        revenueToday,
        onlineProviders
      }
    } catch (error) {
      console.error('Error getting real-time metrics:', error)
      throw new Error('Failed to get real-time metrics')
    }
  }

  /**
   * Get provider earnings
   */
  private async getProviderEarnings(providerId: string, startDate: Date, endDate: Date): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: {
        providerId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { providerAmount: true }
    })

    return payments.reduce((sum, payment) => sum + Number(payment.providerAmount), 0)
  }

  /**
   * Get provider bookings
   */
  private async getProviderBookings(providerId: string, startDate: Date, endDate: Date): Promise<number> {
    return await prisma.booking.count({
      where: {
        providerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  }

  /**
   * Get provider reviews
   */
  private async getProviderReviews(providerId: string) {
    return await prisma.review.findMany({
      where: { providerId },
      select: { rating: true }
    })
  }

  /**
   * Get client demographics
   */
  private async getClientDemographics(providerId: string, startDate: Date, endDate: Date) {
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        client: {
          include: { user: true }
        }
      }
    })

    const ageGroups: Record<string, number> = {}
    const genderDistribution: Record<string, number> = {}
    const locationDistribution: Record<string, number> = {}

    bookings.forEach(booking => {
      const user = booking.client.user
      
      // Age groups (simplified)
      if (user.dateOfBirth) {
        const age = new Date().getFullYear() - user.dateOfBirth.getFullYear()
        const ageGroup = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : '45+'
        ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1
      }

      // Gender distribution
      if (user.gender) {
        genderDistribution[user.gender] = (genderDistribution[user.gender] || 0) + 1
      }

      // Location distribution (simplified)
      const location = 'Unknown' // Would need to implement location tracking
      locationDistribution[location] = (locationDistribution[location] || 0) + 1
    })

    return {
      ageGroups,
      genderDistribution,
      locationDistribution
    }
  }

  /**
   * Get peak hours
   */
  private async getPeakHours(providerId: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { startTime: true }
    })

    const hourCounts: Record<string, number> = {}
    
    bookings.forEach(booking => {
      const hour = booking.startTime.split(':')[0]
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return hourCounts
  }

  /**
   * Get service popularity
   */
  private async getServicePopularity(providerId: string, startDate: Date, endDate: Date) {
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        service: true
      }
    })

    const serviceStats: Record<string, { bookingCount: number; revenue: number }> = {}

    bookings.forEach(booking => {
      const serviceName = booking.service.name
      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = { bookingCount: 0, revenue: 0 }
      }
      serviceStats[serviceName].bookingCount++
      serviceStats[serviceName].revenue += Number(booking.totalAmount)
    })

    return Object.entries(serviceStats).map(([serviceName, stats]) => ({
      serviceName,
      bookingCount: stats.bookingCount,
      revenue: stats.revenue
    })).sort((a, b) => b.bookingCount - a.bookingCount)
  }

  /**
   * Get monthly trends
   */
  private async getMonthlyTrends(providerId: string, startDate: Date, endDate: Date) {
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    })

    const monthlyData: Record<string, { bookings: number; revenue: number }> = {}

    bookings.forEach(booking => {
      const month = booking.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { bookings: 0, revenue: 0 }
      }
      monthlyData[month].bookings++
      monthlyData[month].revenue += Number(booking.totalAmount)
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      bookings: data.bookings,
      revenue: data.revenue
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * Get platform metrics
   */
  private async getPlatformMetrics(startDate: Date, endDate: Date): Promise<AnalyticsMetrics> {
    const [totalRevenue, totalBookings, totalUsers] = await Promise.all([
      this.getRevenueForPeriod(startDate, endDate),
      this.getBookingsCount(startDate, endDate),
      this.getTotalUsersCount()
    ])

    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
    const conversionRate = await this.getConversionRate(startDate, endDate)
    const retentionRate = await this.getRetentionRate(startDate, endDate)
    const churnRate = 1 - retentionRate

    return {
      totalRevenue,
      totalBookings,
      totalUsers,
      averageBookingValue,
      conversionRate,
      retentionRate,
      churnRate
    }
  }

  /**
   * Get provider metrics
   */
  private async getProviderMetrics(startDate: Date, endDate: Date) {
    const [totalProviders, activeProviders, newProvidersThisMonth] = await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { isAvailable: true } }),
      prisma.provider.count({
        where: {
          createdAt: { gte: startDate }
        }
      })
    ])

    const averageProviderRating = await prisma.provider.aggregate({
      _avg: { rating: true }
    })

    return {
      totalProviders,
      activeProviders,
      newProvidersThisMonth,
      averageProviderRating: Number(averageProviderRating._avg.rating) || 0
    }
  }

  /**
   * Get client metrics
   */
  private async getClientMetrics(startDate: Date, endDate: Date) {
    const [totalClients, activeClients, newClientsThisMonth] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({
        where: {
          bookings: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      prisma.client.count({
        where: {
          createdAt: { gte: startDate }
        }
      })
    ])

    const averageClientValue = await this.getAverageClientValue(startDate, endDate)

    return {
      totalClients,
      activeClients,
      newClientsThisMonth,
      averageClientValue
    }
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics() {
    const [totalAlerts, resolvedAlerts, pendingAlerts, criticalAlerts] = await Promise.all([
      prisma.complianceAlert.count(),
      prisma.complianceAlert.count({ where: { isResolved: true } }),
      prisma.complianceAlert.count({ where: { isResolved: false } }),
      prisma.complianceAlert.count({ where: { severity: 'critical' } })
    ])

    return {
      totalAlerts,
      resolvedAlerts,
      pendingAlerts,
      criticalAlerts
    }
  }

  /**
   * Get revenue breakdown
   */
  private async getRevenueBreakdown(startDate: Date, endDate: Date) {
    const [bookingRevenue, subscriptionRevenue] = await Promise.all([
      this.getRevenueForPeriod(startDate, endDate),
      this.getSubscriptionRevenue(startDate, endDate)
    ])

    const commissionRevenue = bookingRevenue * 0.1 // Assuming 10% commission
    const totalRevenue = bookingRevenue + subscriptionRevenue + commissionRevenue

    return {
      bookingRevenue,
      subscriptionRevenue,
      commissionRevenue,
      totalRevenue
    }
  }

  /**
   * Get regional metrics
   */
  private async getRegionalMetrics(startDate: Date, endDate: Date) {
    // This would need to be implemented based on your location tracking
    // For now, returning mock data
    return [
      {
        region: 'North America',
        bookings: 150,
        revenue: 15000,
        providers: 25,
        clients: 200
      },
      {
        region: 'Europe',
        bookings: 100,
        revenue: 10000,
        providers: 15,
        clients: 150
      }
    ]
  }

  /**
   * Helper methods
   */
  private async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { amount: true }
    })

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  }

  private async getBookingsCount(startDate: Date, endDate: Date): Promise<number> {
    return await prisma.booking.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  }

  private async getTotalUsersCount(): Promise<number> {
    return await prisma.user.count()
  }

  private async getActiveUsersCount(): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return await prisma.user.count({
      where: {
        OR: [
          { bookings: { some: { createdAt: { gte: last24Hours } } } },
          { sessions: { some: { expires: { gte: new Date() } } } }
        ]
      }
    })
  }

  private async getOnlineProvidersCount(): Promise<number> {
    return await prisma.provider.count({
      where: { isAvailable: true }
    })
  }

  private async getConversionRate(startDate: Date, endDate: Date): Promise<number> {
    // This would need to be implemented based on your conversion tracking
    return 0.15 // Mock 15% conversion rate
  }

  private async getRetentionRate(startDate: Date, endDate: Date): Promise<number> {
    // This would need to be implemented based on your retention tracking
    return 0.75 // Mock 75% retention rate
  }

  private async getAverageClientValue(startDate: Date, endDate: Date): Promise<number> {
    const totalRevenue = await this.getRevenueForPeriod(startDate, endDate)
    const activeClients = await prisma.client.count({
      where: {
        bookings: {
          some: {
            createdAt: { gte: startDate }
          }
        }
      }
    })

    return activeClients > 0 ? totalRevenue / activeClients : 0
  }

  private async getSubscriptionRevenue(startDate: Date, endDate: Date): Promise<number> {
    // This would need to be implemented based on your subscription tracking
    return 5000 // Mock subscription revenue
  }
}

export const analyticsDashboardManager = new AnalyticsDashboardManager()
