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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined

    const report = await antiScamSecurityManager.generateSecurityReport(dateRange)

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error generating security report:', error)
    return NextResponse.json(
      { error: 'Failed to generate security report' },
      { status: 500 }
    )
  }
}
