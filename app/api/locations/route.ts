import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { multiLocationManager } from '@/lib/multi-location-manager'
import { z } from 'zod'

const createLocationSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isPrimary: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get provider ID
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = createLocationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid location data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const locationId = await multiLocationManager.createBusinessLocation({
      providerId: provider.id,
      ...validationResult.data
    })

    return NextResponse.json({
      success: true,
      data: { locationId },
      message: 'Business location created successfully'
    })
  } catch (error) {
    console.error('Error creating business location:', error)
    return NextResponse.json(
      { error: 'Failed to create business location' },
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

    // Get provider ID
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const locations = await multiLocationManager.getProviderLocations(provider.id)

    return NextResponse.json({
      success: true,
      data: locations
    })
  } catch (error) {
    console.error('Error getting business locations:', error)
    return NextResponse.json(
      { error: 'Failed to get business locations' },
      { status: 500 }
    )
  }
}
