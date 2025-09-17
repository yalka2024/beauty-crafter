import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionSystemManager } from '@/lib/subscription-system'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'cancel') {
      const cancelAtPeriodEnd = body.cancelAtPeriodEnd !== false
      await subscriptionSystemManager.cancelSubscription(session.user.id, cancelAtPeriodEnd)

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully'
      })
    }

    if (action === 'reactivate') {
      await subscriptionSystemManager.reactivateSubscription(session.user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription reactivated successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
