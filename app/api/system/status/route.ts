import { NextRequest, NextResponse } from 'next/server'
import { systemInitializer } from '@/lib/system-initializer'
import { logger } from '@/lib/logging'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get comprehensive system status
    const systemStatus = systemInitializer.getSystemStatus()
    
    // Collect component details
    const componentDetails = Array.from(systemStatus.components).map(component => ({
      name: component.name,
      phase: component.phase,
      status: component.status,
      error: component.error,
      startTime: component.startTime?.toISOString(),
      endTime: component.endTime?.toISOString(),
      duration: component.duration
    }))

    // System information
    const systemInfo = {
      platform: 'Beauty Crafter Enterprise Platform',
      version: '1.0.0',
      owner: 'Kryst Investments LLC',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      
      // System status
      status: {
        phase: systemStatus.phase,
        isInitializing: systemStatus.isInitializing,
        isReady: systemInitializer.isSystemReady(),
        readyComponents: systemStatus.readyComponents,
        totalComponents: systemStatus.totalComponents,
        readinessPercentage: systemStatus.totalComponents > 0 
          ? Math.round((systemStatus.readyComponents / systemStatus.totalComponents) * 100)
          : 0
      },
      
      // Component details
      components: componentDetails,
      
      // System resources
      resources: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        cpu: {
          user: Math.round(process.cpuUsage().user / 1000),
          system: Math.round(process.cpuUsage().system / 1000)
        },
        platform: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        }
      },
      
      // Environment variables (filtered for security)
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '3000',
        databaseUrl: process.env.DATABASE_URL ? '***configured***' : 'not configured',
        redisUrl: process.env.REDIS_URL ? '***configured***' : 'not configured',
        openaiKey: process.env.OPENAI_SECRET_KEY ? '***configured***' : 'not configured'
      }
    }

    // Add response headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Response-Time': `${Date.now() - startTime}ms`,
      'X-System-Phase': systemStatus.phase,
      'X-System-Ready': systemInitializer.isSystemReady().toString()
    }

    return NextResponse.json(systemInfo, { 
      status: 200,
      headers
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    logger.error('System status check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      platform: 'Beauty Crafter Enterprise Platform',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      }
    })
  }
}

export async function HEAD() {
  const systemStatus = systemInitializer.getSystemStatus()
  
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-System-Phase': systemStatus.phase,
      'X-System-Ready': systemInitializer.isSystemReady().toString(),
      'X-Timestamp': new Date().toISOString()
    }
  })
} 