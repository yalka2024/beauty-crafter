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

    const metrics = await analyticsDashboardManager.getRealTimeMetrics()

    return NextResponse.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Error getting real-time metrics:', error)
    return NextResponse.json(
      { error: 'Failed to get real-time metrics' },
      { status: 500 }
    )
  }
}
