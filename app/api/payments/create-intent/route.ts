import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPaymentIntent, calculatePlatformFee } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

const createPaymentIntentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().min(1, "Amount must be at least $1"),
  currency: z.string().default("usd"),
  metadata: z.record(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPaymentIntentSchema.parse(body)

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        service: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Verify user owns the booking or is the provider
    if (booking.client.user.id !== session.user.id && 
        booking.provider.user.id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this booking" },
        { status: 403 }
      )
    }

    // Calculate fees
    const fees = calculatePlatformFee(validatedData.amount)
    const totalAmount = validatedData.amount * 100 // Convert to cents

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: totalAmount,
      currency: validatedData.currency,
      metadata: {
        bookingId: validatedData.bookingId,
        clientId: booking.clientId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        amount: validatedData.amount.toString(),
        commission: (fees.commission / 100).toString(),
        processingFee: (fees.processingFee / 100).toString(),
        providerAmount: (fees.providerAmount / 100).toString(),
        ...validatedData.metadata
      }
    })

    // Update booking with payment intent
    await prisma.booking.update({
      where: { id: validatedData.bookingId },
      data: {
        totalAmount: validatedData.amount,
        commission: fees.commission / 100
      }
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: validatedData.bookingId,
        clientId: booking.clientId,
        providerId: booking.providerId,
        amount: validatedData.amount,
        currency: validatedData.currency.toUpperCase(),
        status: "PENDING",
        stripePaymentId: paymentIntent.id,
        commission: fees.commission / 100,
        providerAmount: fees.providerAmount / 100
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: validatedData.currency,
      fees: {
        commission: fees.commission / 100,
        processingFee: fees.processingFee / 100,
        providerAmount: fees.providerAmount / 100
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Payment intent creation error:", error)
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
} 