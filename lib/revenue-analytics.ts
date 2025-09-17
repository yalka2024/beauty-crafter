import { prisma } from './prisma'
import { logger } from './logging'
import { monitoring } from './monitoring'
import { cache } from './cache'

// Revenue Stream Types
export const REVENUE_STREAMS = {
  SUBSCRIPTIONS: 'subscriptions',
  AI_SERVICES: 'ai_services',
  COMMISSIONS: 'commissions',
  BOOKING_FEES: 'booking_fees',
  FEATURED_LISTINGS: 'featured_listings',
  ADVERTISING: 'advertising',
  AFFILIATE_SALES: 'affiliate_sales',
  WHITE_LABEL: 'white_label',
  API_ACCESS: 'api_access',
  GIFT_CARDS: 'gift_cards'
} as const

interface RevenueMetrics {
  totalRevenue: number
  monthlyRecurringRevenue: number
  annualRecurringRevenue: number
  averageOrderValue: number
  customerLifetimeValue: number
  churnRate: number
  conversionRate: number
  revenuePerUser: number
}

interface RevenueBreakdown {
  byStream: Record<string, number>
  byTime: Record<string, number>
  byTier: Record<string, number>
  byRegion: Record<string, number>
  byProvider: Record<string, number>
}

export class RevenueAnalyticsManager {
  private static instance: RevenueAnalyticsManager

  private constructor() {}

  public static getInstance(): RevenueAnalyticsManager {
    if (!RevenueAnalyticsManager.instance) {
      RevenueAnalyticsManager.instance = new RevenueAnalyticsManager()
    }
    return RevenueAnalyticsManager.instance
  }

  // Get comprehensive revenue overview
  async getRevenueOverview(timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    metrics: RevenueMetrics
    breakdown: RevenueBreakdown
    trends: any
    projections: any
  }> {
    try {
      const cacheKey = `revenue_overview:${timeframe}`
      const cached = await cache.get(cacheKey)
      
      if (cached) {
        return cached as any
      }

      const [metrics, breakdown, trends, projections] = await Promise.all([
        this.calculateRevenueMetrics(timeframe),
        this.calculateRevenueBreakdown(timeframe),
        this.calculateRevenueTrends(timeframe),
        this.calculateRevenueProjections(timeframe)
      ])

      const result = { metrics, breakdown, trends, projections }
      
      // Cache for 15 minutes
      await cache.set(cacheKey, result, 900)
      
      return result
    } catch (error) {
      logger.error('Failed to get revenue overview', { error: String(error) })
      monitoring.recordError(error as Error, 'revenue_overview_calculation')
      throw error
    }
  }

  // Calculate key revenue metrics
  private async calculateRevenueMetrics(timeframe: string): Promise<RevenueMetrics> {
    try {
      const startDate = this.getStartDate(timeframe)
      
      // Get subscription revenue
      const subscriptionRevenue = await this.getSubscriptionRevenue(startDate)
      
      // Get AI service revenue
      const aiServiceRevenue = await this.getAIServiceRevenue(startDate)
      
      // Get commission revenue
      const commissionRevenue = await this.getCommissionRevenue(startDate)
      
      // Get other revenue streams
      const otherRevenue = await this.getOtherRevenue(startDate)
      
      const totalRevenue = subscriptionRevenue + aiServiceRevenue + commissionRevenue + otherRevenue
      
      // Calculate MRR and ARR
      const monthlyRecurringRevenue = await this.calculateMRR()
      const annualRecurringRevenue = monthlyRecurringRevenue * 12
      
      // Calculate other metrics
      const averageOrderValue = await this.calculateAverageOrderValue(startDate)
      const customerLifetimeValue = await this.calculateCustomerLifetimeValue()
      const churnRate = await this.calculateChurnRate(timeframe)
      const conversionRate = await this.calculateConversionRate(timeframe)
      const revenuePerUser = await this.calculateRevenuePerUser(startDate)
      
      return {
        totalRevenue,
        monthlyRecurringRevenue,
        annualRecurringRevenue,
        averageOrderValue,
        customerLifetimeValue,
        churnRate,
        conversionRate,
        revenuePerUser
      }
    } catch (error) {
      logger.error('Failed to calculate revenue metrics', { error: String(error) })
      throw error
    }
  }

