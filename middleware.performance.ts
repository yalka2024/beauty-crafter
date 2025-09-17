import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'

// Performance monitoring middleware
export function performanceMiddleware(request: NextRequest) {
  const startTime = performance.now()
  const url = new URL(request.url)
  
  // Skip performance monitoring for static assets
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/favicon.ico') ||
      url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    return NextResponse.next()
  }
  
  // Add performance headers
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add performance hints
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // Log performance metrics
  const endTime = performance.now()
  const responseTime = endTime - startTime
  
  response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`)
  
  // Log slow requests
  if (responseTime > 1000) {
    console.warn(`Slow request: ${request.method} ${url.pathname} - ${responseTime.toFixed(2)}ms`)
  }
  
  return response
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100 // 100 requests per minute
  
  const key = `rate_limit:${ip}`
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return NextResponse.next()
  }
  
  if (current.count >= maxRequests) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
      }
    })
  }
  
  current.count++
  return NextResponse.next()
}

// Main middleware function
export function middleware(request: NextRequest) {
  // Apply rate limiting first
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }
  
  // Apply performance monitoring
  return performanceMiddleware(request)
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
