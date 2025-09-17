import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { virtualConsultationManager } from '@/lib/virtual-consultations'
import { z } from 'zod'

const createConsultationSchema = z.object({
  clientId: z.string(),
  providerId: z.string(),
  serviceId: z.string().optional(),
  scheduledDate: z.string().transform(str => new Date(str)),
  duration: z.number().min(15).max(120), // 15 minutes to 2 hours
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createConsultationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid consultation data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const consultationId = await virtualConsultationManager.createConsultation(validationResult.data)

    return NextResponse.json({
      success: true,
      data: { consultationId },
      message: 'Virtual consultation created successfully'
    })
  } catch (error) {
    console.error('Error creating virtual consultation:', error)
    return NextResponse.json(
      { error: 'Failed to create virtual consultation' },
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

    const consultations = await virtualConsultationManager.getUserConsultations(session.user.id, role)

    return NextResponse.json({
      success: true,
      data: consultations
    })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    )
  }
}
