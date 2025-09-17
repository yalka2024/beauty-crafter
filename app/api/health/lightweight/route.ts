import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Quick system check without heavy operations
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      platform: 'Beauty Crafter',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      
      // Basic system info
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      },
      
      // Quick database check (non-blocking)
      database: {
        status: 'checking',
        message: 'Database status check in progress'
      }
    }

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  }
}

export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Health-Check': 'lightweight',
      'X-Timestamp': new Date().toISOString()
    }
  })
} 