#!/usr/bin/env node

const { performance } = require('perf_hooks')
const https = require('https')
const http = require('http')
const { URL } = require('url')

// Local testing configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  testDuration: 60, // 1 minute test
  maxRetries: 3,
  timeout: 10000
}

// Test scenarios for local validation
const testScenarios = [
  { name: 'Home Page', path: '/', expected: 200, type: 'html' },
  { name: 'Performance Dashboard', path: '/performance', expected: 200, type: 'html' },
  { name: 'Simple API', path: '/api/simple', expected: 200, type: 'json' },
  { name: 'Health API', path: '/api/health', expected: 200, type: 'json' },
  { name: 'Performance API', path: '/api/performance-optimized', expected: 200, type: 'json' },
  { name: 'Status API', path: '/api/status', expected: 200, type: 'json' },
  { name: 'Non-existent Page', path: '/non-existent', expected: 404, type: 'html' }
]

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
  startTime: null,
  endTime: null,
  performance: {
    responseTimes: [],
    errors: []
  }
}

// HTTP client for testing
class LocalTestClient {
  constructor(baseUrl, timeout = 10000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.client = baseUrl.startsWith('https') ? https : http
    this.agent = new this.client.Agent({
      keepAlive: true,
      maxSockets: 10,
      timeout: timeout
    })
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
        'User-Agent': 'BeautyCrafter-LocalTest/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        'Connection': 'keep-alive',
        ...options.headers
      },
      timeout: this.timeout,
      agent: this.agent
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
            responseTime: responseTime
          })
        })
      })

      req.on('error', (error) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        reject({
          error: error.message,
          responseTime: responseTime
        })
      })

      req.on('timeout', () => {
        req.destroy()
        reject({
          error: 'Request timeout',
          responseTime: this.timeout
        })
      })

      req.end()
    })
  }
}

// Individual test runner
async function runTest(client, scenario, testNumber, totalTests) {
  const testName = `${testNumber}/${totalTests}: ${scenario.name}`
  
  try {
    console.log(`🧪 Running ${testName}...`)
    
    const startTime = performance.now()
    const response = await client.request(scenario.path)
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    // Validate response
    const statusMatch = response.statusCode === scenario.expected
    let contentTypeMatch = true
    
    if (scenario.type === 'json') {
      try {
        JSON.parse(response.body)
        contentTypeMatch = response.headers['content-type']?.includes('application/json')
      } catch (e) {
        contentTypeMatch = false
      }
    } else if (scenario.type === 'html') {
      contentTypeMatch = response.headers['content-type']?.includes('text/html')
    }
    
    const testPassed = statusMatch && contentTypeMatch
    
    const testResult = {
      name: scenario.name,
      path: scenario.path,
      expected: scenario.expected,
      actual: response.statusCode,
      responseTime: responseTime,
      passed: testPassed,
      contentType: response.headers['content-type'],
      headers: {
        'x-response-time': response.headers['x-response-time'],
        'cache-control': response.headers['cache-control'],
        'x-cache': response.headers['x-cache']
      }
    }
    
    results.tests.push(testResult)
    results.performance.responseTimes.push(responseTime)
    
    if (testPassed) {
      results.passed++
      console.log(`✅ ${testName} - ${response.statusCode} (${responseTime.toFixed(2)}ms)`)
    } else {
      results.failed++
      console.log(`❌ ${testName} - Expected ${scenario.expected}, got ${response.statusCode} (${responseTime.toFixed(2)}ms)`)
    }
    
  } catch (error) {
    results.failed++
    results.performance.errors.push(error)
    
    const testResult = {
      name: scenario.name,
      path: scenario.path,
      expected: scenario.expected,
      actual: 'ERROR',
      responseTime: error.responseTime || 0,
      passed: false,
      error: error.error || error.message
    }
    
    results.tests.push(testResult)
    console.log(`❌ ${testName} - ERROR: ${error.error || error.message}`)
  }
}

