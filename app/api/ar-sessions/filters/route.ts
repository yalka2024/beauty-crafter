import { NextRequest, NextResponse } from 'next/server'
import { arTryOnManager } from '@/lib/ar-tryon'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionType = searchParams.get('type')

    if (!sessionType) {
      return NextResponse.json(
        { error: 'Session type is required' },
        { status: 400 }
      )
    }

    const filters = arTryOnManager.getAvailableFilters(sessionType)

    return NextResponse.json({
      success: true,
      data: filters
    })
  } catch (error) {
    console.error('Error fetching AR filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AR filters' },
      { status: 500 }
    )
  }
}
