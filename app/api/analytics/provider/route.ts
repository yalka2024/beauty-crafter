import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyticsDashboardManager } from '@/lib/analytics-dashboard'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get provider ID from user
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined

    const analytics = await analyticsDashboardManager.getProviderAnalytics(provider.id, dateRange)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Error getting provider analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get provider analytics' },
      { status: 500 }
    )
  }
}
