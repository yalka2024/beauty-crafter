import { NextRequest, NextResponse } from 'next/server'

// Simplified health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: getMemoryUsage(),
      responseTime: Date.now() - startTime
    }
    
    const response = NextResponse.json(health, { status: 200 })
    
    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Health-Check', 'true')
    
    return response
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorResponse = NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: Date.now() - startTime
    }, { status: 503 })
    
    errorResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    errorResponse.headers.set('X-Health-Check', 'true')
    
    return errorResponse
  }
}

// Get memory usage statistics
function getMemoryUsage() {
  const usage = process.memoryUsage()
  
  return {
    used: Math.round(usage.heapUsed / 1024 / 1024), // MB
    total: Math.round(usage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024) // MB
  }
}