// Working health check API using Pages Router
export default function handler(req, res) {
  const startTime = Date.now()
  
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      responseTime: Date.now() - startTime
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('X-Health-Check', 'true')
    
    res.status(200).json(health)
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`)
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: Date.now() - startTime
    })
  }
}
