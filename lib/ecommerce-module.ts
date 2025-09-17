import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export interface ProductData {
  name: string
  description: string
  category: string
  subcategory?: string
  price: number
  currency: string
  sku: string
  stock: number
  images: string[]
  specifications?: any
}

export interface OrderData {
  userId: string
  items: Array<{
    productId: string
    quantity: number
  }>
  shippingAddress: any
  billingAddress: any
}

export interface ProductRecommendationData {
  userId: string
  productId: string
  serviceId?: string
  bookingId?: string
  reason?: string
  confidence: number
}

export class ECommerceModuleManager {
  /**
   * Create a new product
   */
  async createProduct(data: ProductData): Promise<string> {
    try {
      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory,
          price: data.price,
          currency: data.currency,
          sku: data.sku,
          stock: data.stock,
          images: data.images,
          specifications: data.specifications
        }
      })

      return product.id
    } catch (error) {
      console.error('Error creating product:', error)
      throw new Error('Failed to create product')
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, updates: Partial<ProductData>): Promise<void> {
    try {
      await prisma.product.update({
        where: { id: productId },
        data: updates
      })
    } catch (error) {
      console.error('Error updating product:', error)
      throw new Error('Failed to update product')
    }
  }

  /**
   * Get product details
   */
  async getProduct(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      return product
    } catch (error) {
      console.error('Error getting product:', error)
      throw new Error('Failed to get product')
    }
  }

  /**
   * Search products
   */
  async searchProducts(filters: {
    category?: string
    subcategory?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    searchTerm?: string
  }) {
    try {
      const whereClause: any = { isActive: true }

      if (filters.category) {
        whereClause.category = filters.category
      }

      if (filters.subcategory) {
        whereClause.subcategory = filters.subcategory
      }

      if (filters.minPrice) {
        whereClause.price = { gte: filters.minPrice }
      }

      if (filters.maxPrice) {
        whereClause.price = { ...whereClause.price, lte: filters.maxPrice }
      }

      if (filters.inStock) {
        whereClause.stock = { gt: 0 }
      }

      if (filters.searchTerm) {
        whereClause.OR = [
          { name: { contains: filters.searchTerm, mode: 'insensitive' } },
          { description: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })

      return products
    } catch (error) {
      console.error('Error searching products:', error)
      throw new Error('Failed to search products')
    }
  }

  /**
   * Get product recommendations for user
   */
  async getProductRecommendations(userId: string, limit: number = 10) {
    try {
      const recommendations = await prisma.productRecommendation.findMany({
        where: { userId },
        include: {
          product: true,
          service: true,
          booking: true
        },
        orderBy: { confidence: 'desc' },
        take: limit
      })

      return recommendations
    } catch (error) {
      console.error('Error getting product recommendations:', error)
      throw new Error('Failed to get product recommendations')
    }
  }

  /**
   * Generate product recommendations based on booking
   */
  async generateBookingRecommendations(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: true,
          client: true
        }
      })

      if (!booking) return

      // Find related products based on service category
      const relatedProducts = await prisma.product.findMany({
        where: {
          category: booking.service.category,
          isActive: true,
          stock: { gt: 0 }
        },
        take: 5
      })

      // Create recommendations
      const recommendations = relatedProducts.map(product => ({
        userId: booking.client.userId,
        productId: product.id,
        serviceId: booking.serviceId,
        bookingId: booking.id,
        reason: `Recommended based on your ${booking.service.name} service`,
        confidence: 0.8
      }))

      await prisma.productRecommendation.createMany({
        data: recommendations,
        skipDuplicates: true
      })
    } catch (error) {
      console.error('Error generating booking recommendations:', error)
    }
  }

  /**
   * Create order
   */
  async createOrder(data: OrderData): Promise<{ orderId: string; clientSecret: string }> {
    try {
      // Calculate total amount
      const products = await prisma.product.findMany({
        where: {
          id: { in: data.items.map(item => item.productId) }
        }
      })

      let totalAmount = 0
      const orderItems = []

      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId)
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`)
        }

        const itemTotal = Number(product.price) * item.quantity
        totalAmount += itemTotal

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        })
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          userId: data.userId,
          totalAmount,
          currency: 'USD',
          status: 'pending',
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress
        }
      })

      // Create order items
      await prisma.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: order.id,
          ...item
        }))
      })

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: order.id,
          userId: data.userId
        }
      })

      // Update order with Stripe payment ID
      await prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentId: paymentIntent.id }
      })

      return {
        orderId: order.id,
        clientSecret: paymentIntent.client_secret!
      }
    } catch (error) {
      console.error('Error creating order:', error)
      throw new Error('Failed to create order')
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    trackingNumber?: string
  ): Promise<void> {
    try {
      const updateData: any = { status }

      if (status === 'shipped' && trackingNumber) {
        updateData.trackingNumber = trackingNumber
        updateData.shippedAt = new Date()
      }

      if (status === 'delivered') {
        updateData.deliveredAt = new Date()
      }

      await prisma.order.update({
        where: { id: orderId },
        data: updateData
      })

      // Update product stock if order is cancelled
      if (status === 'cancelled') {
        await this.restoreProductStock(orderId)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      throw new Error('Failed to update order status')
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string) {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return orders
    } catch (error) {
      console.error('Error getting user orders:', error)
      throw new Error('Failed to get user orders')
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      return order
    } catch (error) {
      console.error('Error getting order:', error)
      throw new Error('Failed to get order')
    }
  }

  /**
   * Track product recommendation interaction
   */
  async trackRecommendationInteraction(
    recommendationId: string,
    action: 'viewed' | 'purchased'
  ): Promise<void> {
    try {
      const updateData = action === 'viewed' 
        ? { isViewed: true }
        : { isViewed: true, isPurchased: true }

      await prisma.productRecommendation.update({
        where: { id: recommendationId },
        data: updateData
      })
    } catch (error) {
      console.error('Error tracking recommendation interaction:', error)
    }
  }

  /**
   * Get e-commerce analytics
   */
  async getECommerceAnalytics() {
    try {
      const [
        totalProducts,
        totalOrders,
        totalRevenue,
        topProducts,
        recentOrders
      ] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: 'delivered' }
        }),
        this.getTopProducts(),
        this.getRecentOrders()
      ])

      return {
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
        topProducts,
        recentOrders
      }
    } catch (error) {
      console.error('Error getting e-commerce analytics:', error)
      throw new Error('Failed to get e-commerce analytics')
    }
  }

  /**
   * Handle Stripe webhook for order payments
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error)
    }
  }

  /**
   * Helper methods
   */
  private async restoreProductStock(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (!order) return

      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }
    } catch (error) {
      console.error('Error restoring product stock:', error)
    }
  }

  private async getTopProducts() {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { productId: true },
      include: {
        product: {
          select: { name: true, price: true }
        }
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    })

    return topProducts.map(item => ({
      productId: item.productId,
      productName: item.product?.name,
      totalSold: item._sum.quantity || 0,
      orderCount: item._count.productId,
      revenue: (item._sum.quantity || 0) * Number(item.product?.price || 0)
    }))
  }

  private async getRecentOrders() {
    return await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata.orderId
      if (!orderId) return

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'processing' }
      })

      // Update product stock
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (order) {
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Error handling payment succeeded:', error)
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata.orderId
      if (!orderId) return

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' }
      })
    } catch (error) {
      console.error('Error handling payment failed:', error)
    }
  }
}

export const ecommerceModuleManager = new ECommerceModuleManager()
