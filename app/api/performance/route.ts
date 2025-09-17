import { NextRequest, NextResponse } from 'next/server'
import { performanceCore } from '@/lib/performance-core'

export async function GET(request: NextRequest) {
  try {
    const health = performanceCore.healthCheck()
    const metrics = performanceCore.getMetrics()
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      performance: {
        health,
        metrics,
        recommendations: getPerformanceRecommendations(metrics)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    )
  }
}

function getPerformanceRecommendations(metrics: any): string[] {
  const recommendations: string[] = []
  
  if (metrics.totalRequests > 1000) {
    recommendations.push('Consider implementing caching for high-traffic endpoints')
  }
  
  if (metrics.totalEndpoints > 50) {
    recommendations.push('Consider API versioning for better maintainability')
  }
  
  recommendations.push('Monitor response times and implement alerts for slow endpoints')
  recommendations.push('Consider implementing rate limiting for API protection')
  
  return recommendations
}
