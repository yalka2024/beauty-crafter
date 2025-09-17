#!/usr/bin/env node

const { spawn } = require('child_process')
const { performance } = require('perf_hooks')

// Production server startup script
class ProductionServer {
  constructor() {
    this.startTime = performance.now()
    this.process = null
    this.restartCount = 0
    this.maxRestarts = 5
    this.restartDelay = 5000
  }

  async start() {
    console.log('🚀 Starting Beauty Crafter Production Server')
    console.log('=' .repeat(50))
    
    // Set production environment
    process.env.NODE_ENV = 'production'
    process.env.PORT = process.env.PORT || '3000'
    
    // Start the server
    this.startServer()
    
    // Setup graceful shutdown
    this.setupGracefulShutdown()
    
    // Setup health monitoring
    this.setupHealthMonitoring()
  }

  startServer() {
    console.log(`📡 Starting server on port ${process.env.PORT}`)
    
    this.process = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })

    this.process.on('error', (error) => {
      console.error('❌ Server startup error:', error)
      this.handleRestart()
    })

    this.process.on('exit', (code, signal) => {
      console.log(`🛑 Server exited with code ${code} and signal ${signal}`)
      
      if (code !== 0 && this.restartCount < this.maxRestarts) {
        this.handleRestart()
      } else if (this.restartCount >= this.maxRestarts) {
        console.error('❌ Maximum restart attempts reached. Exiting.')
        process.exit(1)
      }
    })
  }

  handleRestart() {
    this.restartCount++
    console.log(`🔄 Restarting server (attempt ${this.restartCount}/${this.maxRestarts})`)
    
    setTimeout(() => {
      this.startServer()
    }, this.restartDelay)
  }

  setupGracefulShutdown() {
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
      
      if (this.process) {
        this.process.kill('SIGTERM')
        
        // Force kill after 30 seconds
        setTimeout(() => {
          console.log('⚠️  Force killing server...')
          this.process.kill('SIGKILL')
          process.exit(0)
        }, 30000)
      } else {
        process.exit(0)
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2')) // For nodemon
  }

  setupHealthMonitoring() {
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthCheck()
    }, 30000)

    // Performance monitoring every 5 minutes
    setInterval(() => {
      this.logPerformanceMetrics()
    }, 5 * 60 * 1000)
  }

  async performHealthCheck() {
    try {
      const response = await fetch(`http://localhost:${process.env.PORT}/api/health`)
      
      if (response.ok) {
        const health = await response.json()
        console.log('✅ Health check passed:', health.status)
      } else {
        console.warn('⚠️  Health check failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Health check error:', error.message)
    }
  }

  logPerformanceMetrics() {
    const uptime = (performance.now() - this.startTime) / 1000
    const memoryUsage = process.memoryUsage()
    
    console.log('📊 Performance Metrics:', {
      uptime: `${uptime.toFixed(2)}s`,
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
      },
      restarts: this.restartCount
    })
  }
}

// Start the production server
if (require.main === module) {
  const server = new ProductionServer()
  server.start().catch(error => {
    console.error('❌ Failed to start production server:', error)
    process.exit(1)
  })
}

module.exports = ProductionServer
