import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from './monitoring'
import { logger } from './logging'
import { cache } from './cache'

// Response status codes
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL = 'partial',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND = 'not_found',
  RATE_LIMITED = 'rate_limited',
  SERVER_ERROR = 'server_error'
}

// Response metadata
export interface ResponseMetadata {
  timestamp: string
  requestId: string
  processingTime: number
  cacheStatus?: 'hit' | 'miss' | 'bypass'
  version: string
  environment: string
}

// Standard API response structure
export interface ApiResponse<T = any> {
  status: ResponseStatus
  message: string
  data?: T
  errors?: Array<{
    field?: string
    message: string
    code: string
  }>
  metadata: ResponseMetadata
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Pagination parameters
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Enhanced API response handler
export class ApiResponseHandler {
  private static instance: ApiResponseHandler
  private version: string
  private environment: string

  private constructor() {
    this.version = process.env.APP_VERSION || '1.0.0'
    this.environment = process.env.NODE_ENV || 'development'
  }

  public static getInstance(): ApiResponseHandler {
    if (!ApiResponseHandler.instance) {
      ApiResponseHandler.instance = new ApiResponseHandler()
    }
    return ApiResponseHandler.instance
  }

  /**
   * Create a successful response
   */
  success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    options: {
      statusCode?: number
      cacheKey?: string
      ttl?: number
      tags?: string[]
      pagination?: PaginationParams & { total: number }
    } = {}
  ): NextResponse<ApiResponse<T>> {
    const { statusCode = 200, cacheKey, ttl, tags, pagination } = options
    const startTime = Date.now()

    // Cache the response if cacheKey is provided
    if (cacheKey && ttl) {
      cache.set(cacheKey, data, { ttl, tags })
    }

    const response: ApiResponse<T> = {
      status: ResponseStatus.SUCCESS,
      message,
      data,
      metadata: this.createMetadata(startTime, 'hit'),
      ...(pagination && this.createPaginationMetadata(pagination))
    }

    // Record metrics
    monitoring.recordMetric('api_response_success', 1, { statusCode: statusCode.toString() })
    monitoring.recordResponseTime(Date.now() - startTime, 'api_response')

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create an error response
   */
  error(
    message: string,
    statusCode: number = 500,
    errors?: Array<{ field?: string; message: string; code: string }>,
    options: {
      requestId?: string
      context?: string
    } = {}
  ): NextResponse<ApiResponse<null>> {
    const startTime = Date.now()
    const { requestId, context } = options

    let status: ResponseStatus
    switch (statusCode) {
      case 400:
        status = ResponseStatus.VALIDATION_ERROR
        break
      case 401:
        status = ResponseStatus.AUTHENTICATION_ERROR
        break
      case 403:
        status = ResponseStatus.AUTHORIZATION_ERROR
        break
      case 404:
        status = ResponseStatus.NOT_FOUND
        break
      case 429:
        status = ResponseStatus.RATE_LIMITED
        break
      case 500:
      default:
        status = ResponseStatus.SERVER_ERROR
        break
    }

    const response: ApiResponse<null> = {
      status,
      message,
      errors,
      metadata: this.createMetadata(startTime, undefined, requestId)
    }

    // Record error metrics
    monitoring.recordMetric('api_response_error', 1, { 
      statusCode: statusCode.toString(),
      status: status,
      context: context || 'unknown'
    })
    monitoring.recordError(new Error(message), context || 'api_response')

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create a validation error response
   */
  validationError(
    errors: Array<{ field?: string; message: string; code: string }>,
    message: string = 'Validation failed'
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 400, errors, { context: 'validation' })
  }

  /**
   * Create an authentication error response
   */
  authenticationError(message: string = 'Authentication required'): NextResponse<ApiResponse<null>> {
    return this.error(message, 401, undefined, { context: 'authentication' })
  }

  /**
   * Create an authorization error response
   */
  authorizationError(message: string = 'Insufficient permissions'): NextResponse<ApiResponse<null>> {
    return this.error(message, 403, undefined, { context: 'authorization' })
  }

  /**
   * Create a not found response
   */
  notFound(message: string = 'Resource not found'): NextResponse<ApiResponse<null>> {
    return this.error(message, 404, undefined, { context: 'not_found' })
  }

  /**
   * Create a rate limited response
   */
  rateLimited(message: string = 'Too many requests'): NextResponse<ApiResponse<null>> {
    return this.error(message, 429, undefined, { context: 'rate_limit' })
  }

  /**
   * Create a server error response
   */
  serverError(message: string = 'Internal server error'): NextResponse<ApiResponse<null>> {
    return this.error(message, 500, undefined, { context: 'server_error' })
  }

  /**
   * Create a partial success response (for batch operations)
   */
  partialSuccess<T>(
    data: T,
    message: string = 'Operation partially completed',
    errors: Array<{ field?: string; message: string; code: string }>,
    options: {
      statusCode?: number
      pagination?: PaginationParams & { total: number }
    } = {}
  ): NextResponse<ApiResponse<T>> {
    const { statusCode = 207, pagination } = options
    const startTime = Date.now()

    const response: ApiResponse<T> = {
      status: ResponseStatus.PARTIAL,
      message,
      data,
      errors,
      metadata: this.createMetadata(startTime),
      ...(pagination && this.createPaginationMetadata(pagination))
    }

    // Record partial success metrics
    monitoring.recordMetric('api_response_partial', 1, { statusCode: statusCode.toString() })

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create a cached response
   */
  cached<T>(
    data: T,
    message: string = 'Data retrieved from cache',
    options: {
      statusCode?: number
      cacheKey: string
      ttl?: number
      tags?: string[]
    } = {}
  ): NextResponse<ApiResponse<T>> {
    const { statusCode = 200, cacheKey, ttl, tags } = options
    const startTime = Date.now()

    // Update cache with fresh data
    if (ttl) {
      cache.set(cacheKey, data, { ttl, tags })
    }

    const response: ApiResponse<T> = {
      status: ResponseStatus.SUCCESS,
      message,
      data,
      metadata: this.createMetadata(startTime, 'hit')
    }

    // Record cache hit metrics
    monitoring.recordMetric('api_response_cached', 1)

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create metadata for response
   */
  private createMetadata(
    startTime: number,
    cacheStatus?: 'hit' | 'miss' | 'bypass',
    requestId?: string
  ): ResponseMetadata {
    return {
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId(),
      processingTime: Date.now() - startTime,
      cacheStatus,
      version: this.version,
      environment: this.environment
    }
  }

  /**
   * Create pagination metadata
   */
  private createPaginationMetadata(params: PaginationParams & { total: number }) {
    const { page, limit, total } = params
    const totalPages = Math.ceil(total / limit)

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Extract pagination parameters from request
   */
  extractPaginationParams(request: NextRequest): PaginationParams {
    const { searchParams } = new URL(request.url)
    
    return {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }
  }

  /**
   * Validate and sanitize pagination parameters
   */
  validatePaginationParams(params: PaginationParams): PaginationParams {
    return {
      page: Math.max(1, params.page),
      limit: Math.min(100, Math.max(1, params.limit)),
      sortBy: params.sortBy || undefined,
      sortOrder: ['asc', 'desc'].includes(params.sortOrder) ? params.sortOrder : 'desc'
    }
  }

  /**
   * Create a streaming response for large datasets
   */
  createStreamingResponse<T>(
    dataStream: AsyncIterable<T>,
    options: {
      statusCode?: number
      headers?: Record<string, string>
    } = {}
  ): Response {
    const { statusCode = 200, headers = {} } = options

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of dataStream) {
            const chunkStr = JSON.stringify(chunk) + '\n'
            controller.enqueue(new TextEncoder().encode(chunkStr))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        ...headers
      }
    })
  }

  /**
   * Create a file download response
   */
  createFileResponse(
    fileBuffer: Buffer | string,
    filename: string,
    contentType: string = 'application/octet-stream',
    options: {
      statusCode?: number
      headers?: Record<string, string>
    } = {}
  ): NextResponse {
    const { statusCode = 200, headers = {} } = options

    const response = new NextResponse(fileBuffer, {
      status: statusCode,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(fileBuffer).toString(),
        ...headers
      }
    })

    return response
  }