  // Calculate revenue breakdown by various dimensions
  private async calculateRevenueBreakdown(timeframe: string): Promise<RevenueBreakdown> {
    try {
      const startDate = this.getStartDate(timeframe)
      
      const [byStream, byTime, byTier, byRegion, byProvider] = await Promise.all([
        this.getRevenueByStream(startDate),
        this.getRevenueByTime(startDate),
        this.getRevenueByTier(startDate),
        this.getRevenueByRegion(startDate),
        this.getRevenueByProvider(startDate)
      ])
      
      return {
        byStream,
        byTime,
        byTier,
        byRegion,
        byProvider
      }
    } catch (error) {
      logger.error('Failed to calculate revenue breakdown', { error: String(error) })
      throw error
    }
  }

  // Calculate revenue trends
  private async calculateRevenueTrends(timeframe: string): Promise<any> {
    try {
      const periods = this.getTrendPeriods(timeframe)
      const trends = []
      
      for (const period of periods) {
        const revenue = await this.getTotalRevenueForPeriod(period.start, period.end)
        trends.push({
          period: period.label,
          revenue,
          growth: trends.length > 0 ? ((revenue - trends[trends.length - 1].revenue) / trends[trends.length - 1].revenue) * 100 : 0
        })
      }
      
      return trends
    } catch (error) {
      logger.error('Failed to calculate revenue trends', { error: String(error) })
      throw error
    }
  }

  // Calculate revenue projections
  private async calculateRevenueProjections(timeframe: string): Promise<any> {
    try {
      const historicalData = await this.getHistoricalRevenueData(timeframe)
      const projections = this.forecastRevenue(historicalData, 6) // 6 periods ahead
      
      return {
        nextPeriod: projections[0],
        nextQuarter: projections.slice(0, 3).reduce((sum, p) => sum + p.revenue, 0),
        nextYear: projections.reduce((sum, p) => sum + p.revenue, 0),
        confidence: this.calculateProjectionConfidence(historicalData)
      }
    } catch (error) {
      logger.error('Failed to calculate revenue projections', { error: String(error) })
      throw error
    }
  }

