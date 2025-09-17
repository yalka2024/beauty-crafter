import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { loyaltySystemManager } from '@/lib/loyalty-system'
import { z } from 'zod'

const earnPointsSchema = z.object({
  source: z.string(),
  sourceId: z.string().optional(),
  amount: z.number().optional(),
  description: z.string().optional()
})

const redeemPointsSchema = z.object({
  points: z.number().min(1),
  description: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'earn') {
      const validationResult = earnPointsSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid earn points data', details: validationResult.error.errors },
          { status: 400 }
        )
      }

      await loyaltySystemManager.earnPoints(
        session.user.id,
        validationResult.data.source,
        validationResult.data.sourceId,
        validationResult.data.amount,
        validationResult.data.description
      )

      return NextResponse.json({
        success: true,
        message: 'Points earned successfully'
      })
    }

    if (action === 'redeem') {
      const validationResult = redeemPointsSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid redeem points data', details: validationResult.error.errors },
          { status: 400 }
        )
      }

      const success = await loyaltySystemManager.redeemPoints(
        session.user.id,
        validationResult.data.points,
        validationResult.data.description
      )

      if (!success) {
        return NextResponse.json(
          { error: 'Insufficient points' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Points redeemed successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to process loyalty points' },
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

    if (type === 'history') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const history = await loyaltySystemManager.getUserTransactionHistory(session.user.id, limit)
      
      return NextResponse.json({
        success: true,
        data: history
      })
    }

    // Get user's current points and tier
    const userTier = await loyaltySystemManager.getUserLoyaltyTier(session.user.id)
    const points = await loyaltySystemManager.getUserPoints(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        points,
        tier: userTier?.tier,
        currentTier: userTier
      }
    })
  } catch (error) {
    console.error('Error getting loyalty data:', error)
    return NextResponse.json(
      { error: 'Failed to get loyalty data' },
      { status: 500 }
    )
  }
}
