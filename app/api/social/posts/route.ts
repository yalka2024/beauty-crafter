import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { socialIntegrationManager } from '@/lib/social-integration'
import { z } from 'zod'

const createPostSchema = z.object({
  providerId: z.string().optional(),
  bookingId: z.string().optional(),
  platform: z.enum(['instagram', 'tiktok', 'facebook', 'twitter']),
  content: z.string(),
  mediaUrls: z.array(z.string()),
  hashtags: z.array(z.string()),
  isPublished: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createPostSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid post data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const postId = await socialIntegrationManager.createSocialPost({
      userId: session.user.id,
      ...validationResult.data
    })

    return NextResponse.json({
      success: true,
      data: { postId },
      message: 'Social post created successfully'
    })
  } catch (error) {
    console.error('Error creating social post:', error)
    return NextResponse.json(
      { error: 'Failed to create social post' },
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
    const platform = searchParams.get('platform')
    const publicOnly = searchParams.get('public') === 'true'

    let posts

    if (publicOnly) {
      posts = await socialIntegrationManager.getPublicSocialPosts(platform || undefined)
    } else {
      posts = await socialIntegrationManager.getUserSocialPosts(session.user.id, platform || undefined)
    }

    return NextResponse.json({
      success: true,
      data: posts
    })
  } catch (error) {
    console.error('Error getting social posts:', error)
    return NextResponse.json(
      { error: 'Failed to get social posts' },
      { status: 500 }
    )
  }
}
