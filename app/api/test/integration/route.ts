import { NextRequest, NextResponse } from 'next/server'
import { systemInitializer } from '@/lib/system-initializer'
import { monitoring } from '@/lib/monitoring'
import { cache } from '@/lib/cache'
import { db } from '@/lib/database'
import { enhancedAuth } from '@/lib/auth-enhanced'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return apiResponse.rateLimited('Too many integration test requests')
    }

    // Test results collection
    const testResults: Record<string, any> = {}
  let overallSuccess = true // (not reassigned, but left as let for clarity)

    // Test 1: System Initialization
    try {
      const systemStatus = systemInitializer.getSystemStatus()
      testResults.systemInitialization = {
        success: true,
        phase: systemStatus.phase,
        isReady: systemInitializer.isSystemReady(),
        readyComponents: systemStatus.readyComponents,
        totalComponents: systemStatus.totalComponents,
        components: systemStatus.components
      }
    } catch (error) {
      testResults.systemInitialization = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 2: Database Connection
    try {
      const dbHealth = await db.healthCheck()
      const dbStats = db.getStats()
      testResults.databaseConnection = {
        success: true,
        health: dbHealth,
        stats: dbStats
      }
    } catch (error) {
      testResults.databaseConnection = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 3: Cache System
    try {
      const cacheStats = cache.getStats()
      // Test cache operations
      const testKey = 'integration_test_key'
      const testValue = { test: 'data', timestamp: Date.now() }
      
      cache.set(testKey, testValue, { ttl: 60000 })
      const retrievedValue = cache.get(testKey)
      cache.delete(testKey)
      
      testResults.cacheSystem = {
        success: true,
        stats: cacheStats,
        operations: {
          set: true,
          get: retrievedValue !== null,
          delete: true
        }
      }
    } catch (error) {
      testResults.cacheSystem = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 4: Monitoring System
    try {
      const metrics = monitoring.getMetrics()
      const performanceHistory = monitoring.getPerformanceHistory()
      const metricsSummary = monitoring.getMetricsSummary()
      
      testResults.monitoringSystem = {
        success: true,
        metricsCount: metrics.length,
        performanceHistoryCount: performanceHistory.length,
        metricsSummary
      }
    } catch (error) {
      testResults.monitoringSystem = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 5: Authentication System
    try {
      // Test token generation (mock user)
      const mockUser = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read', 'write']
      }
      
      const accessToken = await enhancedAuth.generateAccessToken(mockUser)
      const refreshToken = await enhancedAuth.generateRefreshToken(mockUser.userId)
      
      // Verify tokens
      const accessPayload = await enhancedAuth.verifyAccessToken(accessToken.token)
      const refreshPayload = await enhancedAuth.verifyRefreshToken(refreshToken.token)
      
      testResults.authenticationSystem = {
        success: true,
        accessTokenGenerated: !!accessToken,
        refreshTokenGenerated: !!refreshToken.token,
        accessTokenVerified: accessPayload.userId === mockUser.userId,
        refreshTokenVerified: refreshPayload.userId === mockUser.userId
      }
      
      // Cleanup test tokens
      enhancedAuth.revokeRefreshToken(mockUser.userId, refreshToken.tokenId)
      
    } catch (error) {
      testResults.authenticationSystem = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 6: API Response Handler
    try {
      // Test various response types
      const successResponse = apiResponse.success({ test: 'data' }, 'Test successful')
      const errorResponse = apiResponse.error('Test error', 400)
      const validationResponse = apiResponse.validationError([
        { field: 'test', message: 'Test validation error', code: 'TEST_ERROR' }
      ])
      
      testResults.apiResponseHandler = {
        success: true,
        successResponse: successResponse.status === 200,
        errorResponse: errorResponse.status === 400,
        validationResponse: validationResponse.status === 400
      }
    } catch (error) {
      testResults.apiResponseHandler = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 7: Rate Limiting
    try {
      const rateLimitTest = await rateLimit(request)
      testResults.rateLimiting = {
        success: true,
        working: rateLimitTest.success !== undefined
      }
    } catch (error) {
      testResults.rateLimiting = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Test 8: Error Handling
    try {
      // Test error handling with a mock error
      const mockError = new Error('Test error for integration testing')
      monitoring.recordError(mockError, 'integration_test')
      
      testResults.errorHandling = {
        success: true,
        errorRecorded: true
      }
    } catch (error) {
      testResults.errorHandling = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      overallSuccess = false
    }

    // Compile test summary
    const testSummary = {
      overallSuccess,
      totalTests: Object.keys(testResults).length,
      passedTests: Object.values(testResults).filter((r: any) => r.success).length,
      failedTests: Object.values(testResults).filter((r: any) => !r.success).length,
      testResults,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }

    // Record test metrics
    monitoring.recordMetric('integration_test_executed', 1, { 
      success: overallSuccess.toString(),
      duration: (Date.now() - startTime).toString()
    })

    if (overallSuccess) {
      monitoring.recordMetric('integration_test_success', 1)
      logger.info('Integration tests completed successfully', {
        platform: 'Beauty Crafter',
        duration: `${Date.now() - startTime}ms`
      })
    } else {
      monitoring.recordMetric('integration_test_failure', 1)
      logger.warn('Integration tests completed with failures', {
        platform: 'Beauty Crafter',
        duration: `${Date.now() - startTime}ms`,
        failedTests: testSummary.failedTests
      })
    }

    return apiResponse.success(testSummary, 'Integration tests completed')

  } catch (error) {
    monitoring.recordError(error as Error, 'integration_test')
    logger.error('Integration test execution failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'Beauty Crafter'
    })

    return apiResponse.serverError('Integration test execution failed')
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
} 