  /**
   * Create a redirect response
   */
  redirect(url: string, statusCode: number = 302): NextResponse {
    return NextResponse.redirect(url, statusCode)
  }

  /**
   * Create a permanent redirect response
   */
  permanentRedirect(url: string): NextResponse {
    return NextResponse.redirect(url, 301)
  }

  /**
   * Create a temporary redirect response
   */
  temporaryRedirect(url: string): NextResponse {
    return NextResponse.redirect(url, 307)
  }

  /**
   * Create a permanent temporary redirect response
   */
  permanentTemporaryRedirect(url: string): NextResponse {
    return NextResponse.redirect(url, 308)
  }
}

// Export singleton instance
export const apiResponse = ApiResponseHandler.getInstance()

// Utility functions for common response patterns
export const responseUtils = {
  /**
   * Create a success response with data
   */
  success: <T>(data: T, message?: string, options?: any) => 
    apiResponse.success(data, message, options),

  /**
   * Create an error response
   */
  error: (message: string, statusCode?: number, errors?: any[], options?: any) =>
    apiResponse.error(message, statusCode, errors, options),

  /**
   * Create a validation error response
   */
  validationError: (errors: any[], message?: string) =>
    apiResponse.validationError(errors, message),

  /**
   * Create an authentication error response
   */
  authError: (message?: string) =>
    apiResponse.authenticationError(message),

  /**
   * Create an authorization error response
   */
  forbidden: (message?: string) =>
    apiResponse.authorizationError(message),

  /**
   * Create a not found response
   */
  notFound: (message?: string) =>
    apiResponse.notFound(message),

  /**
   * Create a rate limited response
   */
  rateLimited: (message?: string) =>
    apiResponse.rateLimited(message),

  /**
   * Create a server error response
   */
  serverError: (message?: string) =>
    apiResponse.serverError(message)
}

// Response middleware for consistent handling
export function withApiResponse<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      const startTime = Date.now()
      const result = await handler(...args)
      
      // Record success metrics
      monitoring.recordMetric('api_handler_success', 1)
      monitoring.recordResponseTime(Date.now() - startTime, 'api_handler')
      
      return result
    } catch (error) {
      // Record error metrics
      monitoring.recordError(error as Error, 'api_handler')
      monitoring.recordMetric('api_handler_error', 1)
      
      throw error
    }
  }
} 