const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Performance monitoring
const { performance } = require('perf_hooks')
const requestMetrics = new Map()

// Start the server
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const startTime = performance.now()
    const parsedUrl = parse(req.url, true)
    
    try {
      // Add performance headers
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      // Add security headers
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';")
      
      // Handle the request
      await handle(req, res, parsedUrl)
      
      // Record performance metrics
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      // Log slow requests
      if (responseTime > 1000) {
        console.warn(`Slow request: ${req.method} ${req.url} - ${responseTime.toFixed(2)}ms`)
      }
      
      // Record metrics
      const key = `${req.method}:${parsedUrl.pathname}`
      if (!requestMetrics.has(key)) {
        requestMetrics.set(key, { count: 0, totalTime: 0, maxTime: 0 })
      }
      
      const metrics = requestMetrics.get(key)
      metrics.count++
      metrics.totalTime += responseTime
      metrics.maxTime = Math.max(metrics.maxTime, responseTime)
      
    } catch (err) {
      console.error('Server error:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
    
    server.close(() => {
      console.log('✅ Server closed successfully')
      process.exit(0)
    })
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.log('⚠️  Force closing server...')
      process.exit(1)
    }, 30000)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Start listening
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV}`)
    console.log(`🔧 Dev mode: ${dev}`)
  })

  // Performance monitoring
  setInterval(() => {
    if (requestMetrics.size > 0) {
      console.log('📊 Request Metrics:')
      for (const [endpoint, metrics] of requestMetrics.entries()) {
        const avgTime = metrics.totalTime / metrics.count
        console.log(`  ${endpoint}: ${metrics.count} requests, avg: ${avgTime.toFixed(2)}ms, max: ${metrics.maxTime.toFixed(2)}ms`)
      }
    }
  }, 60000) // Log every minute

}).catch((ex) => {
  console.error('❌ Server startup failed:', ex)
  process.exit(1)
})
