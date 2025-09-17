import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { virtualConsultationManager } from '@/lib/virtual-consultations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consultation = await virtualConsultationManager.getConsultation(params.id)

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    // Check if user is authorized to view this consultation
    const isAuthorized = consultation.client.userId === session.user.id || 
                        consultation.provider.userId === session.user.id

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: consultation
    })
  } catch (error) {
    console.error('Error fetching consultation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consultation' },
      { status: 500 }
    )
  }
}

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
    const { action, notes } = body

    if (!action || !['start', 'end', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'start':
        const roomData = await virtualConsultationManager.startConsultation(params.id)
        return NextResponse.json({
          success: true,
          data: roomData,
          message: 'Consultation started successfully'
        })

      case 'end':
        await virtualConsultationManager.endConsultation(params.id, notes)
        return NextResponse.json({
          success: true,
          message: 'Consultation ended successfully'
        })

      case 'cancel':
        await virtualConsultationManager.cancelConsultation(params.id, notes)
        return NextResponse.json({
          success: true,
          message: 'Consultation cancelled successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating consultation:', error)
    return NextResponse.json(
      { error: 'Failed to update consultation' },
      { status: 500 }
    )
  }
}
