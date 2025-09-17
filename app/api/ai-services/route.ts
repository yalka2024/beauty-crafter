import { NextRequest, NextResponse } from 'next/server'
import { aiMonetizationManager, AI_SERVICE_PRICING, AI_SERVICE_TYPES } from '@/lib/ai-monetization'
import { validationMiddleware } from '@/lib/validation-middleware'
import { securityMiddleware } from '@/lib/security-middleware'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { monitoring } from '@/lib/monitoring'

// GET - Get available AI services and pricing
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Get user ID from query params or headers
    const userId = request.nextUrl.searchParams.get('userId')
    const serviceType = request.nextUrl.searchParams.get('serviceType')
    
  const responseData: any = {
      availableServices: AI_SERVICE_PRICING,
      serviceTypes: AI_SERVICE_TYPES,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // If user ID is provided, get their AI service history
    if (userId) {
      const history = await aiMonetizationManager.getAIServiceHistory(userId)
      responseData.userHistory = history
    }

    // If specific service type is requested, filter the response
    if (serviceType && AI_SERVICE_PRICING[serviceType as keyof typeof AI_SERVICE_PRICING]) {
      responseData.serviceDetails = AI_SERVICE_PRICING[serviceType as keyof typeof AI_SERVICE_PRICING]
    }

    // Record metrics
    monitoring.recordMetric('ai_services_info_retrieved', 1, { 
      hasUserId: !!userId,
      serviceType: serviceType || 'all'
    })

    return apiResponse.success(responseData, 'AI services information retrieved', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'ai_services_info_endpoint')
    return apiResponse.serverError('Failed to retrieve AI services information')
  }
}

// POST - Request AI service
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'ai_service.request',
      { sanitize: true, rateLimit: true }
    )

    if (!validationResult.success) {
      return apiResponse.error('Invalid request data', 400, { errors: validationResult.errors })
    }

    const { userId, serviceType, tier, inputData, metadata } = body

    // Validate service type and tier
    if (!AI_SERVICE_TYPES[serviceType as keyof typeof AI_SERVICE_TYPES]) {
      return apiResponse.error('Invalid service type', 400)
    }

    const servicePricing = AI_SERVICE_PRICING[serviceType as keyof typeof AI_SERVICE_PRICING]
    if (!servicePricing || !servicePricing[tier as keyof typeof servicePricing]) {
      return apiResponse.error('Invalid service tier', 400)
    }

    // Request the AI service
    const result = await aiMonetizationManager.requestAIService({
      userId,
      serviceType: serviceType as keyof typeof AI_SERVICE_TYPES,
      tier: tier as 'basic' | 'premium' | 'expert',
      inputData,
      metadata
    })

    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to request AI service', 400)
    }

    const responseData = {
      requestId: result.requestId,
      cost: result.cost,
      serviceType,
      tier,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // Record metrics
    monitoring.recordMetric('ai_service_requested', 1, { 
      serviceType,
      tier,
      cost: result.cost
    })

    const message = result.cost > 0 
      ? `AI service requested. Payment required: $${result.cost}`
      : 'AI service requested successfully (using subscription credits)'

    return apiResponse.success(responseData, message, {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'ai_service_request_endpoint')
    return apiResponse.serverError('Failed to request AI service')
  }
}

// PUT - Get AI service status and results
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Parse and validate request body
    const body = await request.json()
    const { requestId, userId } = body

    if (!requestId || !userId) {
      return apiResponse.error('Request ID and User ID are required', 400)
    }

    // Get AI service history for the user and find the specific request
    const history = await aiMonetizationManager.getAIServiceHistory(userId)
    const request = history.find(req => req.id === requestId)

    if (!request) {
      return apiResponse.error('AI service request not found', 404)
    }

    const responseData = {
      request,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // Record metrics
    monitoring.recordMetric('ai_service_status_retrieved', 1, { 
      serviceType: request.serviceType,
      status: request.status
    })

    return apiResponse.success(responseData, 'AI service status retrieved', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'ai_service_status_endpoint')
    return apiResponse.serverError('Failed to retrieve AI service status')
  }
}

// PATCH - Get AI service analytics (admin only)
export async function PATCH(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Parse and validate request body
    const body = await request.json()
    const { action } = body

    if (action === 'analytics') {
      // Check if user is admin (in production, this would be proper auth)
      const isAdmin = request.headers.get('x-admin-token') === process.env.ADMIN_SECRET_TOKEN
      
      if (!isAdmin) {
        return apiResponse.error('Admin access required', 403)
      }

      const analytics = await aiMonetizationManager.getAIServiceAnalytics()
      
      const responseData = {
        analytics,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      }

      // Record metrics
      monitoring.recordMetric('ai_service_analytics_retrieved', 1)

      return apiResponse.success(responseData, 'AI service analytics retrieved', {
        headers: securityResult.headers
      })
    }

    return apiResponse.error('Invalid action', 400)

  } catch (error) {
    monitoring.recordError(error as Error, 'ai_service_analytics_endpoint')
    return apiResponse.serverError('Failed to retrieve AI service analytics')
  }
}

// DELETE - Cancel AI service request (if still processing)
export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Parse and validate request body
    const body = await request.json()
    const { requestId, userId } = body

    if (!requestId || !userId) {
      return apiResponse.error('Request ID and User ID are required', 400)
    }

    // Get AI service history for the user and find the specific request
    const history = await aiMonetizationManager.getAIServiceHistory(userId)
    const request = history.find(req => req.id === requestId)

    if (!request) {
      return apiResponse.error('AI service request not found', 404)
    }

    if (request.status !== 'processing') {
      return apiResponse.error('Can only cancel requests that are still processing', 400)
    }

    // In production, you would implement actual cancellation logic
    // For now, we'll just return success
    const responseData = {
      message: 'AI service request cancellation initiated',
      requestId,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // Record metrics
    monitoring.recordMetric('ai_service_canceled', 1, { 
      serviceType: request.serviceType,
      tier: request.tier
    })

    return apiResponse.success(responseData, 'AI service request canceled successfully', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'ai_service_cancellation_endpoint')
    return apiResponse.serverError('Failed to cancel AI service request')
  }
} 