import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Simple test endpoint
    const response = NextResponse.json({
      status: 'ok',
      message: 'API is working',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    })
    
    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('Cache-Control', 'no-cache')
    
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Test API failed', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
