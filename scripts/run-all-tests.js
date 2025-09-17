const { execSync } = require('child_process')
const { performance } = require('perf_hooks')

// Test configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  verbose: process.env.VERBOSE === 'true',
  skipDatabase: process.env.SKIP_DATABASE === 'true',
  skipLoadTest: process.env.SKIP_LOAD_TEST === 'true',
  skipPenTest: process.env.SKIP_PEN_TEST === 'true'
}

// Test results tracking
const results = {
  startTime: null,
  endTime: null,
  tests: {
    unit: { passed: 0, failed: 0, total: 0 },
    integration: { passed: 0, failed: 0, total: 0 },
    security: { passed: 0, failed: 0, total: 0 },
    load: { passed: 0, failed: 0, total: 0 },
    penetration: { passed: 0, failed: 0, total: 0 }
  },
  coverage: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  },
  issues: []
}

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function runCommand(command, description) {
  try {
    log(`Running: ${description}`)
    const startTime = performance.now()
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: config.verbose ? 'inherit' : 'pipe'
    })
    
    const endTime = performance.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    log(`Completed: ${description} (${duration}s)`, 'success')
    return { success: true, output, duration }
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error')
    return { success: false, error: error.message, output: error.stdout || error.stderr }
  }
}

function parseCoverage(output) {
  try {
    const lines = output.split('\n')
    const coverageLine = lines.find(line => line.includes('All files'))
    
    if (coverageLine) {
      const matches = coverageLine.match(/(\d+\.?\d*)%/g)
      if (matches && matches.length >= 4) {
        return {
          statements: parseFloat(matches[0]),
          branches: parseFloat(matches[1]),
          functions: parseFloat(matches[2]),
          lines: parseFloat(matches[3])
        }
      }
    }
  } catch (error) {
    log(`Failed to parse coverage: ${error.message}`, 'warning')
  }
  
  return { statements: 0, branches: 0, functions: 0, lines: 0 }
}

// Test functions
async function runUnitTests() {
  log('🧪 Running Unit Tests...')
  
  const result = runCommand('npm test -- --testPathPattern="^(?!.*integration).*" --coverage', 'Unit Tests')
  
  if (result.success) {
    results.tests.unit.passed++
    results.tests.unit.total++
    
    // Parse coverage from output
    const coverage = parseCoverage(result.output)
    results.coverage = coverage
    
    log(`Coverage: ${coverage.statements}% statements, ${coverage.branches}% branches, ${coverage.functions}% functions, ${coverage.lines}% lines`)
  } else {
    results.tests.unit.failed++
    results.tests.unit.total++
    results.issues.push(`Unit tests failed: ${result.error}`)
  }
}

async function runIntegrationTests() {
  log('🔗 Running Integration Tests...')
  
  const result = runCommand('npm run test:integration', 'Integration Tests')
  
  if (result.success) {
    results.tests.integration.passed++
    results.tests.integration.total++
  } else {
    results.tests.integration.failed++
    results.tests.integration.total++
    results.issues.push(`Integration tests failed: ${result.error}`)
  }
}

async function runSecurityTests() {
  log('🔒 Running Security Tests...')
  
  const result = runCommand('npm run test:security', 'Security Tests')
  
  if (result.success) {
    results.tests.security.passed++
    results.tests.security.total++
  } else {
    results.tests.security.failed++
    results.tests.security.total++
    results.issues.push(`Security tests failed: ${result.error}`)
  }
}

async function runLoadTests() {
  if (config.skipLoadTest) {
    log('⏭️  Skipping Load Tests', 'warning')
    return
  }
  
  log('⚡ Running Load Tests...')
  
  const result = runCommand('npm run load-test:100', 'Load Tests (100 users)')
  
  if (result.success) {
    results.tests.load.passed++
    results.tests.load.total++
  } else {
    results.tests.load.failed++
    results.tests.load.total++
    results.issues.push(`Load tests failed: ${result.error}`)
  }
}

async function runPenetrationTests() {
  if (config.skipPenTest) {
    log('⏭️  Skipping Penetration Tests', 'warning')
    return
  }
  
  log('🎯 Running Penetration Tests...')
  
  const result = runCommand('npm run pen-test', 'Penetration Tests')
  
  if (result.success) {
    results.tests.penetration.passed++
    results.tests.penetration.total++
  } else {
    results.tests.penetration.failed++
    results.tests.penetration.total++
    results.issues.push(`Penetration tests failed: ${result.error}`)
  }
}

