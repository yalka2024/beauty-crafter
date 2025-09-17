// Simple API route for testing
export default function handler(req, res) {
  const startTime = Date.now()
  
  try {
    const response = {
      status: 'ok',
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('X-API-Status', 'healthy')
    
    res.status(200).json(response)
  } catch (error) {
    console.error('API Error:', error)
    
    res.status(500).json({
      status: 'error',
      message: 'API error occurred',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}
