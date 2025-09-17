import { prisma } from './prisma';
import { stripe } from './stripe';
import { z } from 'zod';
import { createNotification, NotificationType } from './notifications';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

// Escrow status enum
export enum EscrowStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

// Payment method types
export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

// Payment schema validation
export const PaymentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  paymentMethodId: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type PaymentData = z.infer<typeof PaymentSchema>;

// Create payment intent and escrow
export async function createPaymentIntent(paymentData: PaymentData, userId: string) {
  try {
    // Validate payment data
    const validatedData = PaymentSchema.parse(paymentData);

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        service: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.client.userId !== userId) {
      throw new Error('You can only pay for your own bookings');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Booking must be confirmed before payment');
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { bookingId: validatedData.bookingId },
    });

    if (existingPayment) {
      throw new Error('Payment already exists for this booking');
    }

    // Calculate fees and totals
    const platformFee = calculatePlatformFee(validatedData.amount);
    const providerAmount = validatedData.amount - platformFee;
    const totalAmount = validatedData.amount;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: validatedData.currency,
      payment_method: validatedData.paymentMethodId,
      confirm: false,
      description: `Payment for ${booking.service.name} with ${booking.provider.user.name}`,
      metadata: {
        bookingId: validatedData.bookingId,
        clientId: userId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        platformFee: platformFee.toString(),
        providerAmount: providerAmount.toString(),
      },
      application_fee_amount: Math.round(platformFee * 100),
      transfer_data: {
        destination: booking.provider.stripeAccountId,
        amount: Math.round(providerAmount * 100),
      },
    });

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        bookingId: validatedData.bookingId,
        clientId: userId,
        providerId: booking.providerId,
        amount: totalAmount,
        platformFee,
        providerAmount,
        currency: validatedData.currency,
        stripePaymentIntentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        paymentMethod: validatedData.paymentMethodId,
        metadata: validatedData.metadata || {},
      },
    });

    // Create escrow record
    const escrow = await prisma.escrow.create({
      data: {
        paymentId: payment.id,
        bookingId: validatedData.bookingId,
        amount: providerAmount,
        status: EscrowStatus.PENDING,
        releaseDate: calculateEscrowReleaseDate(booking.scheduledDate),
        metadata: {
          serviceName: booking.service.name,
          providerName: booking.provider.user.name,
          clientName: booking.client.user.name,
        },
      },
    });

    return {
      payment,
      escrow,
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Confirm payment and release to escrow
export async function confirmPayment(paymentIntentId: string) {
  try {
    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment intent not succeeded');
    }

    // Update payment status
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { status: PaymentStatus.COMPLETED },
      include: {
        booking: { include: { service: true, provider: { include: { user: true } } } },
        client: { include: { user: true } },
      },
    });

    // Update escrow status
    const escrow = await prisma.escrow.update({
      where: { paymentId: payment.id },
      data: { status: EscrowStatus.HELD },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'PAID' },
    });

    // Send notifications
    await Promise.all([
      createNotification({
        userId: payment.client.userId,
        type: NotificationType.PAYMENT_RECEIVED,
        data: {
          amount: payment.amount,
          providerName: payment.booking.provider.user.name,
          serviceName: payment.booking.service.name,
          date: payment.booking.scheduledDate.toLocaleDateString(),
          paymentId: payment.id,
        },
      }),
      createNotification({
        userId: payment.provider.userId,
        type: NotificationType.PAYMENT_RECEIVED,
        data: {
          amount: payment.providerAmount,
          clientName: payment.client.user.name,
          serviceName: payment.booking.service.name,
          date: payment.booking.scheduledDate.toLocaleDateString(),
          paymentId: payment.id,
        },
      }),
    ]);

    return { payment, escrow };
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}

// Release escrow to provider
export async function releaseEscrow(escrowId: string, userId: string) {
  try {
    // Verify user is the provider or admin
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        payment: { include: { provider: { include: { user: true } } } },
        booking: true,
      },
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.payment.provider.userId !== userId) {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { admin: true },
      });

      if (!user?.admin) {
        throw new Error('Unauthorized to release escrow');
      }
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new Error('Escrow is not in held status');
    }

    // Check if escrow release date has passed or service is completed
    const now = new Date();
    const canRelease = escrow.releaseDate <= now || escrow.booking.status === 'COMPLETED';

    if (!canRelease) {
      throw new Error('Escrow cannot be released yet');
    }

    // Release funds to provider via Stripe
    const transfer = await stripe.transfers.create({
      amount: Math.round(escrow.amount * 100),
      currency: 'usd',
      destination: escrow.payment.provider.stripeAccountId,
      description: `Escrow release for ${escrow.booking.service.name}`,
      metadata: {
        escrowId: escrow.id,
        paymentId: escrow.paymentId,
        bookingId: escrow.bookingId,
      },
    });

    // Update escrow status
    const updatedEscrow = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date(),
        stripeTransferId: transfer.id,
      },
    });

    // Send notification to provider
    await createNotification({
      userId: escrow.payment.provider.userId,
      type: NotificationType.PAYMENT_RECEIVED,
      data: {
        amount: escrow.amount,
        serviceName: escrow.booking.service.name,
        clientName: escrow.booking.client?.user?.name || 'Client',
        escrowId: escrow.id,
      },
    });

    return updatedEscrow;
  } catch (error) {
    console.error('Error releasing escrow:', error);
    throw error;
  }
}

