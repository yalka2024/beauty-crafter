import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export interface SubscriptionTierData {
  name: string
  description?: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  features: string[]
  maxBookings?: number
  prioritySupport: boolean
}

export interface UserSubscriptionData {
  userId: string
  tierId: string
  stripeSubscriptionId?: string
}

export class SubscriptionSystemManager {
  /**
   * Create a new subscription tier
   */
  async createSubscriptionTier(data: SubscriptionTierData): Promise<string> {
    try {
      const tier = await prisma.subscriptionTier.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency,
          billingCycle: data.billingCycle,
          features: data.features,
          maxBookings: data.maxBookings,
          prioritySupport: data.prioritySupport
        }
      })

      return tier.id
    } catch (error) {
      console.error('Error creating subscription tier:', error)
      throw new Error('Failed to create subscription tier')
    }
  }

  /**
   * Create Stripe subscription for user
   */
  async createStripeSubscription(
    userId: string,
    tierId: string,
    paymentMethodId: string
  ): Promise<{ subscriptionId: string; clientSecret: string }> {
    try {
      const tier = await prisma.subscriptionTier.findUnique({
        where: { id: tierId }
      })

      if (!tier) {
        throw new Error('Subscription tier not found')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create or retrieve Stripe customer
      let customerId = await this.getStripeCustomerId(userId)
      if (!customerId) {
        customerId = await this.createStripeCustomer(userId, user.email!)
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: tier.currency.toLowerCase(),
            product_data: {
              name: tier.name,
              description: tier.description
            },
            unit_amount: Math.round(tier.price * 100), // Convert to cents
            recurring: {
              interval: tier.billingCycle === 'monthly' ? 'month' : 'year'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      })

      // Save subscription to database
      await prisma.userSubscription.create({
        data: {
          userId,
          tierId,
          stripeSubscriptionId: subscription.id,
          status: 'active',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      })

      const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret

      return {
        subscriptionId: subscription.id,
        clientSecret: clientSecret || ''
      }
    } catch (error) {
      console.error('Error creating Stripe subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId: string) {
    try {
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          userId,
          status: 'active'
        },
        include: {
          tier: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return subscription
    } catch (error) {
      console.error('Error getting user subscription:', error)
      throw new Error('Failed to get user subscription')
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId)
      if (!subscription) {
        throw new Error('No active subscription found')
      }

      if (subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd
        })
      }

      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: cancelAtPeriodEnd ? 'active' : 'cancelled',
          cancelAtPeriodEnd,
          cancelledAt: cancelAtPeriodEnd ? undefined : new Date()
        }
      })

      // Send notification
      await this.sendSubscriptionCancellationNotification(userId, cancelAtPeriodEnd)
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    try {
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          userId,
          status: 'cancelled',
          cancelAtPeriodEnd: true
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!subscription) {
        throw new Error('No cancellable subscription found')
      }

      if (subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false
        })
      }

      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: false,
          cancelledAt: null
        }
      })

      // Send notification
      await this.sendSubscriptionReactivatedNotification(userId)
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      throw new Error('Failed to reactivate subscription')
    }
  }

  /**
   * Get available subscription tiers
   */
  async getSubscriptionTiers() {
    try {
      const tiers = await prisma.subscriptionTier.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      })

      return tiers
    } catch (error) {
      console.error('Error getting subscription tiers:', error)
      throw new Error('Failed to get subscription tiers')
    }
  }

  /**
   * Check if user has exceeded booking limit
   */
  async checkBookingLimit(userId: string): Promise<{ canBook: boolean; remainingBookings?: number }> {
    try {
      const subscription = await this.getUserSubscription(userId)
      if (!subscription || !subscription.tier.maxBookings) {
        return { canBook: true }
      }

      const currentPeriodStart = subscription.currentPeriodStart
      const currentPeriodEnd = subscription.currentPeriodEnd

      const bookingsCount = await prisma.booking.count({
        where: {
          client: { userId },
          createdAt: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd
          }
        }
      })

      const canBook = bookingsCount < subscription.tier.maxBookings
      const remainingBookings = subscription.tier.maxBookings - bookingsCount

      return { canBook, remainingBookings }
    } catch (error) {
      console.error('Error checking booking limit:', error)
      return { canBook: true }
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    try {
      const totalSubscriptions = await prisma.userSubscription.count()
      const activeSubscriptions = await prisma.userSubscription.count({
        where: { status: 'active' }
      })
      const cancelledSubscriptions = await prisma.userSubscription.count({
        where: { status: 'cancelled' }
      })

      const tierDistribution = await prisma.userSubscription.groupBy({
        by: ['tierId'],
        where: { status: 'active' },
        _count: { tierId: true },
        include: {
          tier: {
            select: { name: true, price: true }
          }
        }
      })

      const monthlyRevenue = await this.calculateMonthlyRevenue()

      return {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        tierDistribution,
        monthlyRevenue
      }
    } catch (error) {
      console.error('Error getting subscription analytics:', error)
      throw new Error('Failed to get subscription analytics')
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error)
    }
  }

  /**
   * Get or create Stripe customer ID
   */
  private async getStripeCustomerId(userId: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })

      if (!user?.email) return null

      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      })

      return customers.data[0]?.id || null
    } catch (error) {
      console.error('Error getting Stripe customer ID:', error)
      return null
    }
  }

  /**
   * Create Stripe customer
   */
  private async createStripeCustomer(userId: string, email: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId }
      })

      return customer.id
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      throw new Error('Failed to create Stripe customer')
    }
  }

  /**
   * Handle subscription updated webhook
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.userSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status === 'active' ? 'active' : 'cancelled',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      })
    } catch (error) {
      console.error('Error handling subscription updated:', error)
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.userSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error handling subscription deleted:', error)
    }
  }

  /**
   * Handle payment succeeded webhook
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (invoice.subscription) {
        await prisma.userSubscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { status: 'active' }
        })
      }
    } catch (error) {
      console.error('Error handling payment succeeded:', error)
    }
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (invoice.subscription) {
        await prisma.userSubscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { status: 'cancelled' }
        })
      }
    } catch (error) {
      console.error('Error handling payment failed:', error)
    }
  }

  /**
   * Calculate monthly revenue
   */
  private async calculateMonthlyRevenue(): Promise<number> {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const subscriptions = await prisma.userSubscription.findMany({
        where: {
          status: 'active',
          createdAt: { gte: startOfMonth }
        },
        include: { tier: true }
      })

      return subscriptions.reduce((total, sub) => {
        const monthlyPrice = sub.tier.billingCycle === 'monthly' 
          ? Number(sub.tier.price)
          : Number(sub.tier.price) / 12
        return total + monthlyPrice
      }, 0)
    } catch (error) {
      console.error('Error calculating monthly revenue:', error)
      return 0
    }
  }

  /**
   * Send subscription cancellation notification
   */
  private async sendSubscriptionCancellationNotification(
    userId: string,
    cancelAtPeriodEnd: boolean
  ): Promise<void> {
    try {
      const message = cancelAtPeriodEnd
        ? 'Your subscription will be cancelled at the end of the current billing period.'
        : 'Your subscription has been cancelled immediately.'

      await prisma.notification.create({
        data: {
          userId,
          title: 'Subscription Cancelled',
          message,
          type: 'subscription_cancelled',
          data: { cancelAtPeriodEnd }
        }
      })
    } catch (error) {
      console.error('Error sending cancellation notification:', error)
    }
  }

  /**
   * Send subscription reactivated notification
   */
  private async sendSubscriptionReactivatedNotification(userId: string): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Subscription Reactivated',
          message: 'Your subscription has been reactivated successfully!',
          type: 'subscription_reactivated'
        }
      })
    } catch (error) {
      console.error('Error sending reactivation notification:', error)
    }
  }
}

export const subscriptionSystemManager = new SubscriptionSystemManager()
