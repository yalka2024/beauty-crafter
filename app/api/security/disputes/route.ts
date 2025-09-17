import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { antiScamSecurityManager } from '@/lib/anti-scam-security'
import { z } from 'zod'

const createDisputeSchema = z.object({
  bookingId: z.string(),
  type: z.enum(['payment', 'service', 'cancellation', 'no_show']),
  reason: z.string(),
  description: z.string(),
  evidence: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createDisputeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid dispute data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Get booking details to verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: validationResult.data.bookingId },
      include: {
        client: true,
        provider: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user is authorized to create dispute
    const isAuthorized = booking.client.userId === session.user.id || 
                        booking.provider.userId === session.user.id

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const disputeId = await antiScamSecurityManager.createDispute({
      bookingId: validationResult.data.bookingId,
      clientId: booking.client.userId,
      providerId: booking.provider.userId,
      type: validationResult.data.type,
      reason: validationResult.data.reason,
      description: validationResult.data.description,
      evidence: validationResult.data.evidence
    })

    return NextResponse.json({
      success: true,
      data: { disputeId },
      message: 'Dispute created successfully'
    })
  } catch (error) {
    console.error('Error creating dispute:', error)
    return NextResponse.json(
      { error: 'Failed to create dispute' },
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
    const role = searchParams.get('role') as 'client' | 'provider' || 'client'

    const disputes = await antiScamSecurityManager.getUserDisputes(session.user.id, role)

    return NextResponse.json({
      success: true,
      data: disputes
    })
  } catch (error) {
    console.error('Error getting disputes:', error)
    return NextResponse.json(
      { error: 'Failed to get disputes' },
      { status: 500 }
    )
  }
}
