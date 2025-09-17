import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'

// Core performance optimization utilities
export class PerformanceCore {
  private static instance: PerformanceCore
  private metrics: Map<string, any> = new Map()
  private requestCounts: Map<string, number> = new Map()

  private constructor() {
    this.startMetricsCollection()
  }

  public static getInstance(): PerformanceCore {
    if (!PerformanceCore.instance) {
      PerformanceCore.instance = new PerformanceCore()
    }
    return PerformanceCore.instance
  }

  // Request performance middleware
  public async optimizeRequest(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = performance.now()
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    try {
      const response = await handler(request)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      this.recordMetrics(path, method, responseTime, response.status)
      this.addPerformanceHeaders(response, responseTime)
      
      return response
    } catch (error) {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      console.error(`Performance Error [${method}:${path}]:`, error)
      return this.createErrorResponse(error, responseTime)
    }
  }

  // Record performance metrics
  private recordMetrics(path: string, method: string, responseTime: number, status: number): void {
    const key = `${method}:${path}`
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)
    
    this.metrics.set(key, {
      count: this.requestCounts.get(key),
      lastResponseTime: responseTime,
      status,
      timestamp: new Date().toISOString()
    })
  }

  // Add performance headers
  private addPerformanceHeaders(response: NextResponse, responseTime: number): void {
    response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    if (responseTime < 100) {
      response.headers.set('Cache-Control', 'public, max-age=300')
    } else if (responseTime < 500) {
      response.headers.set('Cache-Control', 'public, max-age=60')
    } else {
      response.headers.set('Cache-Control', 'no-cache')
    }
  }

  // Create error response
  private createErrorResponse(error: any, responseTime: number): NextResponse {
    const status = error.status || 500
    const message = status >= 500 ? 'Internal Server Error' : error.message || 'Bad Request'
    
    const response = NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status }
    )
    
    this.addPerformanceHeaders(response, responseTime)
    return response
  }

  // Get performance metrics
  public getMetrics(): any {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0)
    
    return {
      totalRequests,
      totalEndpoints: this.metrics.size,
      endpoints: Object.fromEntries(this.metrics.entries())
    }
  }

  // Health check
  public healthCheck(): any {
    const metrics = this.getMetrics()
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics,
      uptime: process.uptime()
    }
  }

  // Start metrics collection
  private startMetricsCollection(): void {
    setInterval(() => {
      this.cleanupMetrics()
    }, 60 * 60 * 1000) // Cleanup every hour
  }

  // Cleanup old metrics
  private cleanupMetrics(): void {
    // Keep only last 1000 entries per endpoint
    if (this.metrics.size > 1000) {
      const entries = Array.from(this.metrics.entries())
      this.metrics.clear()
      entries.slice(-1000).forEach(([key, value]) => {
        this.metrics.set(key, value)
      })
    }
  }
}

// Export singleton instance
export const performanceCore = PerformanceCore.getInstance()

// Performance middleware factory
export function withPerformance(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    return performanceCore.optimizeRequest(req, handler)
  }
}
