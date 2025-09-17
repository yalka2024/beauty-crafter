import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { socialIntegrationManager } from '@/lib/social-integration'
import { z } from 'zod'

const registerInfluencerSchema = z.object({
  platform: z.string(),
  handle: z.string(),
  followers: z.number(),
  engagementRate: z.number(),
  categories: z.array(z.string()),
  isVerified: z.boolean().optional(),
  commissionRate: z.number().optional()
})

const searchInfluencersSchema = z.object({
  platform: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),
  minEngagementRate: z.number().optional(),
  isVerified: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = registerInfluencerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid influencer data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const influencerId = await socialIntegrationManager.registerInfluencer({
      userId: session.user.id,
      ...validationResult.data
    })

    return NextResponse.json({
      success: true,
      data: { influencerId },
      message: 'Influencer registration successful'
    })
  } catch (error) {
    console.error('Error registering influencer:', error)
    return NextResponse.json(
      { error: 'Failed to register as influencer' },
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
    const action = searchParams.get('action')

    if (action === 'profile') {
      const profile = await socialIntegrationManager.getInfluencerProfile(session.user.id)
      return NextResponse.json({
        success: true,
        data: profile
      })
    }

    if (action === 'search') {
      const filters = {
        platform: searchParams.get('platform') || undefined,
        categories: searchParams.get('categories')?.split(',') || undefined,
        minFollowers: searchParams.get('minFollowers') ? parseInt(searchParams.get('minFollowers')!) : undefined,
        maxFollowers: searchParams.get('maxFollowers') ? parseInt(searchParams.get('maxFollowers')!) : undefined,
        minEngagementRate: searchParams.get('minEngagementRate') ? parseFloat(searchParams.get('minEngagementRate')!) : undefined,
        isVerified: searchParams.get('isVerified') === 'true' ? true : searchParams.get('isVerified') === 'false' ? false : undefined
      }

      const influencers = await socialIntegrationManager.searchInfluencers(filters)
      return NextResponse.json({
        success: true,
        data: influencers
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error getting influencers:', error)
    return NextResponse.json(
      { error: 'Failed to get influencers' },
      { status: 500 }
    )
  }
}
