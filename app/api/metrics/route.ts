import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring'
import { logger } from '@/lib/logging'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for metrics endpoint
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const startTime = Date.now()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const metricName = searchParams.get('name')
    const startTimeParam = searchParams.get('start')
    const endTimeParam = searchParams.get('end')
    const format = searchParams.get('format') || 'json'
    
    // Parse time range
    const timeRange = startTimeParam && endTimeParam ? {
      start: parseInt(startTimeParam),
      end: parseInt(endTimeParam)
    } : undefined
    
    // Collect metrics data
    const metricsData = await collectMetricsData(metricName, timeRange)
    
    // Record this request for monitoring
    const responseTime = Date.now() - startTime
    monitoring.recordResponseTime(responseTime, '/api/metrics')
    monitoring.recordRequest('GET', '/api/metrics', 200)
    
    // Return in requested format
    if (format === 'prometheus') {
      return new NextResponse(formatPrometheusMetrics(metricsData), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
    
    return NextResponse.json(metricsData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    const responseTime = Date.now() - Date.now()
    monitoring.recordResponseTime(responseTime, '/api/metrics')
    monitoring.recordRequest('GET', '/api/metrics', 500)
    monitoring.recordError(error as Error, 'metrics_endpoint')
    
    logger.error('Metrics endpoint failed:', error)
    
    return NextResponse.json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function collectMetricsData(metricName?: string | null, timeRange?: { start: number; end: number }) {
  // Get metrics from monitoring system
  const metrics = monitoring.getMetrics(metricName || undefined, timeRange)
  const performanceHistory = monitoring.getPerformanceHistory()
  const metricsSummary = monitoring.getMetricsSummary()
  
  // System information
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  }
  
  // Application-specific metrics
  const appMetrics = {
    version: '1.0.0',
    platform: 'Beauty Crafter',
    owner: 'Kryst Investments LLC',
    timestamp: new Date().toISOString()
  }
  
  // Process metrics
  const processMetrics = {
    pid: process.pid,
    title: process.title,
    argv: process.argv,
    execPath: process.execPath,
    cwd: process.cwd()
  }
  
  // Environment variables (filtered for security)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PLATFORM: process.env.PLATFORM,
    REGION: process.env.AWS_REGION || process.env.VERCEL_REGION,
    DEPLOYMENT: process.env.VERCEL_ENV || process.env.NODE_ENV
  }
  
  return {
    app: appMetrics,
    system: systemInfo,
    process: processMetrics,
    environment: envVars,
    metrics: {
      raw: metrics,
      summary: metricsSummary,
      performance: performanceHistory
    },
    collection: {
      timestamp: new Date().toISOString(),
      totalMetrics: metrics.length,
      timeRange: timeRange || 'all',
      filteredBy: metricName || 'none'
    }
  }
}

function formatPrometheusMetrics(metricsData: any): string {
  let prometheusOutput = '' // (may be reassigned, left as let)
  
  // Add application info
  prometheusOutput += `# HELP beauty_crafter_app_info Application information\n`
  prometheusOutput += `# TYPE beauty_crafter_app_info gauge\n`
  prometheusOutput += `beauty_crafter_app_info{version="${metricsData.app.version}",platform="${metricsData.app.platform}",owner="${metricsData.app.owner}"} 1\n`
  
  // Add system metrics
  prometheusOutput += `# HELP beauty_crafter_system_uptime System uptime in seconds\n`
  prometheusOutput += `# TYPE beauty_crafter_system_uptime gauge\n`
  prometheusOutput += `beauty_crafter_system_uptime ${metricsData.system.uptime}\n`
  
  // Add memory metrics
  prometheusOutput += `# HELP beauty_crafter_memory_heap_used_bytes Heap memory used in bytes\n`
  prometheusOutput += `# TYPE beauty_crafter_memory_heap_used_bytes gauge\n`
  prometheusOutput += `beauty_crafter_memory_heap_used_bytes ${metricsData.system.memory.heapUsed}\n`
  
  prometheusOutput += `# HELP beauty_crafter_memory_heap_total_bytes Total heap memory in bytes\n`
  prometheusOutput += `# TYPE beauty_crafter_memory_heap_total_bytes gauge\n`
  prometheusOutput += `beauty_crafter_memory_heap_total_bytes ${metricsData.system.memory.heapTotal}\n`
  
  // Add custom metrics
  for (const [metricName, stats] of Object.entries(metricsData.metrics.summary)) {
    const { count, avg, min, max } = stats as any
    
    prometheusOutput += `# HELP beauty_crafter_${metricName}_count Total count of ${metricName} metrics\n`
    prometheusOutput += `# TYPE beauty_crafter_${metricName}_count counter\n`
    prometheusOutput += `beauty_crafter_${metricName}_count ${count}\n`
    
    prometheusOutput += `# HELP beauty_crafter_${metricName}_average Average value of ${metricName} metrics\n`
    prometheusOutput += `# TYPE beauty_crafter_${metricName}_average gauge\n`
    prometheusOutput += `beauty_crafter_${metricName}_average ${avg}\n`
    
    prometheusOutput += `# HELP beauty_crafter_${metricName}_min Minimum value of ${metricName} metrics\n`
    prometheusOutput += `# TYPE beauty_crafter_${metricName}_min gauge\n`
    prometheusOutput += `beauty_crafter_${metricName}_min ${min}\n`
    
    prometheusOutput += `# HELP beauty_crafter_${metricName}_max Maximum value of ${metricName} metrics\n`
    prometheusOutput += `# TYPE beauty_crafter_${metricName}_max gauge\n`
    prometheusOutput += `beauty_crafter_${metricName}_max ${max}\n`
  }
  
  return prometheusOutput
}

// Metrics endpoint for load balancers
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
