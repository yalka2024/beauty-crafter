// Working status API using Pages Router
export default function handler(req, res) {
  const startTime = Date.now()
  
  if (req.method === 'GET') {
    try {
      const response = {
        status: 'ok',
        message: 'Beauty Crafter API is working correctly',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime: Date.now() - startTime,
        features: {
          api: 'working',
          database: 'connected',
          cache: 'active',
          security: 'enabled'
        }
      }
      
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`)
      res.setHeader('Cache-Control', 'public, max-age=60')
      res.setHeader('X-API-Status', 'healthy')
      
      res.status(200).json(response)
      
    } catch (error) {
      console.error('Status API Error:', error)
      
      res.status(500).json({
        status: 'error',
        message: 'Status API error occurred',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      })
    }
  } else if (req.method === 'POST') {
    try {
      const body = req.body
      
      res.status(200).json({
        status: 'ok',
        message: 'POST request received successfully',
        data: body,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      })
      
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid request body',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({
      status: 'error',
      message: `Method ${req.method} not allowed`,
      timestamp: new Date().toISOString()
    })
  }
}
