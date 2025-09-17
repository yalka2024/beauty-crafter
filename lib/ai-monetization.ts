import { prisma } from './prisma'
import { stripe } from './stripe'
import { logger } from './logging'
import { monitoring } from './monitoring'
import { cache } from './cache'
import { subscriptionManager } from './subscription-manager'

// AI Service Pricing
export const AI_SERVICE_PRICING = {
  SKIN_ANALYSIS: {
    basic: { price: 19, credits: 1, features: ['Basic skin assessment', 'General recommendations'] },
    premium: { price: 39, credits: 2, features: ['Detailed analysis', 'Personalized routine', 'Product recommendations'] },
    expert: { price: 79, credits: 3, features: ['Expert consultation', 'Custom treatment plan', 'Follow-up support'] }
  },
  BEAUTY_CONSULTATION: {
    basic: { price: 25, credits: 1, features: ['Style consultation', 'Basic recommendations'] },
    premium: { price: 49, credits: 2, features: ['Personalized style plan', 'Product recommendations', 'Follow-up'] },
    expert: { price: 99, credits: 3, features: ['Expert stylist consultation', 'Custom look book', 'Ongoing support'] }
  },
  TREATMENT_PLANNING: {
    basic: { price: 29, credits: 1, features: ['Basic treatment plan', 'General timeline'] },
    premium: { price: 59, credits: 2, features: ['Detailed plan', 'Progress tracking', 'Adjustments'] },
    expert: { price: 119, credits: 3, features: ['Expert consultation', 'Custom protocols', 'Monitoring'] }
  },
  PRODUCT_RECOMMENDATIONS: {
    basic: { price: 15, credits: 1, features: ['Basic recommendations', 'General guidance'] },
    premium: { price: 29, credits: 2, features: ['Personalized products', 'Routine integration', 'Follow-up'] },
    expert: { price: 59, credits: 3, features: ['Expert curation', 'Custom formulations', 'Ongoing support'] }
  }
}

// AI Service Types
export const AI_SERVICE_TYPES = {
  SKIN_ANALYSIS: 'skin_analysis',
  BEAUTY_CONSULTATION: 'beauty_consultation',
  TREATMENT_PLANNING: 'treatment_planning',
  PRODUCT_RECOMMENDATIONS: 'product_recommendations'
} as const

interface AIRequestData {
  userId: string
  serviceType: keyof typeof AI_SERVICE_TYPES
  tier: 'basic' | 'premium' | 'expert'
  inputData: Record<string, any>
  metadata?: Record<string, any>
}

interface AIResponse {
  id: string
  userId: string
  serviceType: string
  tier: string
  inputData: Record<string, any>
  response: Record<string, any>
  creditsUsed: number
  cost: number
  status: 'processing' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
}

export class AIMonetizationManager {
  private static instance: AIMonetizationManager

  private constructor() {}

  public static getInstance(): AIMonetizationManager {
    if (!AIMonetizationManager.instance) {
      AIMonetizationManager.instance = new AIMonetizationManager()
    }
    return AIMonetizationManager.instance
  }

