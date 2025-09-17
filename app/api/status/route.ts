import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const response = NextResponse.json({
      status: 'ok',
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime
    })
    
    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-API-Status', 'healthy')
    
    return response
  } catch (error) {
    console.error('API Status Error:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'API error occurred',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      status: 'ok',
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Invalid JSON in POST request',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }
}
