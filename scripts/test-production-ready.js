#!/usr/bin/env node

const { performance } = require('perf_hooks')
const http = require('http')
const { URL } = require('url')

const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  timeout: 10000
}

// Production readiness tests
const productionTests = [
  { name: 'Home Page', path: '/', expected: 200, critical: true },
  { name: 'Health API', path: '/api/health-simple', expected: 200, critical: true },
  { name: 'Status API', path: '/api/status-simple', expected: 200, critical: true },
  { name: 'Performance API', path: '/api/performance', expected: 200, critical: false },
  { name: '404 Handling', path: '/non-existent', expected: 404, critical: true }
]

class ProductionTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.results = {
      passed: 0,
      failed: 0,
      critical_failed: 0,
      tests: []
    }
  }

  async request(path) {
    const url = new URL(path, this.baseUrl)
    const startTime = performance.now()
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'GET',
        timeout: config.timeout
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const endTime = performance.now()
          resolve({
            statusCode: res.statusCode,
            responseTime: endTime - startTime,
            body: data,
            headers: res.headers
          })
        })
      })

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
      
      req.end()
    })
  }

  async runTest(test) {
    console.log(`🧪 Testing: ${test.name}...`)
    
    try {
      const response = await this.request(test.path)
      const passed = response.statusCode === test.expected
      
      const result = {
        name: test.name,
        path: test.path,
        expected: test.expected,
        actual: response.statusCode,
        responseTime: response.responseTime,
        passed: passed,
        critical: test.critical
      }
      
      this.results.tests.push(result)
      
      if (passed) {
        this.results.passed++
        console.log(`✅ ${test.name}: ${response.statusCode} (${response.responseTime.toFixed(2)}ms)`)
      } else {
        this.results.failed++
        if (test.critical) {
          this.results.critical_failed++
        }
        console.log(`❌ ${test.name}: Expected ${test.expected}, got ${response.statusCode}`)
      }
      
    } catch (error) {
      this.results.failed++
      if (test.critical) {
        this.results.critical_failed++
      }
      
      this.results.tests.push({
        name: test.name,
        path: test.path,
        expected: test.expected,
        actual: 'ERROR',
        error: error.message,
        passed: false,
        critical: test.critical
      })
      
      console.log(`❌ ${test.name}: ERROR - ${error.message}`)
    }
  }

  async runAllTests() {
    console.log('🚀 Production Readiness Testing')
    console.log(`🎯 Target: ${this.baseUrl}`)
    console.log('=' .repeat(50))
    
    for (const test of productionTests) {
      await this.runTest(test)
    }
    
    this.generateReport()
  }

  generateReport() {
    console.log('')
    console.log('📊 Production Readiness Report')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${this.results.tests.length}`)
    console.log(`Passed: ${this.results.passed} ✅`)
    console.log(`Failed: ${this.results.failed} ${this.results.failed > 0 ? '❌' : '✅'}`)
    console.log(`Critical Failures: ${this.results.critical_failed} ${this.results.critical_failed > 0 ? '🚨' : '✅'}`)
    
    const successRate = (this.results.passed / this.results.tests.length) * 100
    console.log(`Success Rate: ${successRate.toFixed(2)}%`)
    
    // Production readiness assessment
    console.log('')
    console.log('🎯 Production Readiness Assessment:')
    
    if (this.results.critical_failed === 0 && successRate >= 80) {
      console.log('✅ READY FOR PRODUCTION')
      console.log('🚀 Platform can be deployed to production')
    } else if (this.results.critical_failed === 0) {
      console.log('⚠️ MOSTLY READY')
      console.log('🔧 Minor issues found, but can deploy')
    } else {
      console.log('❌ NOT READY FOR PRODUCTION')
      console.log('🚨 Critical issues must be fixed before deployment')
    }
    
    // Show failed tests
    const failedTests = this.results.tests.filter(t => !t.passed)
    if (failedTests.length > 0) {
      console.log('')
      console.log('❌ Failed Tests:')
      failedTests.forEach(test => {
        const severity = test.critical ? '🚨 CRITICAL' : '⚠️ Minor'
        console.log(`   ${severity}: ${test.name} - Expected ${test.expected}, got ${test.actual}`)
        if (test.error) {
          console.log(`     Error: ${test.error}`)
        }
      })
    }
  }
}

// Run tests
async function main() {
  try {
    const tester = new ProductionTester(config.baseUrl)
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Production testing failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = ProductionTester
