import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiEngine } from '@/lib/ai-personalization'
import { z } from 'zod'

const preferencesSchema = z.object({
  skinType: z.string().optional(),
  hairType: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  skinTone: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  sensitivities: z.array(z.string()).optional(),
  preferredStyles: z.array(z.string()).optional(),
  budgetRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  locationRadius: z.number().optional(),
  timePreferences: z.object({
    morning: z.boolean(),
    afternoon: z.boolean(),
    evening: z.boolean()
  }).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await aiEngine.getClientProfile(session.user.id)

    return NextResponse.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    console.error('Error fetching client preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = preferencesSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    await aiEngine.updateClientPreferences(session.user.id, validationResult.data)

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating client preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
