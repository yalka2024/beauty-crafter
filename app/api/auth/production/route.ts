import { NextRequest, NextResponse } from 'next/server'
import { productionAuth } from '@/lib/auth-production'
import { validationMiddleware } from '@/lib/validation-middleware'
import { securityMiddleware } from '@/lib/security-middleware'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { monitoring } from '@/lib/monitoring'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Step 1: Security Middleware Processing
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      monitoring.recordMetric('auth_request_blocked', 1, { 
        reason: securityResult.blocked ? 'security_threat' : 'security_error' 
      })
      
      return apiResponse.error(
        'Request blocked for security reasons',
        403,
        { threats: securityResult.threats }
      )
    }

    // Step 2: Request Validation
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'user.login',
      { sanitize: true, rateLimit: true, logValidation: true }
    )

    if (!validationResult.success) {
      monitoring.recordMetric('auth_validation_failed', 1, { 
        errorCount: validationResult.errors?.length.toString() || '0' 
      })
      
      return apiResponse.validationError(
        validationResult.errors || ['Validation failed']
      )
    }

    const { email, password } = validationResult.data

    // Step 3: Authentication Processing
    try {
      // Mock user authentication (in production, this would check against database)
      const mockUser = {
        userId: 'user-' + Date.now(),
        email,
        role: 'user',
        permissions: ['read', 'write']
      }

      // Create user session
      const clientIP = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const sessionId = productionAuth.createUserSession(mockUser, clientIP, userAgent)

      // Generate tokens
      const accessToken = await productionAuth.generateAccessToken(mockUser)
      const refreshToken = await productionAuth.generateRefreshToken(mockUser.userId)

      // Step 4: Success Response with Security Headers
      const responseData = {
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          role: mockUser.role,
          permissions: mockUser.permissions
        },
        session: {
          id: sessionId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        },
        tokens: {
          accessToken,
          refreshToken: refreshToken,
          expiresIn: 15 * 60, // 15 minutes
          refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days
        }
      }

      // Add security headers
      const responseHeaders = {
        ...securityResult.headers,
        'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`,
        'X-Auth-Status': 'success',
        'X-Session-ID': sessionId
      }

      // Record successful authentication
      monitoring.recordMetric('auth_login_success', 1, { 
        userId: mockUser.userId,
        responseTime: (Date.now() - startTime).toString()
      })

      logger.info('User authentication successful', {
        userId: mockUser.userId,
        email: mockUser.email,
        clientIP,
        responseTime: Date.now() - startTime,
        platform: 'Beauty Crafter'
      })

      return apiResponse.success(responseData, 'Authentication successful', {
        headers: responseHeaders
      })

    } catch (authError) {
      monitoring.recordError(authError as Error, 'auth_processing')
      logger.error('Authentication processing failed', {
        error: authError instanceof Error ? authError.message : 'Unknown error',
        email,
        clientIP: getClientIP(request),
        platform: 'Beauty Crafter'
      })

      return apiResponse.error('Authentication failed', 401)
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'auth_endpoint')
    logger.error('Authentication endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'Beauty Crafter'
    })

    return apiResponse.serverError('Authentication system error')
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Step 1: Security Middleware Processing
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Step 2: Validate refresh token request
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'user.refresh',
      { sanitize: true, rateLimit: true }
    )

    if (!validationResult.success) {
      return apiResponse.validationError(
        validationResult.errors || ['Invalid refresh request']
      )
    }

    const { refreshToken } = validationResult.data

    // Step 3: Refresh tokens
    try {
      const newTokens = await productionAuth.refreshAccessToken(refreshToken)
      
      const responseData = {
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: 15 * 60, // 15 minutes
          refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days
        }
      }

      monitoring.recordMetric('auth_token_refresh_success', 1)
      
      return apiResponse.success(responseData, 'Tokens refreshed successfully', {
        headers: securityResult.headers
      })

    } catch (refreshError) {
      monitoring.recordError(refreshError as Error, 'token_refresh')
      return apiResponse.error('Token refresh failed', 401)
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'auth_refresh_endpoint')
    return apiResponse.serverError('Token refresh system error')
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Step 1: Security Middleware Processing
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Step 2: Validate logout request
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'user.logout',
      { sanitize: true, rateLimit: true }
    )

    if (!validationResult.success) {
      return apiResponse.validationError(
        validationResult.errors || ['Invalid logout request']
      )
    }

    const { sessionId, refreshToken } = validationResult.data

    // Step 3: Process logout
    try {
      // Destroy session
      if (sessionId) {
        productionAuth.destroyUserSession(sessionId)
      }

      // Revoke refresh token
      if (refreshToken) {
        // Extract user ID from token (in production, you'd decode the JWT)
        const mockUserId = 'user-' + Date.now() // This would be extracted from the token
        await productionAuth.revokeRefreshToken(mockUserId, refreshToken)
      }

      monitoring.recordMetric('auth_logout_success', 1)
      
      return apiResponse.success({}, 'Logout successful', {
        headers: {
          ...securityResult.headers,
          'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
          'X-Auth-Status': 'logged_out'
        }
      })

    } catch (logoutError) {
      monitoring.recordError(logoutError as Error, 'logout_processing')
      return apiResponse.error('Logout processing failed', 500)
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'auth_logout_endpoint')
    return apiResponse.serverError('Logout system error')
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Step 1: Security Middleware Processing
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Step 2: Get authentication statistics
    const authStats = productionAuth.getStats()
    const securityStats = securityMiddleware.getStats()
    const validationStats = validationMiddleware.getStats()

    const responseData = {
      authentication: {
        activeSessions: authStats.activeSessions,
        activeAPIKeys: authStats.activeAPIKeys,
        blacklistedTokens: authStats.blacklistedTokens
      },
      security: {
        blockedIPs: securityStats.blockedIPs,
        activeCSRFTokens: securityStats.activeCSRFTokens,
        threatCount: securityStats.threatCount,
        recentThreats: securityMiddleware.getRecentThreats(10)
      },
      validation: {
        totalSchemas: validationStats.totalSchemas,
        totalSanitizers: validationStats.totalSanitizers,
        availableSchemas: validationStats.schemas
      },
      system: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        platform: 'Beauty Crafter Enterprise Platform'
      }
    }

    monitoring.recordMetric('auth_stats_retrieved', 1)
    
    return apiResponse.success(responseData, 'Authentication statistics retrieved', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'auth_stats_endpoint')
    return apiResponse.serverError('Statistics retrieval error')
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return '127.0.0.1'
} 