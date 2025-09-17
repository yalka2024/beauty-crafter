import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { arTryOnManager } from '@/lib/ar-tryon'
import { z } from 'zod'

const createARSessionSchema = z.object({
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  sessionType: z.enum(['makeup', 'hair', 'nails']),
  arData: z.any().optional(),
  beforeImage: z.string().optional(),
  afterImage: z.string().optional(),
  isPublic: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createARSessionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid AR session data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const sessionId = await arTryOnManager.createARSession({
      userId: session.user.id,
      ...validationResult.data
    })

    return NextResponse.json({
      success: true,
      data: { sessionId },
      message: 'AR session created successfully'
    })
  } catch (error) {
    console.error('Error creating AR session:', error)
    return NextResponse.json(
      { error: 'Failed to create AR session' },
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
    const sessionType = searchParams.get('type')
    const publicOnly = searchParams.get('public') === 'true'

    let sessions

    if (publicOnly) {
      sessions = await arTryOnManager.getPublicARSessions(sessionType || undefined)
    } else {
      sessions = await arTryOnManager.getUserARSessions(session.user.id, sessionType || undefined)
    }

    return NextResponse.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('Error fetching AR sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AR sessions' },
      { status: 500 }
    )
  }
}