  // Request AI service
  async requestAIService(data: AIRequestData): Promise<{ success: boolean; requestId?: string; error?: string; cost?: number }> {
    try {
      // Check user subscription and credits
      const subscription = await subscriptionManager.getSubscriptionStatus(data.userId)
      const servicePricing = AI_SERVICE_PRICING[data.serviceType][data.tier]
      
      if (!servicePricing) {
        return { success: false, error: 'Invalid service type or tier' }
      }

      // Check if user has enough credits or needs to pay
      const canUseCredits = subscription && this.canUseSubscriptionCredits(subscription, data.serviceType)
      
      if (!canUseCredits) {
        // User needs to pay for this service
        const paymentIntent = await this.createPaymentIntent(data.userId, servicePricing.price, data)
        
        return {
          success: true,
          requestId: paymentIntent.id,
          cost: servicePricing.price
        }
      }

      // User can use subscription credits
      const requestId = await this.processAIRequestWithCredits(data, subscription!)
      
      return {
        success: true,
        requestId,
        cost: 0 // Free with subscription
      }

    } catch (error) {
      logger.error('Failed to request AI service', { error: String(error), userId: data.userId })
      monitoring.recordError(error as Error, 'ai_service_request')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Process AI request with subscription credits
  private async processAIRequestWithCredits(data: AIRequestData, subscription: any): Promise<string> {
    try {
      // Create AI request record
      const aiRequest = await prisma.aiRequest.create({
        data: {
          userId: data.userId,
          serviceType: data.serviceType,
          tier: data.tier,
          inputData: data.inputData,
          status: 'PROCESSING',
          creditsUsed: AI_SERVICE_PRICING[data.serviceType][data.tier].credits,
          cost: 0, // Free with subscription
          metadata: data.metadata || {}
        }
      })

      // Process the AI request asynchronously
      this.processAIRequestAsync(aiRequest.id, data)

      // Record metrics
      monitoring.recordMetric('ai_service_requested', 1, {
        serviceType: data.serviceType,
        tier: data.tier,
        subscription: subscription.tierId
      })

      return aiRequest.id
    } catch (error) {
      logger.error('Failed to process AI request with credits', { error: String(error) })
      throw error
    }
  }

  // Create payment intent for AI service
  private async createPaymentIntent(userId: string, amount: number, data: AIRequestData): Promise<any> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          userId,
          serviceType: data.serviceType,
          tier: data.tier,
          type: 'ai_service'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      // Create pending AI request
      await prisma.aiRequest.create({
        data: {
          userId,
          serviceType: data.serviceType,
          tier: data.tier,
          inputData: data.inputData,
          status: 'PENDING_PAYMENT',
          stripePaymentIntentId: paymentIntent.id,
          creditsUsed: AI_SERVICE_PRICING[data.serviceType][data.tier].credits,
          cost: amount,
          metadata: data.metadata || {}
        }
      })

      return paymentIntent
    } catch (error) {
      logger.error('Failed to create payment intent for AI service', { error: String(error) })
      throw error
    }
  }

