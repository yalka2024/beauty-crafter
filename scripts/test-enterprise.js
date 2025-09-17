#!/usr/bin/env node

/**
 * Beauty Crafter Enterprise Platform - Integration Test Suite
 * This script validates all critical fixes and enterprise components
 */

const http = require('http');

const BASE_URL = 'http://localhost:3003';
const ENDPOINTS = [
  '/api/health',
  '/api/metrics',
  '/api/test/integration'
];

// Test results
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: {}
};

/**
 * Make HTTP request to endpoint
 */
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: endpoint,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  
  try {
    const response = await makeRequest('/api/health');
    
    if (response.status === 200) {
      const healthData = response.data;
      
      // Validate health response structure
      const requiredFields = ['status', 'timestamp', 'platform', 'system', 'database'];
      const missingFields = requiredFields.filter(field => !(field in healthData));
      
      if (missingFields.length === 0) {
        console.log('✅ Health endpoint working correctly');
        console.log(`   Status: ${healthData.status}`);
        console.log(`   Platform: ${healthData.platform}`);
        console.log(`   System Phase: ${healthData.system?.phase || 'unknown'}`);
        console.log(`   Database Status: ${healthData.database?.status || 'unknown'}`);
        
        testResults.details.health = {
          success: true,
          status: healthData.status,
          systemPhase: healthData.system?.phase,
          databaseStatus: healthData.database?.status
        };
        testResults.passed++;
      } else {
        console.log(`❌ Health endpoint missing required fields: ${missingFields.join(', ')}`);
        testResults.details.health = {
          success: false,
          error: `Missing fields: ${missingFields.join(', ')}`
        };
        testResults.failed++;
      }
    } else {
      console.log(`❌ Health endpoint returned status ${response.status}`);
      testResults.details.health = {
        success: false,
        error: `HTTP ${response.status}`
      };
      testResults.failed++;
    }
  } catch (error) {
    console.log(`❌ Health endpoint test failed: ${error.message}`);
    testResults.details.health = {
      success: false,
      error: error.message
    };
    testResults.failed++;
  }
  
  testResults.total++;
}

/**
 * Test metrics endpoint
 */
async function testMetricsEndpoint() {
  console.log('\n📊 Testing Metrics Endpoint...');
  
  try {
    const response = await makeRequest('/api/metrics');
    
    if (response.status === 200) {
      const metricsData = response.data;
      
      // Validate metrics response structure
      if (metricsData.metrics && metricsData.system) {
        console.log('✅ Metrics endpoint working correctly');
        console.log(`   Metrics Count: ${metricsData.metrics.raw?.length || 0}`);
        console.log(`   System Info: ${metricsData.system.platform || 'unknown'}`);
        
        testResults.details.metrics = {
          success: true,
          metricsCount: metricsData.metrics.raw?.length || 0
        };
        testResults.passed++;
      } else {
        console.log('❌ Metrics endpoint missing required data structure');
        testResults.details.metrics = {
          success: false,
          error: 'Invalid metrics data structure'
        };
        testResults.failed++;
      }
    } else {
      console.log(`❌ Metrics endpoint returned status ${response.status}`);
      testResults.details.metrics = {
        success: false,
        error: `HTTP ${response.status}`
      };
      testResults.failed++;
    }
  } catch (error) {
    console.log(`❌ Metrics endpoint test failed: ${error.message}`);
    testResults.details.metrics = {
      success: false,
      error: error.message
    };
    testResults.failed++;
  }
  
  testResults.total++;
}

/**
 * Test integration endpoint
 */
async function testIntegrationEndpoint() {
  console.log('\n🧪 Testing Integration Endpoint...');
  
  try {
    const response = await makeRequest('/api/test/integration');
    
    if (response.status === 200) {
      const integrationData = response.data;
      
      if (integrationData.data && integrationData.data.overallSuccess !== undefined) {
        const testData = integrationData.data;
        console.log('✅ Integration endpoint working correctly');
        console.log(`   Overall Success: ${testData.overallSuccess}`);
        console.log(`   Tests Passed: ${testData.passedTests}/${testData.totalTests}`);
        console.log(`   Execution Time: ${testData.executionTime}ms`);
        
        // Show detailed test results
        if (testData.testResults) {
          Object.entries(testData.testResults).forEach(([testName, result]) => {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${status} ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
          });
        }
        
        testResults.details.integration = {
          success: true,
          overallSuccess: testData.overallSuccess,
          passedTests: testData.passedTests,
          totalTests: testData.totalTests
        };
        testResults.passed++;
      } else {
        console.log('❌ Integration endpoint missing required data structure');
        testResults.details.integration = {
          success: false,
          error: 'Invalid integration test data structure'
        };
        testResults.failed++;
      }
    } else {
      console.log(`❌ Integration endpoint returned status ${response.status}`);
      testResults.details.integration = {
        success: false,
        error: `HTTP ${response.status}`
      };
      testResults.failed++;
    }
  } catch (error) {
    console.log(`❌ Integration endpoint test failed: ${error.message}`);
    testResults.details.integration = {
      success: false,
      error: error.message
    };
    testResults.failed++;
  }
  
  testResults.total++;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Beauty Crafter Enterprise Platform - Integration Test Suite');
  console.log('=' .repeat(60));
  console.log(`Testing endpoints at: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    await testHealthEndpoint();
    await testMetricsEndpoint();
    await testIntegrationEndpoint();
  } catch (error) {
    console.log(`❌ Test execution failed: ${error.message}`);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%`);
  
  // Print detailed results
  console.log('\n📊 DETAILED RESULTS:');
  Object.entries(testResults.details).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${testName.toUpperCase()}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite execution failed:', error);
  process.exit(1);
}); 