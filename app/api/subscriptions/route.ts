import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionSystemManager } from '@/lib/subscription-system'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  tierId: z.string(),
  paymentMethodId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { subscriptionId, clientSecret } = await subscriptionSystemManager.createStripeSubscription(
      session.user.id,
      validationResult.data.tierId,
      validationResult.data.paymentMethodId
    )

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId,
        clientSecret
      },
      message: 'Subscription created successfully'
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'tiers') {
      const tiers = await subscriptionSystemManager.getSubscriptionTiers()
      return NextResponse.json({
        success: true,
        data: tiers
      })
    }

    if (type === 'analytics') {
      const analytics = await subscriptionSystemManager.getSubscriptionAnalytics()
      return NextResponse.json({
        success: true,
        data: analytics
      })
    }

    // Get user's subscription
    const subscription = await subscriptionSystemManager.getUserSubscription(session.user.id)

    return NextResponse.json({
      success: true,
      data: subscription
    })
  } catch (error) {
    console.error('Error getting subscription data:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription data' },
      { status: 500 }
    )
  }
}