// Performance test
async function runPerformanceTest(client) {
  console.log('\n🚀 Running Performance Test...')
  
  const performanceResults = {
    requests: 0,
    successful: 0,
    failed: 0,
    responseTimes: []
  }
  
  const testDuration = 30000 // 30 seconds
  const startTime = Date.now()
  
  while (Date.now() - startTime < testDuration) {
    try {
      const response = await client.request('/')
      performanceResults.requests++
      performanceResults.responseTimes.push(response.responseTime)
      
      if (response.statusCode === 200) {
        performanceResults.successful++
      } else {
        performanceResults.failed++
      }
      
    } catch (error) {
      performanceResults.requests++
      performanceResults.failed++
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const avgResponseTime = performanceResults.responseTimes.reduce((a, b) => a + b, 0) / performanceResults.responseTimes.length
  const rps = performanceResults.requests / (testDuration / 1000)
  const successRate = (performanceResults.successful / performanceResults.requests) * 100
  
  console.log(`📊 Performance Results:`)
  console.log(`   Requests: ${performanceResults.requests}`)
  console.log(`   Success Rate: ${successRate.toFixed(2)}%`)
  console.log(`   RPS: ${rps.toFixed(2)}`)
  console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`)
  
  return {
    requests: performanceResults.requests,
    successRate: successRate,
    rps: rps,
    avgResponseTime: avgResponseTime
  }
}

// Security headers test
async function testSecurityHeaders(client) {
  console.log('\n🔒 Testing Security Headers...')
  
  const securityTests = [
    { header: 'x-content-type-options', expected: 'nosniff' },
    { header: 'x-frame-options', expected: 'DENY' },
    { header: 'x-xss-protection', expected: '1; mode=block' },
    { header: 'referrer-policy', expected: 'strict-origin-when-cross-origin' }
  ]
  
  try {
    const response = await client.request('/')
    
    securityTests.forEach(test => {
      const headerValue = response.headers[test.header]
      if (headerValue && headerValue.toLowerCase().includes(test.expected.toLowerCase())) {
        console.log(`✅ ${test.header}: ${headerValue}`)
      } else {
        console.log(`❌ ${test.header}: Missing or incorrect (got: ${headerValue})`)
      }
    })
    
  } catch (error) {
    console.log(`❌ Security headers test failed: ${error.message}`)
  }
}

// API functionality test
async function testAPIFunctionality(client) {
  console.log('\n🔧 Testing API Functionality...')
  
  try {
    // Test performance API
    const perfResponse = await client.request('/api/performance-optimized')
    if (perfResponse.statusCode === 200) {
      const data = JSON.parse(perfResponse.body)
      console.log(`✅ Performance API: ${data.status} (${perfResponse.responseTime.toFixed(2)}ms)`)
      console.log(`   Memory: ${data.performance?.memory?.used}MB used`)
      console.log(`   Uptime: ${data.uptime?.toFixed(2)}s`)
    } else {
      console.log(`❌ Performance API failed: ${perfResponse.statusCode}`)
    }
    
    // Test simple API
    const simpleResponse = await client.request('/api/simple')
    if (simpleResponse.statusCode === 200) {
      const data = JSON.parse(simpleResponse.body)
      console.log(`✅ Simple API: ${data.status} (${simpleResponse.responseTime.toFixed(2)}ms)`)
    } else {
      console.log(`❌ Simple API failed: ${simpleResponse.statusCode}`)
    }
    
  } catch (error) {
    console.log(`❌ API functionality test failed: ${error.message}`)
  }
}

// Main test runner
async function runLocalTests() {
  console.log('🧪 Beauty Crafter - Local Testing Suite')
  console.log('=' .repeat(50))
  console.log(`Testing URL: ${config.baseUrl}`)
  console.log('')
  
  results.startTime = Date.now()
  
  const client = new LocalTestClient(config.baseUrl, config.timeout)
  
  try {
    // Step 1: Basic functionality tests
    console.log('📋 Running Basic Functionality Tests...')
    for (let i = 0; i < testScenarios.length; i++) {
      await runTest(client, testScenarios[i], i + 1, testScenarios.length)
    }
    
    // Step 2: Security headers test
    await testSecurityHeaders(client)
    
    // Step 3: API functionality test
    await testAPIFunctionality(client)
    
    // Step 4: Performance test
    const performanceResults = await runPerformanceTest(client)
    
    results.endTime = Date.now()
    
    // Final report
    console.log('\n📊 Local Testing Report')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${results.tests.length}`)
    console.log(`Passed: ${results.passed} ✅`)
    console.log(`Failed: ${results.failed} ${results.failed > 0 ? '❌' : '✅'}`)
    console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(2)}%`)
    
    if (results.performance.responseTimes.length > 0) {
      const avgResponseTime = results.performance.responseTimes.reduce((a, b) => a + b, 0) / results.performance.responseTimes.length
      console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
    }
    
    console.log('\nPerformance Summary:')
    console.log(`  RPS: ${performanceResults.rps.toFixed(2)}`)
    console.log(`  Success Rate: ${performanceResults.successRate.toFixed(2)}%`)
    console.log(`  Avg Response Time: ${performanceResults.avgResponseTime.toFixed(2)}ms`)
    
    // Readiness assessment
    console.log('\n🎯 Local Readiness Assessment:')
    const isReady = results.failed === 0 && performanceResults.successRate >= 95 && performanceResults.avgResponseTime < 1000
    
    if (isReady) {
      console.log('✅ READY FOR DEPLOYMENT: All tests passed!')
      console.log('🚀 You can proceed with Vercel deployment')
    } else {
      console.log('⚠️  NEEDS ATTENTION: Some issues found')
      if (results.failed > 0) {
        console.log(`   - ${results.failed} test(s) failed`)
      }
      if (performanceResults.successRate < 95) {
        console.log(`   - Success rate too low: ${performanceResults.successRate.toFixed(2)}%`)
      }
      if (performanceResults.avgResponseTime >= 1000) {
        console.log(`   - Response time too high: ${performanceResults.avgResponseTime.toFixed(2)}ms`)
      }
    }
    
    // Detailed results
    if (results.failed > 0) {
      console.log('\n❌ Failed Tests:')
      results.tests.filter(t => !t.passed).forEach(test => {
        console.log(`   ${test.name}: Expected ${test.expected}, got ${test.actual}`)
        if (test.error) {
          console.log(`     Error: ${test.error}`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Testing failed:', error)
    process.exit(1)
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  // Wait a bit for server to start if needed
  setTimeout(() => {
    runLocalTests()
  }, 5000)
}

module.exports = { runLocalTests, LocalTestClient }
