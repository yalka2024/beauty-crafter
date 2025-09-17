import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { antiScamSecurityManager } from '@/lib/anti-scam-security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('isResolved') === 'true' ? true : 
                      searchParams.get('isResolved') === 'false' ? false : undefined

    const alerts = await antiScamSecurityManager.getFraudAlerts(severity || undefined, isResolved)

    return NextResponse.json({
      success: true,
      data: alerts
    })
  } catch (error) {
    console.error('Error getting fraud alerts:', error)
    return NextResponse.json(
      { error: 'Failed to get fraud alerts' },
      { status: 500 }
    )
  }
}
