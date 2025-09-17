import { NextRequest, NextResponse } from 'next/server'
import { cacheManager } from '@/lib/cache-manager'

// Performance-optimized API route
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const url = new URL(request.url)
  const cacheKey = `performance_${url.pathname}_${url.search}`
  
  try {
    // Check cache first
    const cached = cacheManager.get(cacheKey)
    if (cached) {
      const response = NextResponse.json(cached)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
      return response
    }

    // Generate response data
    const data = {
      status: 'ok',
      message: 'Performance optimized API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      performance: {
        memory: getMemoryUsage(),
        cpu: getCpuUsage(),
        responseTime: Date.now() - startTime
      },
      cache: cacheManager.getStats()
    }

    // Cache the response for 5 minutes
    cacheManager.set(cacheKey, data, 300000)

    const response = NextResponse.json(data)
    
    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    response.headers.set('X-API-Version', '1.0.0')
    
    return response
    
  } catch (error) {
    console.error('Performance API Error:', error)
    
    const errorResponse = NextResponse.json({
      status: 'error',
      message: 'Performance API error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
    
    errorResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
    return errorResponse
  }
}

// Get memory usage
function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    used: Math.round(usage.heapUsed / 1024 / 1024), // MB
    total: Math.round(usage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024) // MB
  }
}

// Get CPU usage
function getCpuUsage() {
  const cpus = require('os').cpus()
  const loadAvg = require('os').loadavg()
  
  return {
    cores: cpus.length,
    loadAverage: loadAvg[0],
    usage: Math.min(100, Math.round(loadAvg[0] * 100 / cpus.length))
  }
}
