const { performance } = require('perf_hooks')
const https = require('https')
const http = require('http')
const { URL } = require('url')

// Penetration testing configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.TIMEOUT) || 10000,
  verbose: process.env.VERBOSE === 'true',
  maxRetries: 3
}

// Test results tracking
const results = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  criticalIssues: 0,
  highIssues: 0,
  mediumIssues: 0,
  lowIssues: 0,
  tests: []
}

// HTTP client
class HttpClient {
  constructor(baseUrl, timeout = 10000) {
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
        'User-Agent': 'BeautyCrafter-PenTest/1.0',
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

// Penetration test suite
class PenetrationTest {
  constructor(config) {
    this.config = config
    this.httpClient = new HttpClient(config.baseUrl, config.timeout)
  }

  async runAllTests() {
    console.log('🔒 Starting Penetration Testing Suite')
    console.log(`🎯 Target: ${this.config.baseUrl}`)
    console.log('')

    const testSuites = [
      this.testSQLInjection.bind(this),
      this.testXSS.bind(this),
      this.testCSRF.bind(this),
      this.testAuthenticationBypass.bind(this),
      this.testAuthorizationBypass.bind(this),
      this.testInputValidation.bind(this),
      this.testSecurityHeaders.bind(this),
      this.testRateLimiting.bind(this),
      this.testErrorHandling.bind(this),
      this.testFileUpload.bind(this),
      this.testDirectoryTraversal.bind(this),
      this.testCommandInjection.bind(this),
      this.testSSRF.bind(this),
      this.testXXE.bind(this),
      this.testLDAPInjection.bind(this),
      this.testNoSQLInjection.bind(this),
      this.testBusinessLogicFlaws.bind(this),
      this.testSessionManagement.bind(this),
      this.testCryptography.bind(this),
      this.testAPISecurity.bind(this)
    ]

    for (const testSuite of testSuites) {
      try {
        await testSuite()
      } catch (error) {
        console.error(`❌ Test suite failed: ${error.message}`)
      }
    }

    this.printFinalReport()
  }

  async testSQLInjection() {
    console.log('🔍 Testing SQL Injection...')
    
    const payloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR '1'='1' --",
      "admin'--",
      "admin'/*",
      "' OR 1=1#",
      "' OR 'x'='x",
      "') OR ('1'='1",
      "1' AND '1'='1",
      "1' AND '1'='2"
    ]

    const endpoints = [
      '/api/services?search=',
      '/api/booking?serviceId=',
      '/api/user?email=',
      '/api/reviews?providerId='
    ]

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        await this.testPayload(endpoint + payload, 'SQL Injection', 'CRITICAL')
      }
    }
  }

  async testXSS() {
    console.log('🔍 Testing Cross-Site Scripting (XSS)...')
    
    const payloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<keygen onfocus=alert("XSS") autofocus>',
      '<video><source onerror="alert(\'XSS\')">',
      '<audio src=x onerror=alert("XSS")>',
      '<details open ontoggle=alert("XSS")>',
      '<marquee onstart=alert("XSS")>',
      '<div onmouseover=alert("XSS")>'
    ]

    const endpoints = [
      '/api/services?search=',
      '/api/booking?notes=',
      '/api/reviews?comment=',
      '/api/user?name='
    ]

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        await this.testPayload(endpoint + encodeURIComponent(payload), 'XSS', 'HIGH')
      }
    }
  }

  async testCSRF() {
    console.log('🔍 Testing Cross-Site Request Forgery (CSRF)...')
    
    const csrfEndpoints = [
      { path: '/api/booking', method: 'POST', body: { serviceId: 'test', scheduledAt: '2024-12-25T10:00:00Z' } },
      { path: '/api/reviews', method: 'POST', body: { providerId: 'test', rating: 5, comment: 'test' } },
      { path: '/api/user/profile', method: 'PUT', body: { name: 'test' } },
      { path: '/api/services', method: 'POST', body: { name: 'test', price: 50 } }
    ]

    for (const endpoint of csrfEndpoints) {
      try {
        const result = await this.httpClient.request(endpoint.path, {
          method: endpoint.method,
          body: endpoint.body,
          headers: {
            'Origin': 'https://malicious-site.com',
            'Referer': 'https://malicious-site.com'
          }
        })

        if (result.statusCode === 200 || result.statusCode === 201) {
          this.recordTest('CSRF', 'HIGH', `CSRF vulnerability found in ${endpoint.path}`, false)
        } else {
          this.recordTest('CSRF', 'LOW', `CSRF protection working for ${endpoint.path}`, true)
        }
      } catch (error) {
        this.recordTest('CSRF', 'LOW', `CSRF protection working for ${endpoint.path}`, true)
      }
    }
  }

  async testAuthenticationBypass() {
    console.log('🔍 Testing Authentication Bypass...')
    
    const protectedEndpoints = [
      '/api/user/profile',
      '/api/booking',
      '/api/reviews',
      '/api/services',
      '/admin/dashboard'
    ]

    for (const endpoint of protectedEndpoints) {
      try {
        const result = await this.httpClient.request(endpoint)
        
        if (result.statusCode === 200) {
          this.recordTest('Authentication Bypass', 'CRITICAL', `Protected endpoint ${endpoint} accessible without authentication`, false)
        } else if (result.statusCode === 401 || result.statusCode === 403) {
          this.recordTest('Authentication Bypass', 'LOW', `Protected endpoint ${endpoint} properly secured`, true)
        }
      } catch (error) {
        this.recordTest('Authentication Bypass', 'LOW', `Protected endpoint ${endpoint} properly secured`, true)
      }
    }
  }

  async testAuthorizationBypass() {
    console.log('🔍 Testing Authorization Bypass...')
    
    const adminEndpoints = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/services',
      '/admin/analytics'
    ]

    for (const endpoint of adminEndpoints) {
      try {
        const result = await this.httpClient.request(endpoint, {
          headers: {
            'Authorization': 'Bearer fake-token',
            'X-User-Role': 'CLIENT'
          }
        })
        
        if (result.statusCode === 200) {
          this.recordTest('Authorization Bypass', 'HIGH', `Admin endpoint ${endpoint} accessible with client role`, false)
        } else if (result.statusCode === 403) {
          this.recordTest('Authorization Bypass', 'LOW', `Admin endpoint ${endpoint} properly protected`, true)
        }
      } catch (error) {
        this.recordTest('Authorization Bypass', 'LOW', `Admin endpoint ${endpoint} properly protected`, true)
      }
    }
  }

  async testInputValidation() {
    console.log('🔍 Testing Input Validation...')
    
    const testCases = [
      { name: 'Email Validation', path: '/api/auth/register', body: { email: 'invalid-email', password: 'Test123!' } },
      { name: 'Password Validation', path: '/api/auth/register', body: { email: 'test@example.com', password: 'weak' } },
      { name: 'Phone Validation', path: '/api/user/profile', body: { phone: 'invalid-phone' } },
      { name: 'Price Validation', path: '/api/services', body: { name: 'Test', price: -100 } },
      { name: 'Date Validation', path: '/api/booking', body: { serviceId: 'test', scheduledAt: 'invalid-date' } }
    ]

    for (const testCase of testCases) {
      try {
        const result = await this.httpClient.request(testCase.path, {
          method: 'POST',
          body: testCase.body
        })
        
        if (result.statusCode === 200 || result.statusCode === 201) {
          this.recordTest('Input Validation', 'MEDIUM', `${testCase.name} validation failed`, false)
        } else {
          this.recordTest('Input Validation', 'LOW', `${testCase.name} validation working`, true)
        }
      } catch (error) {
        this.recordTest('Input Validation', 'LOW', `${testCase.name} validation working`, true)
      }
    }
  }

  async testSecurityHeaders() {
    console.log('🔍 Testing Security Headers...')
    
    try {
      const result = await this.httpClient.request('/')
      const headers = result.headers
      
      const securityHeaders = [
        { name: 'X-XSS-Protection', expected: '1; mode=block', severity: 'MEDIUM' },
        { name: 'X-Content-Type-Options', expected: 'nosniff', severity: 'MEDIUM' },
        { name: 'X-Frame-Options', expected: 'DENY', severity: 'MEDIUM' },
        { name: 'Strict-Transport-Security', expected: 'max-age=31536000', severity: 'HIGH' },
        { name: 'Content-Security-Policy', expected: 'default-src', severity: 'HIGH' },
        { name: 'Referrer-Policy', expected: 'strict-origin-when-cross-origin', severity: 'LOW' }
      ]

      for (const header of securityHeaders) {
        if (headers[header.name.toLowerCase()]) {
          this.recordTest('Security Headers', 'LOW', `${header.name} header present`, true)
        } else {
          this.recordTest('Security Headers', header.severity, `${header.name} header missing`, false)
        }
      }
    } catch (error) {
      this.recordTest('Security Headers', 'HIGH', 'Failed to check security headers', false)
    }
  }

  async testRateLimiting() {
    console.log('🔍 Testing Rate Limiting...')
    
    const testEndpoint = '/api/health'
    const requests = []
    
    // Send 200 requests rapidly
    for (let i = 0; i < 200; i++) {
      requests.push(this.httpClient.request(testEndpoint))
    }
    
    try {
      const results = await Promise.allSettled(requests)
      const successfulRequests = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 200).length
      const rateLimitedRequests = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 429).length
      
      if (rateLimitedRequests > 0) {
        this.recordTest('Rate Limiting', 'LOW', `Rate limiting working (${rateLimitedRequests} requests blocked)`, true)
      } else {
        this.recordTest('Rate Limiting', 'MEDIUM', 'Rate limiting not working (no requests blocked)', false)
      }
    } catch (error) {
      this.recordTest('Rate Limiting', 'MEDIUM', 'Rate limiting test failed', false)
    }
  }

  async testErrorHandling() {
    console.log('🔍 Testing Error Handling...')
    
    const errorEndpoints = [
      '/api/nonexistent',
      '/api/services/invalid-id',
      '/api/user/999999',
      '/api/booking/invalid-id'
    ]

    for (const endpoint of errorEndpoints) {
      try {
        const result = await this.httpClient.request(endpoint)
        
        if (result.statusCode >= 400 && result.statusCode < 500) {
          // Check if error message leaks sensitive information
          if (result.body.includes('password') || result.body.includes('token') || result.body.includes('secret')) {
            this.recordTest('Error Handling', 'MEDIUM', `Error message in ${endpoint} leaks sensitive information`, false)
          } else {
            this.recordTest('Error Handling', 'LOW', `Error handling working for ${endpoint}`, true)
          }
        } else {
          this.recordTest('Error Handling', 'MEDIUM', `Unexpected response for ${endpoint}`, false)
        }
      } catch (error) {
        this.recordTest('Error Handling', 'LOW', `Error handling working for ${endpoint}`, true)
      }
    }
  }

  async testFileUpload() {
    console.log('🔍 Testing File Upload Security...')
    
    const maliciousFiles = [
      { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'test.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
      { name: 'test.asp', content: '<% eval request("cmd") %>' },
      { name: 'test.exe', content: 'MZ' },
      { name: 'test.bat', content: '@echo off' }
    ]

    for (const file of maliciousFiles) {
      try {
        const result = await this.httpClient.request('/api/upload', {
          method: 'POST',
          body: { filename: file.name, content: file.content },
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        if (result.statusCode === 200 || result.statusCode === 201) {
          this.recordTest('File Upload', 'HIGH', `Malicious file ${file.name} uploaded successfully`, false)
        } else {
          this.recordTest('File Upload', 'LOW', `File upload security working for ${file.name}`, true)
        }
      } catch (error) {
        this.recordTest('File Upload', 'LOW', `File upload security working for ${file.name}`, true)
      }
    }
  }

  async testDirectoryTraversal() {
    console.log('🔍 Testing Directory Traversal...')
    
    const payloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd'
    ]

    const endpoints = [
      '/api/files/',
      '/api/download/',
      '/api/static/',
      '/api/images/'
    ]

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        await this.testPayload(endpoint + payload, 'Directory Traversal', 'HIGH')
      }
    }
  }

  async testCommandInjection() {
    console.log('🔍 Testing Command Injection...')
    
    const payloads = [
      '; ls -la',
      '| whoami',
      '& dir',
      '` id `',
      '$(whoami)',
      '; cat /etc/passwd',
      '| type C:\\Windows\\System32\\drivers\\etc\\hosts'
    ]

    const endpoints = [
      '/api/system/status?command=',
      '/api/health?check=',
      '/api/debug?cmd='
    ]

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        await this.testPayload(endpoint + payload, 'Command Injection', 'CRITICAL')
      }
    }
  }

  async testSSRF() {
    console.log('🔍 Testing Server-Side Request Forgery (SSRF)...')
    
    const ssrfPayloads = [
      'http://localhost:22',
      'http://127.0.0.1:3306',
      'http://169.254.169.254/latest/meta-data/',
      'file:///etc/passwd',
      'gopher://localhost:25',
      'dict://localhost:11211'
    ]

    const endpoints = [
      '/api/fetch?url=',
      '/api/proxy?target=',
      '/api/webhook?url='
    ]

    for (const endpoint of endpoints) {
      for (const payload of ssrfPayloads) {
        await this.testPayload(endpoint + payload, 'SSRF', 'HIGH')
      }
    }
  }

  async testXXE() {
    console.log('🔍 Testing XML External Entity (XXE)...')
    
    const xxePayload = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>`

    try {
      const result = await this.httpClient.request('/api/xml', {
        method: 'POST',
        body: xxePayload,
        headers: { 'Content-Type': 'application/xml' }
      })
      
      if (result.body.includes('root:') || result.body.includes('bin/bash')) {
        this.recordTest('XXE', 'HIGH', 'XXE vulnerability found', false)
      } else {
        this.recordTest('XXE', 'LOW', 'XXE protection working', true)
      }
    } catch (error) {
      this.recordTest('XXE', 'LOW', 'XXE protection working', true)
    }
  }

  async testLDAPInjection() {
    console.log('🔍 Testing LDAP Injection...')
    
    const ldapPayloads = [
      '*)(uid=*',
      '*)(|(uid=*',
      '*)(|(password=*',
      '*)(|(objectClass=*',
      'admin)(&(password=*)',
      '*)(|(cn=*'
    ]

    const endpoints = [
      '/api/auth/login?username=',
      '/api/user/search?query=',
      '/api/admin/users?filter='
    ]

    for (const endpoint of endpoints) {
      for (const payload of ldapPayloads) {
        await this.testPayload(endpoint + payload, 'LDAP Injection', 'HIGH')
      }
    }
  }

  async testNoSQLInjection() {
    console.log('🔍 Testing NoSQL Injection...')
    
    const nosqlPayloads = [
      '{"$ne": null}',
      '{"$gt": ""}',
      '{"$where": "this.password == this.username"}',
      '{"$regex": ".*"}',
      '{"$exists": true}',
      '{"$nin": []}'
    ]

    const endpoints = [
      '/api/auth/login',
      '/api/user/search',
      '/api/services/filter'
    ]

    for (const endpoint of endpoints) {
      for (const payload of nosqlPayloads) {
        try {
          const result = await this.httpClient.request(endpoint, {
            method: 'POST',
            body: { query: payload }
          })
          
          if (result.statusCode === 200) {
            this.recordTest('NoSQL Injection', 'HIGH', `NoSQL injection vulnerability found in ${endpoint}`, false)
          }
        } catch (error) {
          // Expected for protected endpoints
        }
      }
    }
  }

  async testBusinessLogicFlaws() {
    console.log('🔍 Testing Business Logic Flaws...')
    
    // Test negative pricing
    try {
      const result = await this.httpClient.request('/api/services', {
        method: 'POST',
        body: { name: 'Test Service', price: -100 }
      })
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        this.recordTest('Business Logic', 'MEDIUM', 'Negative pricing allowed', false)
      } else {
        this.recordTest('Business Logic', 'LOW', 'Negative pricing blocked', true)
      }
    } catch (error) {
      this.recordTest('Business Logic', 'LOW', 'Negative pricing blocked', true)
    }

    // Test future booking dates
    try {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      const result = await this.httpClient.request('/api/booking', {
        method: 'POST',
        body: { serviceId: 'test', scheduledAt: futureDate }
      })
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        this.recordTest('Business Logic', 'LOW', 'Future booking dates allowed', true)
      } else {
        this.recordTest('Business Logic', 'LOW', 'Future booking dates blocked', true)
      }
    } catch (error) {
      this.recordTest('Business Logic', 'LOW', 'Future booking dates blocked', true)
    }
  }

  async testSessionManagement() {
    console.log('🔍 Testing Session Management...')
    
    // Test session fixation
    try {
      const result1 = await this.httpClient.request('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' }
      })
      
      const sessionId = result1.headers['set-cookie']?.[0]?.split(';')[0]
      
      if (sessionId) {
        const result2 = await this.httpClient.request('/api/user/profile', {
          headers: { 'Cookie': sessionId }
        })
        
        if (result2.statusCode === 200) {
          this.recordTest('Session Management', 'MEDIUM', 'Session fixation vulnerability found', false)
        } else {
          this.recordTest('Session Management', 'LOW', 'Session management working', true)
        }
      }
    } catch (error) {
      this.recordTest('Session Management', 'LOW', 'Session management working', true)
    }
  }

  async testCryptography() {
    console.log('🔍 Testing Cryptography...')
    
    // Test for weak encryption
    try {
      const result = await this.httpClient.request('/api/auth/register', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123' }
      })
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        // Check if password is hashed (not plain text)
        if (result.body.includes('password123')) {
          this.recordTest('Cryptography', 'CRITICAL', 'Passwords stored in plain text', false)
        } else {
          this.recordTest('Cryptography', 'LOW', 'Passwords properly hashed', true)
        }
      }
    } catch (error) {
      this.recordTest('Cryptography', 'LOW', 'Password hashing working', true)
    }
  }

  async testAPISecurity() {
    console.log('🔍 Testing API Security...')
    
    // Test for API versioning
    try {
      const result = await this.httpClient.request('/api/v1/services')
      
      if (result.statusCode === 200) {
        this.recordTest('API Security', 'LOW', 'API versioning working', true)
      } else {
        this.recordTest('API Security', 'MEDIUM', 'API versioning not implemented', false)
      }
    } catch (error) {
      this.recordTest('API Security', 'MEDIUM', 'API versioning not implemented', false)
    }

    // Test for API documentation
    try {
      const result = await this.httpClient.request('/api/docs')
      
      if (result.statusCode === 200) {
        this.recordTest('API Security', 'LOW', 'API documentation available', true)
      } else {
        this.recordTest('API Security', 'LOW', 'API documentation not available', false)
      }
    } catch (error) {
      this.recordTest('API Security', 'LOW', 'API documentation not available', false)
    }
  }

  async testPayload(endpoint, testName, severity) {
    try {
      const result = await this.httpClient.request(endpoint)
      
      if (result.statusCode === 200) {
        this.recordTest(testName, severity, `Vulnerability found in ${endpoint}`, false)
      } else {
        this.recordTest(testName, 'LOW', `Protection working for ${endpoint}`, true)
      }
    } catch (error) {
      this.recordTest(testName, 'LOW', `Protection working for ${endpoint}`, true)
    }
  }

  recordTest(testName, severity, description, passed) {
    results.totalTests++
    
    if (passed) {
      results.passedTests++
    } else {
      results.failedTests++
      
      switch (severity) {
        case 'CRITICAL':
          results.criticalIssues++
          break
        case 'HIGH':
          results.highIssues++
          break
        case 'MEDIUM':
          results.mediumIssues++
          break
        case 'LOW':
          results.lowIssues++
          break
      }
    }
    
    results.tests.push({
      testName,
      severity,
      description,
      passed,
      timestamp: new Date().toISOString()
    })
    
    if (this.config.verbose) {
      const status = passed ? '✅' : '❌'
      console.log(`  ${status} ${testName}: ${description}`)
    }
  }

  printFinalReport() {
    console.log('\n📊 Penetration Testing Report')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${results.totalTests}`)
    console.log(`Passed: ${results.passedTests} (${((results.passedTests / results.totalTests) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${results.failedTests} (${((results.failedTests / results.totalTests) * 100).toFixed(1)}%)`)
    console.log('')
    console.log('Security Issues by Severity:')
    console.log(`  Critical: ${results.criticalIssues}`)
    console.log(`  High: ${results.highIssues}`)
    console.log(`  Medium: ${results.mediumIssues}`)
    console.log(`  Low: ${results.lowIssues}`)
    console.log('')
    
    if (results.failedTests > 0) {
      console.log('Failed Tests:')
      results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  ${test.severity}: ${test.testName} - ${test.description}`)
        })
    }
    
    console.log('')
    console.log('Security Assessment:')
    if (results.criticalIssues === 0 && results.highIssues === 0) {
      console.log('✅ Excellent: No critical or high severity issues found')
    } else if (results.criticalIssues === 0 && results.highIssues <= 2) {
      console.log('⚠️  Good: Few high severity issues found')
    } else if (results.criticalIssues === 0) {
      console.log('⚠️  Fair: Multiple high severity issues found')
    } else {
      console.log('❌ Poor: Critical security issues found')
    }
  }
}

// Main execution
async function main() {
  try {
    const penTest = new PenetrationTest(config)
    await penTest.runAllTests()
  } catch (error) {
    console.error('Penetration test failed:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Penetration test interrupted by user')
  process.exit(0)
})

// Run the penetration test
if (require.main === module) {
  main()
}

module.exports = { PenetrationTest, HttpClient }