// Process refund
export async function processRefund(
  paymentId: string,
  userId: string,
  reason: string,
  amount?: number
) {
  try {
    // Verify user authorization
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        booking: { include: { service: true } },
        escrow: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if user is authorized to request refund
    const isClient = payment.client.userId === userId;
    const isProvider = payment.provider.userId === userId;
    
    if (!isClient && !isProvider) {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { admin: true },
      });

      if (!user?.admin) {
        throw new Error('Unauthorized to process refund');
      }
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Payment must be completed to process refund');
    }

    // Calculate refund amount
    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: {
        reason,
        requestedBy: userId,
        paymentId: payment.id,
      },
    });

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount,
        refundReason: reason,
        stripeRefundId: refund.id,
      },
    });

    // Update escrow status if applicable
    if (payment.escrow && payment.escrow.status === EscrowStatus.HELD) {
      await prisma.escrow.update({
        where: { id: payment.escrow.id },
        data: { status: EscrowStatus.REFUNDED },
      });
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CANCELLED' },
    });

    // Send notifications
    await Promise.all([
      createNotification({
        userId: payment.client.userId,
        type: NotificationType.PAYMENT_RECEIVED, // Reuse for refund notification
        data: {
          amount: refundAmount,
          serviceName: payment.booking.service.name,
          providerName: payment.provider.user.name,
          reason,
          refundId: refund.id,
        },
      }),
      createNotification({
        userId: payment.provider.userId,
        type: NotificationType.PAYMENT_FAILED, // Reuse for refund notification
        data: {
          amount: refundAmount,
          serviceName: payment.booking.service.name,
          clientName: payment.client.user.name,
          reason,
          refundId: refund.id,
        },
      }),
    ]);

    return { payment: updatedPayment, refund };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

// Get payment details
export async function getPaymentDetails(paymentId: string, userId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        booking: { include: { service: true } },
        escrow: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check authorization
    const isClient = payment.client.userId === userId;
    const isProvider = payment.provider.userId === userId;
    
    if (!isClient && !isProvider) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { admin: true },
      });

      if (!user?.admin) {
        throw new Error('Unauthorized to view payment details');
      }
    }

    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

// Get user's payment history
export async function getUserPayments(
  userId: string,
  limit = 20,
  offset = 0,
  filters?: {
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const whereClause: any = {
      OR: [
        { clientId: userId },
        { providerId: userId },
      ],
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        booking: { include: { service: true } },
        escrow: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.payment.count({ where: whereClause });

    return {
      payments,
      totalCount,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
}

// Calculate platform fee
function calculatePlatformFee(amount: number): number {
  // Platform fee: 15% of service amount
  const platformFeePercentage = 0.15;
  return Math.round(amount * platformFeePercentage * 100) / 100;
}

// Calculate escrow release date
function calculateEscrowReleaseDate(serviceDate: Date): Date {
  // Release escrow 24 hours after service completion
  const releaseDate = new Date(serviceDate);
  releaseDate.setHours(releaseDate.getHours() + 24);
  return releaseDate;
}

// Get payment statistics
export async function getPaymentStatistics() {
  try {
    const [
      totalPayments,
      totalRevenue,
      pendingEscrow,
      completedPayments,
      failedPayments,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.escrow.aggregate({
        where: { status: EscrowStatus.HELD },
        _sum: { amount: true },
      }),
      prisma.payment.count({
        where: { status: PaymentStatus.COMPLETED },
      }),
      prisma.payment.count({
        where: { status: PaymentStatus.FAILED },
      }),
    ]);

    return {
      totalPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingEscrow: pendingEscrow._sum.amount || 0,
      completedPayments,
      failedPayments,
      successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
    };
  } catch (error) {
    console.error('Error calculating payment statistics:', error);
    throw error;
  }
}

// Handle payment webhooks from Stripe
export async function handleStripeWebhook(event: any) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await confirmPayment(event.data.object.id);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object.id);
        break;
      
      case 'transfer.created':
        await handleTransferSuccess(event.data.object.id);
        break;
      
      case 'transfer.failed':
        await handleTransferFailure(event.data.object.id);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw error;
  }
}

// Handle payment failure
async function handlePaymentFailure(paymentIntentId: string) {
  try {
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { status: PaymentStatus.FAILED },
      include: {
        client: { include: { user: true } },
        booking: { include: { service: true, provider: { include: { user: true } } } },
      },
    });

    // Send notification to client
    await createNotification({
      userId: payment.client.userId,
      type: NotificationType.PAYMENT_FAILED,
      data: {
        amount: payment.amount,
        providerName: payment.booking.provider.user.name,
        serviceName: payment.booking.service.name,
        date: payment.booking.scheduledDate.toLocaleDateString(),
        paymentId: payment.id,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'PAYMENT_FAILED' },
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle transfer success
async function handleTransferSuccess(transferId: string) {
  try {
    // Update escrow status if transfer was for escrow release
    const escrow = await prisma.escrow.findFirst({
      where: { stripeTransferId: transferId },
    });

    if (escrow) {
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: EscrowStatus.RELEASED },
      });
    }
  } catch (error) {
    console.error('Error handling transfer success:', error);
  }
}

// Handle transfer failure
async function handleTransferFailure(transferId: string) {
  try {
    // Handle failed transfer to provider
    const escrow = await prisma.escrow.findFirst({
      where: { stripeTransferId: transferId },
    });

    if (escrow) {
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: EscrowStatus.DISPUTED },
      });

      // TODO: Implement dispute resolution workflow
    }
  } catch (error) {
    console.error('Error handling transfer failure:', error);
  }
} 