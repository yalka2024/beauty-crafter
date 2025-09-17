const { performance } = require('perf_hooks')
const https = require('https')
const http = require('http')
const { URL } = require('url')

// Load testing configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 100,
  testDuration: parseInt(process.env.TEST_DURATION) || 300, // 5 minutes
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 60, // 1 minute
  thinkTime: parseInt(process.env.THINK_TIME) || 1000, // 1 second
  timeout: parseInt(process.env.TIMEOUT) || 30000, // 30 seconds
}

// Test scenarios
const scenarios = [
  { name: 'Home Page', path: '/', method: 'GET', weight: 30 },
  { name: 'Services Page', path: '/services/hair', method: 'GET', weight: 25 },
  { name: 'Health Check', path: '/api/health', method: 'GET', weight: 20 },
  { name: 'Services API', path: '/api/services?category=HAIR', method: 'GET', weight: 15 },
  { name: 'Metrics API', path: '/api/metrics', method: 'GET', weight: 10 }
]

// Statistics tracking
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: new Map(),
  startTime: null,
  endTime: null
}

// HTTP client
class HttpClient {
  constructor(baseUrl, timeout = 30000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.client = baseUrl.startsWith('https') ? https : http
  }

  async request(path, options = {}) {
    const url = new URL(path, this.baseUrl)
    const startTime = performance.now()
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'BeautyCrafter-LoadTest/1.0',
        'Accept': 'application/json, text/html, */*',
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.timeout
    }

    return new Promise((resolve, reject) => {
      const req = this.client.request(requestOptions, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          const endTime = performance.now()
          const responseTime = endTime - startTime
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: responseTime,
            success: res.statusCode >= 200 && res.statusCode < 400
          })
        })
      })

      req.on('error', (error) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        reject({
          error: error.message,
          responseTime: responseTime,
          success: false
        })
      })

      req.on('timeout', () => {
        req.destroy()
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        reject({
          error: 'Request timeout',
          responseTime: responseTime,
          success: false
        })
      })

      if (options.body) {
        req.write(JSON.stringify(options.body))
      }
      
      req.end()
    })
  }
}

// Virtual user simulation
class VirtualUser {
  constructor(id, httpClient, scenarios, thinkTime) {
    this.id = id
    this.httpClient = httpClient
    this.scenarios = scenarios
    this.thinkTime = thinkTime
    this.isRunning = false
  }

  async start() {
    this.isRunning = true
    console.log(`User ${this.id} started`)
    
    while (this.isRunning) {
      try {
        const scenario = this.selectScenario()
        const result = await this.executeScenario(scenario)
        this.updateStats(result)
        await this.sleep(this.thinkTime)
      } catch (error) {
        console.error(`User ${this.id} error:`, error.message)
        stats.failedRequests++
      }
    }
  }

  selectScenario() {
    const totalWeight = this.scenarios.reduce((sum, s) => sum + s.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const scenario of this.scenarios) {
      random -= scenario.weight
      if (random <= 0) {
        return scenario
      }
    }
    
    return this.scenarios[0]
  }

  async executeScenario(scenario) {
    const startTime = performance.now()
    
    try {
      const result = await this.httpClient.request(scenario.path, {
        method: scenario.method
      })
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      return {
        ...result,
        responseTime: responseTime,
        scenario: scenario.name
      }
    } catch (error) {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      return {
        ...error,
        responseTime: responseTime,
        scenario: scenario.name,
        statusCode: 0
      }
    }
  }

  updateStats(result) {
    stats.totalRequests++
    
    if (result.success) {
      stats.successfulRequests++
    } else {
      stats.failedRequests++
      const errorKey = `${result.statusCode || 'ERROR'}: ${result.error || 'Unknown error'}`
      stats.errors.set(errorKey, (stats.errors.get(errorKey) || 0) + 1)
    }
    
    stats.responseTimes.push(result.responseTime)
  }

