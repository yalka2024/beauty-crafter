import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

export interface ClientProfile {
  userId: string
  skinType?: string
  hairType?: string
  hairColor?: string
  eyeColor?: string
  skinTone?: string
  allergies: string[]
  sensitivities: string[]
  preferredStyles: string[]
  budgetRange?: { min: number; max: number }
  locationRadius?: number
  timePreferences?: {
    morning: boolean
    afternoon: boolean
    evening: boolean
  }
}

export interface ServiceRecommendation {
  serviceId: string
  providerId: string
  confidence: number
  reason: string
  metadata?: any
}

export interface ProviderRecommendation {
  providerId: string
  confidence: number
  reason: string
  metadata?: any
}

export class AIPersonalizationEngine {
  /**
   * Generate personalized service recommendations based on client profile and history
   */
  async generateServiceRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ServiceRecommendation[]> {
    try {
      // Get client profile and preferences
      const clientProfile = await this.getClientProfile(userId)
      if (!clientProfile) {
        return []
      }

      // Get client's booking history
      const bookingHistory = await this.getBookingHistory(userId)
      
      // Get client's review patterns
      const reviewPatterns = await this.getReviewPatterns(userId)

      // Get available services in client's area
      const availableServices = await this.getAvailableServices(
        clientProfile.locationRadius || 25
      )

      // Calculate recommendation scores
      const recommendations = await this.calculateServiceScores(
        clientProfile,
        bookingHistory,
        reviewPatterns,
        availableServices
      )

      // Sort by confidence and return top recommendations
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit)
        .map(rec => ({
          serviceId: rec.serviceId,
          providerId: rec.providerId,
          confidence: rec.confidence,
          reason: rec.reason,
          metadata: rec.metadata
        }))
    } catch (error) {
      console.error('Error generating service recommendations:', error)
      return []
    }
  }

  /**
   * Generate personalized provider recommendations
   */
  async generateProviderRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ProviderRecommendation[]> {
    try {
      const clientProfile = await this.getClientProfile(userId)
      if (!clientProfile) {
        return []
      }

      const bookingHistory = await this.getBookingHistory(userId)
      const availableProviders = await this.getAvailableProviders(
        clientProfile.locationRadius || 25
      )

      const recommendations = await this.calculateProviderScores(
        clientProfile,
        bookingHistory,
        availableProviders
      )

      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit)
        .map(rec => ({
          providerId: rec.providerId,
          confidence: rec.confidence,
          reason: rec.reason,
          metadata: rec.metadata
        }))
    } catch (error) {
      console.error('Error generating provider recommendations:', error)
      return []
    }
  }

  /**
   * Save recommendations to database
   */
  async saveRecommendations(
    userId: string,
    recommendations: (ServiceRecommendation | ProviderRecommendation)[],
    type: 'service' | 'provider' | 'product'
  ): Promise<void> {
    try {
      const recommendationData = recommendations.map(rec => ({
        userId,
        providerId: 'providerId' in rec ? rec.providerId : null,
        serviceId: 'serviceId' in rec ? rec.serviceId : null,
        recommendationType: type,
        confidence: rec.confidence,
        reason: rec.reason,
        metadata: rec.metadata,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }))

      await prisma.aIRecommendation.createMany({
        data: recommendationData,
        skipDuplicates: true
      })
    } catch (error) {
      console.error('Error saving recommendations:', error)
    }
  }

  /**
   * Get client profile and preferences
   */
  private async getClientProfile(userId: string): Promise<ClientProfile | null> {
    try {
      const preferences = await prisma.clientPreference.findUnique({
        where: { userId }
      })

      if (!preferences) {
        return null
      }

      return {
        userId: preferences.userId,
        skinType: preferences.skinType || undefined,
        hairType: preferences.hairType || undefined,
        hairColor: preferences.hairColor || undefined,
        eyeColor: preferences.eyeColor || undefined,
        skinTone: preferences.skinTone || undefined,
        allergies: preferences.allergies,
        sensitivities: preferences.sensitivities,
        preferredStyles: preferences.preferredStyles,
        budgetRange: preferences.budgetRange as { min: number; max: number } | undefined,
        locationRadius: preferences.locationRadius || undefined,
        timePreferences: preferences.timePreferences as {
          morning: boolean
          afternoon: boolean
          evening: boolean
        } | undefined
      }
    } catch (error) {
      console.error('Error getting client profile:', error)
      return null
    }
  }

  /**
   * Get client's booking history for pattern analysis
   */
  private async getBookingHistory(userId: string) {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          client: { userId }
        },
        include: {
          service: true,
          provider: true,
          reviews: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return bookings
    } catch (error) {
      console.error('Error getting booking history:', error)
      return []
    }
  }

  /**
   * Analyze review patterns for preferences
   */
  private async getReviewPatterns(userId: string) {
    try {
      const reviews = await prisma.review.findMany({
        where: {
          client: { userId }
        },
        include: {
          service: true,
          provider: true
        }
      })

      return reviews
    } catch (error) {
      console.error('Error getting review patterns:', error)
      return []
    }
  }

  /**
   * Get available services in client's area
   */
  private async getAvailableServices(radiusMiles: number) {
    try {
      // This would typically use geospatial queries
      // For now, we'll get all active services
      const services = await prisma.service.findMany({
        where: { isActive: true },
        include: {
          provider: {
            include: {
              user: true
            }
          }
        }
      })

      return services
    } catch (error) {
      console.error('Error getting available services:', error)
      return []
    }
  }

  /**
   * Get available providers in client's area
   */
  private async getAvailableProviders(radiusMiles: number) {
    try {
      const providers = await prisma.provider.findMany({
        where: { isAvailable: true },
        include: {
          user: true,
          services: {
            where: { isActive: true }
          }
        }
      })

      return providers
    } catch (error) {
      console.error('Error getting available providers:', error)
      return []
    }
  }

  /**
   * Calculate recommendation scores for services
   */
  private async calculateServiceScores(
    profile: ClientProfile,
    bookingHistory: any[],
    reviewPatterns: any[],
    availableServices: any[]
  ) {
    const recommendations = []

    for (const service of availableServices) {
      let score = 0
      let reasons = []

      // Base score from service popularity
      score += 0.1

      // Match with client preferences
      if (profile.preferredStyles.includes(service.category)) {
        score += 0.3
        reasons.push('Matches your preferred style')
      }

      // Budget compatibility
      if (profile.budgetRange) {
        const servicePrice = Number(service.price)
        if (servicePrice >= profile.budgetRange.min && servicePrice <= profile.budgetRange.max) {
          score += 0.2
          reasons.push('Within your budget range')
        }
      }

      // Provider rating influence
      if (service.provider.rating > 4.0) {
        score += 0.2
        reasons.push('Highly rated provider')
      }

      // Historical preference matching
      const similarBookings = bookingHistory.filter(booking => 
        booking.service.category === service.category
      )
      if (similarBookings.length > 0) {
        score += 0.15
        reasons.push('Similar to your previous bookings')
      }

      // Review sentiment analysis
      const positiveReviews = reviewPatterns.filter(review => 
        review.rating >= 4 && review.service.category === service.category
      )
      if (positiveReviews.length > 0) {
        score += 0.1
        reasons.push('You enjoyed similar services')
      }

      // Provider experience bonus
      if (service.provider.yearsOfExperience > 5) {
        score += 0.1
        reasons.push('Experienced provider')
      }

      // Normalize score to 0-1 range
      score = Math.min(score, 1.0)

      if (score > 0.3) { // Only recommend if score is above threshold
        recommendations.push({
          serviceId: service.id,
          providerId: service.providerId,
          confidence: score,
          reason: reasons.join(', '),
          metadata: {
            category: service.category,
            price: service.price,
            providerRating: service.provider.rating,
            experience: service.provider.yearsOfExperience
          }
        })
      }
    }

    return recommendations
  }

  /**
   * Calculate recommendation scores for providers
   */
  private async calculateProviderScores(
    profile: ClientProfile,
    bookingHistory: any[],
    availableProviders: any[]
  ) {
    const recommendations = []

    for (const provider of availableProviders) {
      let score = 0
      let reasons = []

      // Base score from provider rating
      score += Number(provider.rating) * 0.2

      // Experience bonus
      if (provider.yearsOfExperience > 5) {
        score += 0.2
        reasons.push('Experienced professional')
      }

      // Review count influence
      if (provider.totalReviews > 10) {
        score += 0.1
        reasons.push('Well-reviewed provider')
      }

      // Service variety bonus
      if (provider.services.length > 3) {
        score += 0.1
        reasons.push('Offers variety of services')
      }

      // Historical preference matching
      const previousBookings = bookingHistory.filter(booking => 
        booking.providerId === provider.id
      )
      if (previousBookings.length > 0) {
        score += 0.3
        reasons.push('You\'ve booked with this provider before')
      }

      // Specialty matching
      const matchingSpecialties = provider.specialties.filter((specialty: string) =>
        profile.preferredStyles.includes(specialty)
      )
      if (matchingSpecialties.length > 0) {
        score += 0.2
        reasons.push('Specializes in your preferred styles')
      }

      // Normalize score
      score = Math.min(score, 1.0)

      if (score > 0.4) {
        recommendations.push({
          providerId: provider.id,
          confidence: score,
          reason: reasons.join(', '),
          metadata: {
            rating: provider.rating,
            experience: provider.yearsOfExperience,
            specialties: provider.specialties,
            serviceCount: provider.services.length
          }
        })
      }
    }

    return recommendations
  }

  /**
   * Update client preferences based on behavior
   */
  async updateClientPreferences(
    userId: string,
    preferences: Partial<ClientProfile>
  ): Promise<void> {
    try {
      await prisma.clientPreference.upsert({
        where: { userId },
        update: {
          skinType: preferences.skinType,
          hairType: preferences.hairType,
          hairColor: preferences.hairColor,
          eyeColor: preferences.eyeColor,
          skinTone: preferences.skinTone,
          allergies: preferences.allergies || [],
          sensitivities: preferences.sensitivities || [],
          preferredStyles: preferences.preferredStyles || [],
          budgetRange: preferences.budgetRange,
          locationRadius: preferences.locationRadius,
          timePreferences: preferences.timePreferences
        },
        create: {
          userId,
          skinType: preferences.skinType,
          hairType: preferences.hairType,
          hairColor: preferences.hairColor,
          eyeColor: preferences.eyeColor,
          skinTone: preferences.skinTone,
          allergies: preferences.allergies || [],
          sensitivities: preferences.sensitivities || [],
          preferredStyles: preferences.preferredStyles || [],
          budgetRange: preferences.budgetRange,
          locationRadius: preferences.locationRadius,
          timePreferences: preferences.timePreferences
        }
      })
    } catch (error) {
      console.error('Error updating client preferences:', error)
    }
  }

  /**
   * Track recommendation interaction
   */
  async trackRecommendationInteraction(
    recommendationId: string,
    action: 'viewed' | 'acted_upon'
  ): Promise<void> {
    try {
      const updateData = action === 'viewed' 
        ? { isViewed: true }
        : { isActedUpon: true, isViewed: true }

      await prisma.aIRecommendation.update({
        where: { id: recommendationId },
        data: updateData
      })
    } catch (error) {
      console.error('Error tracking recommendation interaction:', error)
    }
  }

  /**
   * Clean up expired recommendations
   */
  async cleanupExpiredRecommendations(): Promise<void> {
    try {
      await prisma.aIRecommendation.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    } catch (error) {
      console.error('Error cleaning up expired recommendations:', error)
    }
  }
}

export const aiEngine = new AIPersonalizationEngine()