  // Get subscription revenue
  private async getSubscriptionRevenue(startDate: Date): Promise<number> {
    try {
      const result = await prisma.subscription.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'ACTIVE'
        },
        _sum: {
          // This would need to be calculated based on subscription tiers
          // For now, we'll use a placeholder
        }
      })
      
      // In production, you would calculate actual subscription revenue
      // based on tier pricing and payment history
      return 0 // Placeholder
    } catch (error) {
      logger.error('Failed to get subscription revenue', { error: String(error) })
      return 0
    }
  }

  // Get AI service revenue
  private async getAIServiceRevenue(startDate: Date): Promise<number> {
    try {
      const result = await prisma.aiRequest.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
          cost: { gt: 0 }
        },
        _sum: { cost: true }
      })
      
      return result._sum.cost || 0
    } catch (error) {
      logger.error('Failed to get AI service revenue', { error: String(error) })
      return 0
    }
  }

  // Get commission revenue
  private async getCommissionRevenue(startDate: Date): Promise<number> {
    try {
      const result = await prisma.payment.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        _sum: { commission: true }
      })
      
      return result._sum.commission || 0
    } catch (error) {
      logger.error('Failed to get commission revenue', { error: String(error) })
      return 0
    }
  }

  // Get other revenue streams
  private async getOtherRevenue(startDate: Date): Promise<number> {
    // This would include advertising, featured listings, etc.
    // For now, return 0
    return 0
  }

  // Calculate Monthly Recurring Revenue (MRR)
  private async calculateMRR(): Promise<number> {
    try {
      // Get all active subscriptions and calculate monthly value
      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' }
      })
      
      let mrr = 0
      for (const sub of activeSubscriptions) {
        // Calculate monthly value based on tier
        const monthlyValue = this.getMonthlyValueForTier(sub.tierId, sub.type)
        mrr += monthlyValue
      }
      
      return mrr
    } catch (error) {
      logger.error('Failed to calculate MRR', { error: String(error) })
      return 0
    }
  }

  // Calculate Average Order Value
  private async calculateAverageOrderValue(startDate: Date): Promise<number> {
    try {
      const result = await prisma.payment.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        _avg: { amount: true },
        _count: { id: true }
      })
      
      return result._avg.amount || 0
    } catch (error) {
      logger.error('Failed to calculate average order value', { error: String(error) })
      return 0
    }
  }

  // Calculate Customer Lifetime Value
  private async calculateCustomerLifetimeValue(): Promise<number> {
    try {
      // This is a simplified calculation
      // In production, you'd use more sophisticated methods
      const avgOrderValue = await this.calculateAverageOrderValue(new Date(0))
      const avgCustomerOrders = 3 // Placeholder
      const avgCustomerLifespan = 12 // months
      
      return avgOrderValue * avgCustomerOrders * (avgCustomerLifespan / 12)
    } catch (error) {
      logger.error('Failed to calculate customer lifetime value', { error: String(error) })
      return 0
    }
  }

  // Calculate Churn Rate
  private async calculateChurnRate(timeframe: string): Promise<number> {
    try {
      const startDate = this.getStartDate(timeframe)
      
      const [startSubscriptions, endSubscriptions] = await Promise.all([
        prisma.subscription.count({
          where: { createdAt: { lt: startDate }, status: 'ACTIVE' }
        }),
        prisma.subscription.count({
          where: { createdAt: { lt: new Date() }, status: 'ACTIVE' }
        })
      ])
      
      if (startSubscriptions === 0) return 0
      
      return ((startSubscriptions - endSubscriptions) / startSubscriptions) * 100
    } catch (error) {
      logger.error('Failed to calculate churn rate', { error: String(error) })
      return 0
    }
  }

  // Calculate Conversion Rate
  private async calculateConversionRate(timeframe: string): Promise<number> {
    try {
      const startDate = this.getStartDate(timeframe)
      
      const [totalVisitors, conversions] = await Promise.all([
        // This would come from analytics data
        Promise.resolve(1000), // Placeholder
        prisma.subscription.count({
          where: { createdAt: { gte: startDate } }
        })
      ])
      
      return (conversions / totalVisitors) * 100
    } catch (error) {
      logger.error('Failed to calculate conversion rate', { error: String(error) })
      return 0
    }
  }

  // Calculate Revenue Per User
  private async calculateRevenuePerUser(startDate: Date): Promise<number> {
    try {
      const totalRevenue = await this.getTotalRevenueForPeriod(startDate, new Date())
      const totalUsers = await prisma.user.count()
      
      return totalUsers > 0 ? totalRevenue / totalUsers : 0
    } catch (error) {
      logger.error('Failed to calculate revenue per user', { error: String(error) })
      return 0
    }
  }

  // Get revenue by stream
  private async getRevenueByStream(startDate: Date): Promise<Record<string, number>> {
    try {
      const [subscriptions, aiServices, commissions, other] = await Promise.all([
        this.getSubscriptionRevenue(startDate),
        this.getAIServiceRevenue(startDate),
        this.getCommissionRevenue(startDate),
        this.getOtherRevenue(startDate)
      ])
      
      return {
        [REVENUE_STREAMS.SUBSCRIPTIONS]: subscriptions,
        [REVENUE_STREAMS.AI_SERVICES]: aiServices,
        [REVENUE_STREAMS.COMMISSIONS]: commissions,
        [REVENUE_STREAMS.OTHER]: other
      }
    } catch (error) {
      logger.error('Failed to get revenue by stream', { error: String(error) })
      return {}
    }
  }

  // Get revenue by time period
  private async getRevenueByTime(startDate: Date): Promise<Record<string, number>> {
    try {
      const periods = this.getTimePeriods(startDate)
      const revenueByTime: Record<string, number> = {}
      
      for (const period of periods) {
        const revenue = await this.getTotalRevenueForPeriod(period.start, period.end)
        revenueByTime[period.label] = revenue
      }
      
      return revenueByTime
    } catch (error) {
      logger.error('Failed to get revenue by time', { error: String(error) })
      return {}
    }
  }

  // Get revenue by subscription tier
  private async getRevenueByTier(startDate: Date): Promise<Record<string, number>> {
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { createdAt: { gte: startDate } }
      })
      
      const revenueByTier: Record<string, number> = {}
      
      for (const sub of subscriptions) {
        const monthlyValue = this.getMonthlyValueForTier(sub.tierId, sub.type)
        revenueByTier[sub.tierId] = (revenueByTier[sub.tierId] || 0) + monthlyValue
      }
      
      return revenueByTier
    } catch (error) {
      logger.error('Failed to get revenue by tier', { error: String(error) })
      return {}
    }
  }

  // Get revenue by region
  private async getRevenueByRegion(startDate: Date): Promise<Record<string, number>> {
    try {
      // This would require geolocation data
      // For now, return placeholder data
      return {
        'North America': 0,
        'Europe': 0,
        'Asia': 0,
        'Other': 0
      }
    } catch (error) {
      logger.error('Failed to get revenue by region', { error: String(error) })
      return {}
    }
  }

  // Get revenue by provider
  private async getRevenueByProvider(startDate: Date): Promise<Record<string, number>> {
    try {
      const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: startDate } },
        include: { provider: true }
      })
      
      const revenueByProvider: Record<string, number> = {}
      
      for (const payment of payments) {
        const providerName = payment.provider.businessName || `Provider ${payment.providerId}`
        revenueByProvider[providerName] = (revenueByProvider[providerName] || 0) + Number(payment.amount)
      }
      
      return revenueByProvider
    } catch (error) {
      logger.error('Failed to get revenue by provider', { error: String(error) })
      return {}
    }
  }

  // Helper methods
  private getStartDate(timeframe: string): Date {
    const now = new Date()
    switch (timeframe) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        return new Date(now.getFullYear(), now.getMonth(), diff)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }

  private getTimePeriods(startDate: Date): Array<{ start: Date; end: Date; label: string }> {
    const periods = []
    let current = new Date(startDate)
    const now = new Date()
    
    while (current < now) {
      const end = new Date(current)
      end.setMonth(end.getMonth() + 1)
      
      periods.push({
        start: new Date(current),
        end: end > now ? now : end,
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
      
      current = end
    }
    
    return periods
  }

  private getTrendPeriods(timeframe: string): Array<{ start: Date; end: Date; label: string }> {
    const periods = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now)
      const start = new Date(now)
      
      switch (timeframe) {
        case 'month':
          end.setMonth(end.getMonth() - i)
          start.setMonth(start.getMonth() - i - 1)
          break
        case 'quarter':
          end.setMonth(end.getMonth() - (i * 3))
          start.setMonth(start.getMonth() - ((i + 1) * 3))
          break
        case 'year':
          end.setFullYear(end.getFullYear() - i)
          start.setFullYear(start.getFullYear() - i - 1)
          break
        default:
          end.setMonth(end.getMonth() - i)
          start.setMonth(start.getMonth() - i - 1)
      }
      
      periods.push({
        start,
        end,
        label: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
    }
    
    return periods
  }

  private async getTotalRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    try {
      const [subscriptions, aiServices, commissions, other] = await Promise.all([
        this.getSubscriptionRevenue(startDate),
        this.getAIServiceRevenue(startDate),
        this.getCommissionRevenue(startDate),
        this.getOtherRevenue(startDate)
      ])
      
      return subscriptions + aiServices + commissions + other
    } catch (error) {
      logger.error('Failed to get total revenue for period', { error: String(error) })
      return 0
    }
  }

  private async getHistoricalRevenueData(timeframe: string): Promise<number[]> {
    try {
      const periods = this.getTrendPeriods(timeframe)
      const data = []
      
      for (const period of periods) {
        const revenue = await this.getTotalRevenueForPeriod(period.start, period.end)
        data.push(revenue)
      }
      
      return data
    } catch (error) {
      logger.error('Failed to get historical revenue data', { error: String(error) })
      return []
    }
  }

  private forecastRevenue(historicalData: number[], periods: number): Array<{ period: string; revenue: number }> {
    try {
      // Simple linear regression for forecasting
      const n = historicalData.length
      if (n < 2) return []
      
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
      
      for (let i = 0; i < n; i++) {
        sumX += i
        sumY += historicalData[i]
        sumXY += i * historicalData[i]
        sumX2 += i * i
      }
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n
      
      const forecasts = []
      for (let i = 1; i <= periods; i++) {
        const revenue = slope * (n + i - 1) + intercept
        forecasts.push({
          period: `Period ${i}`,
          revenue: Math.max(0, revenue) // Ensure non-negative
        })
      }
      
      return forecasts
    } catch (error) {
      logger.error('Failed to forecast revenue', { error: String(error) })
      return []
    }
  }

  private calculateProjectionConfidence(historicalData: number[]): number {
    try {
      if (historicalData.length < 2) return 0
      
      // Calculate coefficient of variation as a confidence measure
      const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length
      const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length
      const stdDev = Math.sqrt(variance)
      const cv = stdDev / mean
      
      // Convert to confidence percentage (lower CV = higher confidence)
      return Math.max(0, Math.min(100, (1 - cv) * 100))
    } catch (error) {
      logger.error('Failed to calculate projection confidence', { error: String(error) })
      return 0
    }
  }

  private getMonthlyValueForTier(tierId: string, type: string): number {
    // This would come from your subscription tier configuration
    // For now, return placeholder values
    const tierPricing: Record<string, number> = {
      'basic': 0,
      'premium': 9.99,
      'vip': 19.99,
      'enterprise': 49.99,
      'starter': 29,
      'professional': 79,
      'premium_provider': 149,
      'enterprise_provider': 299
    }
    
    return tierPricing[tierId] || 0
  }

  // Get revenue insights and recommendations
  async getRevenueInsights(): Promise<{
    topPerformingStreams: string[]
    growthOpportunities: string[]
    riskFactors: string[]
    recommendations: string[]
  }> {
    try {
      const overview = await this.getRevenueOverview('month')
      
      // Analyze top performing streams
      const topPerformingStreams = Object.entries(overview.breakdown.byStream)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([stream]) => stream)
      
      // Identify growth opportunities
      const growthOpportunities = this.identifyGrowthOpportunities(overview)
      
      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(overview)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(overview, growthOpportunities, riskFactors)
      
      return {
        topPerformingStreams,
        growthOpportunities,
        riskFactors,
        recommendations
      }
    } catch (error) {
      logger.error('Failed to get revenue insights', { error: String(error) })
      throw error
    }
  }

  private identifyGrowthOpportunities(overview: any): string[] {
    const opportunities = []
    
    // Analyze subscription growth
    if (overview.metrics.monthlyRecurringRevenue < 10000) {
      opportunities.push('Focus on subscription growth - current MRR is below target')
    }
    
    // Analyze AI services
    if (overview.breakdown.byStream.ai_services < overview.metrics.totalRevenue * 0.1) {
      opportunities.push('Expand AI services - currently under 10% of total revenue')
    }
    
    // Analyze churn rate
    if (overview.metrics.churnRate > 5) {
      opportunities.push('Reduce churn rate - currently above 5% threshold')
    }
    
    return opportunities
  }

  private identifyRiskFactors(overview: any): string[] {
    const risks = []
    
    // Check revenue concentration
    const topStream = Object.entries(overview.breakdown.byStream)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (topStream && topStream[1] > overview.metrics.totalRevenue * 0.7) {
      risks.push(`High revenue concentration in ${topStream[0]} - diversify revenue streams`)
    }
    
    // Check churn rate
    if (overview.metrics.churnRate > 10) {
      risks.push('High churn rate indicates customer satisfaction issues')
    }
    
    // Check growth trends
    if (overview.trends.length > 1) {
      const recentGrowth = overview.trends[overview.trends.length - 1].growth
      if (recentGrowth < -10) {
        risks.push('Declining revenue growth - investigate causes')
      }
    }
    
    return risks
  }

  private generateRecommendations(overview: any, opportunities: string[], risks: string[]): string[] {
    const recommendations = []
    
    // Address opportunities
    opportunities.forEach(opportunity => {
      if (opportunity.includes('subscription growth')) {
        recommendations.push('Implement referral program and improve onboarding experience')
      }
      if (opportunity.includes('AI services')) {
        recommendations.push('Launch new AI consultation packages and promote existing ones')
      }
      if (opportunity.includes('churn rate')) {
        recommendations.push('Implement customer success program and improve support')
      }
    })
    
    // Address risks
    risks.forEach(risk => {
      if (risk.includes('revenue concentration')) {
        recommendations.push('Develop new revenue streams and diversify offerings')
      }
      if (risk.includes('customer satisfaction')) {
        recommendations.push('Conduct customer surveys and improve service quality')
      }
      if (risk.includes('declining growth')) {
        recommendations.push('Review pricing strategy and marketing effectiveness')
      }
    })
    
    // General recommendations based on metrics
    if (overview.metrics.averageOrderValue < 50) {
      recommendations.push('Implement upselling strategies to increase average order value')
    }
    
    if (overview.metrics.conversionRate < 2) {
      recommendations.push('Optimize conversion funnel and improve user experience')
    }
    
    return recommendations
  }
}

export const revenueAnalytics = RevenueAnalyticsManager.getInstance() 