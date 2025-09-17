import { prisma } from './prisma'
import { stripe } from './stripe'
import { logger } from './logging'
import { monitoring } from './monitoring'
import { cache } from './cache'

// Subscription tiers and pricing
export const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: ['Basic booking', 'Standard support', 'Basic analytics'],
    limits: { bookingsPerMonth: 10, priorityBooking: false, aiConsultations: 0 }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    features: ['Unlimited booking', 'Priority support', 'Advanced analytics', '2 AI consultations/month'],
    limits: { bookingsPerMonth: -1, priorityBooking: true, aiConsultations: 2 }
  },
  VIP: {
    id: 'vip',
    name: 'VIP',
    price: 19.99,
    features: ['Everything in Premium', 'Unlimited AI consultations', 'Exclusive deals', 'Concierge service'],
    limits: { bookingsPerMonth: -1, priorityBooking: true, aiConsultations: -1 }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    features: ['Everything in VIP', 'White-label solutions', 'API access', 'Dedicated support'],
    limits: { bookingsPerMonth: -1, priorityBooking: true, aiConsultations: -1 }
  }
}

// Provider subscription tiers
export const PROVIDER_SUBSCRIPTION_TIERS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: ['Basic listing', 'Standard commission (15%)', 'Basic analytics'],
    commission: 0.15,
    limits: { services: 5, featuredListing: false, prioritySupport: false }
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 79,
    features: ['Enhanced listing', 'Reduced commission (12%)', 'Advanced analytics', 'Priority support'],
    commission: 0.12,
    limits: { services: 15, featuredListing: true, prioritySupport: true }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 149,
    features: ['Premium listing', 'Lowest commission (10%)', 'Full analytics', 'Marketing tools'],
    commission: 0.10,
    limits: { services: -1, featuredListing: true, prioritySupport: true }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    features: ['Everything in Premium', 'White-label solutions', 'API access', 'Dedicated account manager'],
    commission: 0.08,
    limits: { services: -1, featuredListing: true, prioritySupport: true }
  }
}

interface SubscriptionData {
  userId: string
  tierId: string
  providerId?: string
  paymentMethodId: string
  metadata?: Record<string, any>
}

interface SubscriptionStatus {
  id: string
  userId: string
  tierId: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string
  metadata?: Record<string, any>
}

