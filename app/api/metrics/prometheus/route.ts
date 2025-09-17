import { NextRequest, NextResponse } from 'next/server'
import { prometheusExporter } from '@/lib/prometheus-exporter'
import { securityMiddleware } from '@/lib/security-middleware'
import { logger } from '@/lib/logging'
import { monitoring } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check (lightweight for metrics endpoint)
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      monitoring.recordMetric('prometheus_metrics_blocked', 1, { 
        reason: securityResult.blocked ? 'security_threat' : 'security_error' 
      })
      
      return new NextResponse('Request blocked for security reasons', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Blocked-Reason': 'security_threat'
        }
      })
    }

    // Export Prometheus metrics
    const metrics = prometheusExporter.exportPrometheusMetrics()
    
    // Add response time metric
    const responseTime = Date.now() - startTime
    const responseTimeMetric = `# HELP beauty_crafter_prometheus_export_duration_seconds Duration of Prometheus metrics export\n`
      + `# TYPE beauty_crafter_prometheus_export_duration_seconds gauge\n`
      + `beauty_crafter_prometheus_export_duration_seconds ${responseTime / 1000}\n\n`

    const fullMetrics = responseTimeMetric + metrics

    // Record successful export
    monitoring.recordMetric('prometheus_metrics_exported', 1, { 
      responseTime: responseTime.toString(),
      metricCount: prometheusExporter.getMetricsSummary().totalMetrics.toString()
    })

    logger.debug('Prometheus metrics exported successfully', {
      responseTime: `${responseTime}ms`,
      metricCount: prometheusExporter.getMetricsSummary().totalMetrics,
      platform: 'Beauty Crafter'
    })

    // Return metrics with appropriate headers
    return new NextResponse(fullMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${responseTime}ms`,
        'X-Metrics-Count': prometheusExporter.getMetricsSummary().totalMetrics.toString(),
        'X-Last-Export': prometheusExporter.getMetricsSummary().lastExport.toISOString()
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    monitoring.recordError(error as Error, 'prometheus_metrics_export')
    logger.error('Failed to export Prometheus metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      platform: 'Beauty Crafter'
    })

    return new NextResponse('Failed to export metrics', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'X-Response-Time': `${responseTime}ms`
      }
    })
  }
}

export async function HEAD() {
  const summary = prometheusExporter.getMetricsSummary()
  
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Metrics-Count': summary.totalMetrics.toString(),
      'X-Last-Export': summary.lastExport.toISOString(),
      'X-Metric-Types': Object.keys(summary.metricTypes).join(','),
      'X-Categories': Object.keys(summary.categories).join(',')
    }
  })
} 