async function runE2ETests() {
  log('🌐 Running E2E Tests...')
  
  const result = runCommand('npm run test:e2e', 'E2E Tests')
  
  if (result.success) {
    log('E2E tests completed successfully', 'success')
  } else {
    results.issues.push(`E2E tests failed: ${result.error}`)
  }
}

// Main test runner
async function runAllTests() {
  results.startTime = performance.now()
  
  console.log('🚀 Starting Comprehensive Test Suite')
  console.log('=' .repeat(50))
  console.log(`Base URL: ${config.baseUrl}`)
  console.log(`Verbose: ${config.verbose}`)
  console.log(`Skip Database: ${config.skipDatabase}`)
  console.log(`Skip Load Test: ${config.skipLoadTest}`)
  console.log(`Skip Pen Test: ${config.skipPenTest}`)
  console.log('')
  
  try {
    // Run unit tests first
    await runUnitTests()
    
    // Run integration tests
    await runIntegrationTests()
    
    // Run security tests
    await runSecurityTests()
    
    // Run load tests
    await runLoadTests()
    
    // Run penetration tests
    await runPenetrationTests()
    
    // Run E2E tests
    await runE2ETests()
    
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error')
    results.issues.push(`Test suite failed: ${error.message}`)
  }
  
  results.endTime = performance.now()
  printFinalReport()
}

function printFinalReport() {
  const duration = ((results.endTime - results.startTime) / 1000).toFixed(2)
  
  console.log('\n📊 Test Suite Report')
  console.log('=' .repeat(50))
  console.log(`Total Duration: ${duration}s`)
  console.log('')
  
  // Test results summary
  console.log('Test Results:')
  Object.entries(results.tests).forEach(([testType, stats]) => {
    if (stats.total > 0) {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1)
      const status = stats.failed === 0 ? '✅' : '❌'
      console.log(`  ${status} ${testType.toUpperCase()}: ${stats.passed}/${stats.total} (${percentage}%)`)
    }
  })
  
  // Coverage summary
  console.log('\nCoverage Summary:')
  console.log(`  Statements: ${results.coverage.statements}%`)
  console.log(`  Branches: ${results.coverage.branches}%`)
  console.log(`  Functions: ${results.coverage.functions}%`)
  console.log(`  Lines: ${results.coverage.lines}%`)
  
  // Overall assessment
  const totalTests = Object.values(results.tests).reduce((sum, stats) => sum + stats.total, 0)
  const totalPassed = Object.values(results.tests).reduce((sum, stats) => sum + stats.passed, 0)
  const totalFailed = Object.values(results.tests).reduce((sum, stats) => sum + stats.failed, 0)
  
  console.log('\nOverall Assessment:')
  if (totalFailed === 0 && results.coverage.statements >= 60) {
    console.log('✅ EXCELLENT: All tests passed with good coverage')
  } else if (totalFailed <= 2 && results.coverage.statements >= 50) {
    console.log('⚠️  GOOD: Most tests passed with acceptable coverage')
  } else if (totalFailed <= 5) {
    console.log('⚠️  FAIR: Some tests failed, needs attention')
  } else {
    console.log('❌ POOR: Multiple test failures, requires immediate attention')
  }
  
  // Issues summary
  if (results.issues.length > 0) {
    console.log('\nIssues Found:')
    results.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`)
    })
  }
  
  // Recommendations
  console.log('\nRecommendations:')
  if (results.coverage.statements < 60) {
    console.log('  - Increase test coverage to at least 60%')
  }
  if (totalFailed > 0) {
    console.log('  - Fix failing tests before deployment')
  }
  if (results.tests.load.failed > 0) {
    console.log('  - Address performance issues identified in load tests')
  }
  if (results.tests.penetration.failed > 0) {
    console.log('  - Address security vulnerabilities found in penetration tests')
  }
  
  console.log('\nNext Steps:')
  if (totalFailed === 0 && results.coverage.statements >= 60) {
    console.log('  🚀 Platform is ready for production deployment!')
    console.log('  📋 Run final staging tests with: npm run load-test:500')
    console.log('  🔒 Run security audit with: npm run pen-test:verbose')
  } else {
    console.log('  🔧 Fix identified issues before proceeding')
    console.log('  🧪 Re-run tests after fixes: npm run test:coverage')
    console.log('  📊 Monitor progress with: npm run test:watch')
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Test suite terminated')
  process.exit(0)
})

// Run the test suite
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = { runAllTests, runUnitTests, runIntegrationTests, runSecurityTests, runLoadTests, runPenetrationTests }