export class SubscriptionManager {
  private static instance: SubscriptionManager

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager()
    }
    return SubscriptionManager.instance
  }

  // Create client subscription
  async createClientSubscription(data: SubscriptionData): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      const tier = SUBSCRIPTION_TIERS[data.tierId.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS]
      if (!tier) {
        throw new Error('Invalid subscription tier')
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: await this.getOrCreateCustomer(data.userId),
        items: [{ price: await this.getPriceId(data.tierId, 'client') }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: data.userId,
          tierId: data.tierId,
          type: 'client'
        }
      })

      // Create subscription record
      const subscriptionRecord = await prisma.subscription.create({
        data: {
          userId: data.userId,
          tierId: data.tierId,
          type: 'CLIENT',
          stripeSubscriptionId: subscription.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          metadata: data.metadata || {}
        }
      })

      // Record metrics
      monitoring.recordMetric('subscription_created', 1, { tier: data.tierId, type: 'client' })
      
      // Cache subscription data
      await cache.set(`subscription:${data.userId}`, subscriptionRecord, 3600)

      return { success: true, subscription: subscriptionRecord }
    } catch (error) {
      logger.error('Failed to create client subscription', { error: String(error), userId: data.userId })
      monitoring.recordError(error as Error, 'subscription_creation')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Create provider subscription
  async createProviderSubscription(data: SubscriptionData): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      if (!data.providerId) {
        throw new Error('Provider ID is required')
      }

      const tier = PROVIDER_SUBSCRIPTION_TIERS[data.tierId.toUpperCase() as keyof typeof PROVIDER_SUBSCRIPTION_TIERS]
      if (!tier) {
        throw new Error('Invalid provider subscription tier')
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: await this.getOrCreateCustomer(data.userId),
        items: [{ price: await this.getPriceId(data.tierId, 'provider') }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: data.userId,
          providerId: data.providerId,
          tierId: data.tierId,
          type: 'provider'
        }
      })

      // Create subscription record
      const subscriptionRecord = await prisma.subscription.create({
        data: {
          userId: data.userId,
          providerId: data.providerId,
          tierId: data.tierId,
          type: 'PROVIDER',
          stripeSubscriptionId: subscription.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          metadata: data.metadata || {}
        }
      })

      // Update provider commission rate
      await prisma.provider.update({
        where: { id: data.providerId },
        data: { commissionRate: tier.commission }
      })

      // Record metrics
      monitoring.recordMetric('subscription_created', 1, { tier: data.tierId, type: 'provider' })
      
      // Cache subscription data
      await cache.set(`subscription:${data.userId}`, subscriptionRecord, 3600)

      return { success: true, subscription: subscriptionRecord }
    } catch (error) {
      logger.error('Failed to create provider subscription', { error: String(error), userId: data.userId })
      monitoring.recordError(error as Error, 'subscription_creation')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Get subscription status
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
      // Check cache first
      const cached = await cache.get(`subscription:${userId}`)
      if (cached) {
        return cached as SubscriptionStatus
      }

      // Get from database
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      })

      if (subscription) {
        // Cache the result
        await cache.set(`subscription:${userId}`, subscription, 3600)
        return subscription as SubscriptionStatus
      }

      return null
    } catch (error) {
      logger.error('Failed to get subscription status', { error: String(error), userId })
      return null
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await this.getSubscriptionStatus(userId)
      if (!subscription) {
        return { success: false, error: 'No active subscription found' }
      }

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        })

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { cancelAtPeriodEnd: true }
        })
      } else {
        // Cancel immediately
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'CANCELED' }
        })
      }

      // Clear cache
      await cache.delete(`subscription:${userId}`)

      // Record metrics
      monitoring.recordMetric('subscription_canceled', 1, { 
        tier: subscription.tierId, 
        type: subscription.type,
        immediate: !cancelAtPeriodEnd
      })

      return { success: true }
    } catch (error) {
      logger.error('Failed to cancel subscription', { error: String(error), userId })
      monitoring.recordError(error as Error, 'subscription_cancellation')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Handle subscription webhooks
  async handleSubscriptionWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object)
          break
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object)
          break
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object)
          break
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object)
          break
      }
    } catch (error) {
      logger.error('Failed to handle subscription webhook', { error: String(error), eventType: event.type })
      monitoring.recordError(error as Error, 'subscription_webhook')
    }
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(): Promise<any> {
    try {
      const analytics = await prisma.$transaction([
        prisma.subscription.groupBy({
          by: ['tierId', 'status'],
          _count: { id: true }
        }),
        prisma.subscription.aggregate({
          _sum: { id: true },
          _avg: { id: true }
        })
      ])

      return {
        tierBreakdown: analytics[0],
        totals: analytics[1]
      }
    } catch (error) {
      logger.error('Failed to get subscription analytics', { error: String(error) })
      return null
    }
  }

  // Private helper methods
  private async getOrCreateCustomer(userId: string): Promise<string> {
    try {
      // Check if customer exists
      const existingCustomers = await stripe.customers.list({ email: userId })
      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id
      }

      // Create new customer
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        throw new Error('User not found')
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId }
      })

      return customer.id
    } catch (error) {
      logger.error('Failed to get or create customer', { error: String(error), userId })
      throw error
    }
  }

  private async getPriceId(tierId: string, type: 'client' | 'provider'): Promise<string> {
    // In production, you would store these price IDs in your database
    // For now, we'll use environment variables or create them dynamically
    const priceId = process.env[`STRIPE_${type.toUpperCase()}_${tierId.toUpperCase()}_PRICE_ID`]
    if (!priceId) {
      throw new Error(`Price ID not found for ${type} tier ${tierId}`)
    }
    return priceId
  }

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    // Handle new subscription creation
    monitoring.recordMetric('subscription_webhook_processed', 1, { event: 'created' })
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    // Handle subscription updates
    monitoring.recordMetric('subscription_webhook_processed', 1, { event: 'updated' })
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    // Handle subscription deletion
    monitoring.recordMetric('subscription_webhook_processed', 1, { event: 'deleted' })
  }

  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    // Handle successful payment
    monitoring.recordMetric('subscription_payment_succeeded', 1)
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    // Handle failed payment
    monitoring.recordMetric('subscription_payment_failed', 1)
  }
}

export const subscriptionManager = SubscriptionManager.getInstance() 