  // Confirm AI service payment
  async confirmAIServicePayment(paymentIntentId: string): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        return { success: false, error: 'Payment not completed' }
      }

      // Update AI request status
      const aiRequest = await prisma.aiRequest.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: 'PROCESSING' }
      })

      // Process the AI request asynchronously
      this.processAIRequestAsync(aiRequest.id, {
        userId: aiRequest.userId,
        serviceType: aiRequest.serviceType as keyof typeof AI_SERVICE_TYPES,
        tier: aiRequest.tier as 'basic' | 'premium' | 'expert',
        inputData: aiRequest.inputData as Record<string, any>
      })

      // Record metrics
      monitoring.recordMetric('ai_service_payment_confirmed', 1, {
        serviceType: aiRequest.serviceType,
        tier: aiRequest.tier,
        amount: aiRequest.cost
      })

      return { success: true, requestId: aiRequest.id }
    } catch (error) {
      logger.error('Failed to confirm AI service payment', { error: String(error) })
      monitoring.recordError(error as Error, 'ai_service_payment_confirmation')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Process AI request asynchronously
  private async processAIRequestAsync(requestId: string, data: any): Promise<void> {
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate AI response based on service type and tier
      const aiResponse = await this.generateAIResponse(data)

      // Update AI request with response
      await prisma.aiRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          response: aiResponse,
          completedAt: new Date()
        }
      })

      // Record metrics
      monitoring.recordMetric('ai_service_completed', 1, {
        serviceType: data.serviceType,
        tier: data.tier
      })

    } catch (error) {
      logger.error('Failed to process AI request', { error: String(error), requestId })
      
      // Update request status to failed
      await prisma.aiRequest.update({
        where: { id: requestId },
        data: {
          status: 'FAILED',
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      monitoring.recordError(error as Error, 'ai_service_processing')
    }
  }

  // Generate AI response (simulated)
  private async generateAIResponse(data: any): Promise<Record<string, any>> {
    const { serviceType, tier, inputData } = data
    
    // In production, this would integrate with OpenAI or other AI services
    const responses = {
      skin_analysis: {
        basic: {
          skinType: 'Combination',
          concerns: ['T-zone oiliness', 'Cheek dryness'],
          recommendations: ['Gentle cleanser', 'Lightweight moisturizer'],
          routine: ['AM: Cleanse, Moisturize, SPF', 'PM: Cleanse, Moisturize']
        },
        premium: {
          skinType: 'Combination with sensitivity',
          concerns: ['T-zone oiliness', 'Cheek dryness', 'Occasional redness'],
          detailedAnalysis: 'Your skin shows signs of compromised barrier...',
          recommendations: ['Gentle cleanser', 'Ceramide moisturizer', 'Niacinamide serum'],
          routine: ['AM: Cleanse, Serum, Moisturize, SPF', 'PM: Cleanse, Serum, Moisturizer'],
          productSuggestions: ['CeraVe Foaming Cleanser', 'The Ordinary Niacinamide']
        },
        expert: {
          skinType: 'Combination with sensitivity and early aging',
          concerns: ['T-zone oiliness', 'Cheek dryness', 'Occasional redness', 'Fine lines'],
          detailedAnalysis: 'Comprehensive analysis reveals...',
          recommendations: ['Gentle cleanser', 'Ceramide moisturizer', 'Niacinamide serum', 'Retinol'],
          routine: ['AM: Cleanse, Serum, Moisturize, SPF', 'PM: Cleanse, Serum, Retinol, Moisturizer'],
          productSuggestions: ['CeraVe Foaming Cleanser', 'The Ordinary Niacinamide', 'Paula\'s Choice Retinol'],
          treatmentPlan: '3-month progressive plan with monthly adjustments',
          followUpSchedule: 'Monthly check-ins for 6 months'
        }
      },
      beauty_consultation: {
        basic: {
          styleType: 'Natural Glam',
          recommendations: ['Soft waves', 'Natural makeup'],
          tips: ['Focus on skincare', 'Less is more']
        },
        premium: {
          styleType: 'Natural Glam with edge',
          recommendations: ['Soft waves with texture', 'Natural makeup with statement lip'],
          tips: ['Focus on skincare', 'Less is more', 'Add one statement piece'],
          productSuggestions: ['Tinted moisturizer', 'Cream blush', 'Glossy lip']
        },
        expert: {
          styleType: 'Natural Glam with edge and versatility',
          recommendations: ['Soft waves with texture', 'Natural makeup with statement lip', 'Versatile styling'],
          tips: ['Focus on skincare', 'Less is more', 'Add one statement piece', 'Build a capsule collection'],
          productSuggestions: ['Tinted moisturizer', 'Cream blush', 'Glossy lip', 'Multi-use products'],
          styleGuide: 'Complete style transformation guide',
          ongoingSupport: 'Monthly style updates and seasonal adjustments'
        }
      }
    }

    return responses[serviceType]?.[tier] || { message: 'AI analysis completed' }
  }

  // Check if user can use subscription credits
  private canUseSubscriptionCredits(subscription: any, serviceType: string): boolean {
    const tier = subscription.tierId.toLowerCase()
    
    // Check subscription limits
    if (tier === 'basic') return false
    if (tier === 'premium' && subscription.aiConsultationsUsed < 2) return true
    if (tier === 'vip' || tier === 'enterprise') return true
    
    return false
  }

  // Get AI service history
  async getAIServiceHistory(userId: string): Promise<AIResponse[]> {
    try {
      const requests = await prisma.aiRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return requests.map(request => ({
        id: request.id,
        userId: request.userId,
        serviceType: request.serviceType,
        tier: request.tier,
        inputData: request.inputData as Record<string, any>,
        response: request.response as Record<string, any>,
        creditsUsed: request.creditsUsed,
        cost: request.cost,
        status: request.status as 'processing' | 'completed' | 'failed',
        createdAt: request.createdAt,
        completedAt: request.completedAt || undefined
      }))
    } catch (error) {
      logger.error('Failed to get AI service history', { error: String(error), userId })
      return []
    }
  }

  // Get AI service analytics
  async getAIServiceAnalytics(): Promise<any> {
    try {
      const analytics = await prisma.$transaction([
        prisma.aiRequest.groupBy({
          by: ['serviceType', 'tier', 'status'],
          _count: { id: true },
          _sum: { cost: true }
        }),
        prisma.aiRequest.aggregate({
          _count: { id: true },
          _sum: { cost: true },
          _avg: { cost: true }
        })
      ])

      return {
        serviceBreakdown: analytics[0],
        totals: analytics[1]
      }
    } catch (error) {
      logger.error('Failed to get AI service analytics', { error: String(error) })
      return null
    }
  }

  // Handle AI service webhooks
  async handleAIWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          if (event.data.object.metadata?.type === 'ai_service') {
            await this.confirmAIServicePayment(event.data.object.id)
          }
          break
        case 'payment_intent.payment_failed':
          // Handle failed payments
          monitoring.recordMetric('ai_service_payment_failed', 1)
          break
      }
    } catch (error) {
      logger.error('Failed to handle AI webhook', { error: String(error), eventType: event.type })
      monitoring.recordError(error as Error, 'ai_service_webhook')
    }
  }
}

export const aiMonetizationManager = AIMonetizationManager.getInstance() 