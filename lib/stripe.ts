import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
})

export const createPaymentIntent = async ({
  amount,
  currency = "usd",
  metadata = {},
}: {
  amount: number
  currency?: string
  metadata?: Record<string, string>
}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return paymentIntent
  } catch (error) {
    console.error("Error creating payment intent:", error)
    throw error
  }
}

export const createCustomer = async ({
  email,
  name,
  phone,
  metadata = {},
}: {
  email: string
  name: string
  phone?: string
  metadata?: Record<string, string>
}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata,
    })

    return customer
  } catch (error) {
    console.error("Error creating customer:", error)
    throw error
  }
}

export const createRefund = async ({
  paymentIntentId,
  amount,
  reason = "requested_by_customer",
}: {
  paymentIntentId: string
  amount?: number
  reason?: Stripe.RefundCreateParams.Reason
}) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    })

    return refund
  } catch (error) {
    console.error("Error creating refund:", error)
    throw error
  }
}

export const calculatePlatformFee = (amount: number) => {
  const commissionRate = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_COMMISSION_RATE || "0.15")
  const processingFeeRate = parseFloat(process.env.NEXT_PUBLIC_STRIPE_PROCESSING_FEE_RATE || "0.029")
  const processingFeeAmount = parseFloat(process.env.NEXT_PUBLIC_STRIPE_PROCESSING_FEE_AMOUNT || "0.30")
  
  const commission = amount * commissionRate
  const processingFee = (amount * processingFeeRate) + processingFeeAmount
  
  return {
    commission: Math.round(commission * 100), // Convert to cents
    processingFee: Math.round(processingFee * 100), // Convert to cents
    providerAmount: amount * 100 - Math.round(commission * 100) - Math.round(processingFee * 100)
  }
}

export const createTransfer = async ({
  amount,
  destination,
  metadata = {},
}: {
  amount: number
  destination: string
  metadata?: Record<string, string>
}) => {
  try {
    const transfer = await stripe.transfers.create({
      amount,
      currency: "usd",
      destination,
      metadata,
    })

    return transfer
  } catch (error) {
    console.error("Error creating transfer:", error)
    throw error
  }
}

export const getPaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error("Error retrieving payment intent:", error)
    throw error
  }
}

export const confirmPaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error("Error confirming payment intent:", error)
    throw error
  }
}

export const cancelPaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error("Error canceling payment intent:", error)
    throw error
  }
} 