  stop() {
    this.isRunning = false
    console.log(`User ${this.id} stopped`)
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Load test orchestrator
class LoadTest {
  constructor(config, scenarios) {
    this.config = config
    this.scenarios = scenarios
    this.users = []
    this.httpClient = new HttpClient(config.baseUrl, config.timeout)
  }

  async start() {
    console.log('🚀 Starting Load Test')
    console.log(`📊 Configuration:`)
    console.log(`   Base URL: ${this.config.baseUrl}`)
    console.log(`   Concurrent Users: ${this.config.concurrentUsers}`)
    console.log(`   Test Duration: ${this.config.testDuration}s`)
    console.log(`   Ramp Up Time: ${this.config.rampUpTime}s`)
    console.log('')

    stats.startTime = Date.now()
    
    // Ramp up users gradually
    const rampUpInterval = (this.config.rampUpTime * 1000) / this.config.concurrentUsers
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      const user = new VirtualUser(i + 1, this.httpClient, this.scenarios, this.config.thinkTime)
      this.users.push(user)
      
      setTimeout(() => {
        user.start()
      }, i * rampUpInterval)
    }
    
    // Run test for specified duration
    setTimeout(() => {
      this.stop()
    }, this.config.testDuration * 1000)
    
    // Print progress every 30 seconds
    const progressInterval = setInterval(() => {
      this.printProgress()
    }, 30000)
    
    // Wait for test to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.users.every(user => !user.isRunning)) {
          clearInterval(checkInterval)
          clearInterval(progressInterval)
          resolve()
        }
      }, 1000)
    })
    
    stats.endTime = Date.now()
    this.printFinalReport()
  }

  stop() {
    console.log('\n🛑 Stopping Load Test...')
    this.users.forEach(user => user.stop())
  }

  printProgress() {
    const elapsed = (Date.now() - stats.startTime) / 1000
    const rps = stats.totalRequests / elapsed
    
    console.log(`\n📈 Progress Report (${elapsed.toFixed(0)}s elapsed)`)
    console.log(`   Total Requests: ${stats.totalRequests}`)
    console.log(`   Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`)
    console.log(`   Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`)
    console.log(`   Requests/sec: ${rps.toFixed(2)}`)
    
    if (stats.responseTimes.length > 0) {
      const avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
      const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b)
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
      
      console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`)
      console.log(`   P95 Response Time: ${p95.toFixed(2)}ms`)
    }
  }

  printFinalReport() {
    const duration = (stats.endTime - stats.startTime) / 1000
    const rps = stats.totalRequests / duration
    const successRate = (stats.successfulRequests / stats.totalRequests) * 100
    
    console.log('\n📊 Final Load Test Report')
    console.log('=' .repeat(50))
    console.log(`Test Duration: ${duration.toFixed(2)}s`)
    console.log(`Total Requests: ${stats.totalRequests}`)
    console.log(`Successful Requests: ${stats.successfulRequests} (${successRate.toFixed(2)}%)`)
    console.log(`Failed Requests: ${stats.failedRequests} (${(100 - successRate).toFixed(2)}%)`)
    console.log(`Requests per Second: ${rps.toFixed(2)}`)
    
    if (stats.responseTimes.length > 0) {
      const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b)
      const avg = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
      const min = Math.min(...stats.responseTimes)
      const max = Math.max(...stats.responseTimes)
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)]
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)]
      
      console.log('\nResponse Time Statistics:')
      console.log(`   Average: ${avg.toFixed(2)}ms`)
      console.log(`   Minimum: ${min.toFixed(2)}ms`)
      console.log(`   Maximum: ${max.toFixed(2)}ms`)
      console.log(`   P50: ${p50.toFixed(2)}ms`)
      console.log(`   P95: ${p95.toFixed(2)}ms`)
      console.log(`   P99: ${p99.toFixed(2)}ms`)
    }
    
    if (stats.errors.size > 0) {
      console.log('\nError Summary:')
      stats.errors.forEach((count, error) => {
        console.log(`   ${error}: ${count} occurrences`)
      })
    }
    
    // Performance assessment
    console.log('\nPerformance Assessment:')
    if (successRate >= 99) {
      console.log('✅ Excellent: Success rate >= 99%')
    } else if (successRate >= 95) {
      console.log('⚠️  Good: Success rate >= 95%')
    } else {
      console.log('❌ Poor: Success rate < 95%')
    }
    
    if (rps >= 100) {
      console.log('✅ Excellent: RPS >= 100')
    } else if (rps >= 50) {
      console.log('⚠️  Good: RPS >= 50')
    } else {
      console.log('❌ Poor: RPS < 50')
    }
    
    const avgResponseTime = stats.responseTimes.length > 0 
      ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length 
      : 0
    
    if (avgResponseTime <= 500) {
      console.log('✅ Excellent: Avg response time <= 500ms')
    } else if (avgResponseTime <= 1000) {
      console.log('⚠️  Good: Avg response time <= 1000ms')
    } else {
      console.log('❌ Poor: Avg response time > 1000ms')
    }
  }
}

// Main execution
async function main() {
  try {
    const loadTest = new LoadTest(config, scenarios)
    await loadTest.start()
  } catch (error) {
    console.error('Load test failed:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Load test interrupted by user')
  process.exit(0)
})

// Run the load test
if (require.main === module) {
  main()
}

module.exports = { LoadTest, VirtualUser, HttpClient }
