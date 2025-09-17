import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { multiLocationManager } from '@/lib/multi-location-manager'
import { z } from 'zod'

const addStaffSchema = z.object({
  userId: z.string(),
  role: z.enum(['manager', 'stylist', 'assistant', 'receptionist']),
  permissions: z.array(z.string()).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = addStaffSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid staff data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { userId, role, permissions } = validationResult.data

    // Get default permissions if not provided
    const defaultPermissions = permissions || multiLocationManager.getDefaultPermissions(role)

    const staffId = await multiLocationManager.addStaffMember({
      locationId: params.id,
      userId,
      role,
      permissions: defaultPermissions
    })

    return NextResponse.json({
      success: true,
      data: { staffId },
      message: 'Staff member added successfully'
    })
  } catch (error) {
    console.error('Error adding staff member:', error)
    return NextResponse.json(
      { error: 'Failed to add staff member' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await multiLocationManager.getLocationStaff(params.id)

    return NextResponse.json({
      success: true,
      data: staff
    })
  } catch (error) {
    console.error('Error getting location staff:', error)
    return NextResponse.json(
      { error: 'Failed to get location staff' },
      { status: 500 }
    )
  }
}
