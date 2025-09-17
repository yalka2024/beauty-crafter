import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiEngine } from '@/lib/ai-personalization'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'service' | 'provider' | 'product' || 'service'
    const limit = parseInt(searchParams.get('limit') || '10')

    let recommendations = []

    switch (type) {
      case 'service':
        recommendations = await aiEngine.generateServiceRecommendations(session.user.id, limit)
        break
      case 'provider':
        recommendations = await aiEngine.generateProviderRecommendations(session.user.id, limit)
        break
      case 'product':
        // Product recommendations would be implemented separately
        recommendations = []
        break
      default:
        return NextResponse.json({ error: 'Invalid recommendation type' }, { status: 400 })
    }

    // Save recommendations to database
    if (recommendations.length > 0) {
      await aiEngine.saveRecommendations(session.user.id, recommendations, type)
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      type,
      count: recommendations.length
    })
  } catch (error) {
    console.error('Error fetching AI recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
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
    const { action, recommendationId } = body

    if (!action || !recommendationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['viewed', 'acted_upon'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await aiEngine.trackRecommendationInteraction(recommendationId, action)

    return NextResponse.json({
      success: true,
      message: 'Recommendation interaction tracked'
    })
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error)
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    )
  }
}
