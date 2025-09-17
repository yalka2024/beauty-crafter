import { logger } from './logging'
import { monitoring } from './monitoring'

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  NETWORK = 'network',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ipAddress?: string
  timestamp: Date
  additionalData?: Record<string, any>
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly context: ErrorContext
  public readonly isOperational: boolean
  public readonly retryable: boolean

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context: Partial<ErrorContext> = {},
    isOperational: boolean = true,
    retryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.severity = severity
    this.category = category
    this.context = {
      timestamp: new Date(),
      ...context
    }
    this.isOperational = isOperational
    this.retryable = retryable

    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  public toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        severity: this.severity,
        category: this.category,
        timestamp: this.context.timestamp.toISOString(),
        requestId: this.context.requestId,
        endpoint: this.context.endpoint,
        method: this.context.method
      }
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, context: Partial<ErrorContext> = {}) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      context,
      true,
      false
    )
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context: Partial<ErrorContext> = {}) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHENTICATION,
      context,
      true,
      false
    )
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context: Partial<ErrorContext> = {}) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHORIZATION,
      context,
      true,
      false
    )
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error, context: Partial<ErrorContext> = {}) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE,
      context,
      true,
      true
    )
    this.name = 'DatabaseError'
    
    if (originalError) {
      this.message = `${message}: ${originalError.message}`
    }
  }
}

export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    service: string,
    statusCode?: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      'EXTERNAL_API_ERROR',
      statusCode || 502,
      ErrorSeverity.HIGH,
      ErrorCategory.EXTERNAL_API,
      { ...context, additionalData: { service } },
      true,
      true
    )
    this.name = 'ExternalAPIError'
  }
}

export class SystemError extends AppError {
  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(
      message,
      'SYSTEM_ERROR',
      500,
      ErrorSeverity.CRITICAL,
      ErrorCategory.SYSTEM,
      context,
      false,
      false
    )
    this.name = 'SystemError'
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      400,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      context,
      true,
      false
    )
    this.name = 'BusinessLogicError'
  }
}

export function handleError(error: Error | AppError, context: Partial<ErrorContext> = {}): void {
  let appError: AppError

  if (error instanceof AppError) {
    appError = error
    // Merge additional context
    appError.context = { ...appError.context, ...context }
  } else {
    // Convert generic errors to AppError
    appError = new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      ErrorSeverity.MEDIUM,
      ErrorCategory.UNKNOWN,
      context,
      false,
      false
    )
  }

  // Log the error
  logError(appError)

  // Record metrics
  monitoring.recordError(appError, appError.context.endpoint || 'unknown')

  // Send alerts for critical errors
  if (appError.severity === ErrorSeverity.CRITICAL) {
    sendCriticalErrorAlert(appError)
  }
}

export function logError(error: AppError): void {
  const logData = {
    error: {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack,
      severity: error.severity,
      category: error.category,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      retryable: error.retryable
    },
    context: error.context,
    timestamp: error.context.timestamp.toISOString()
  }

  switch (error.severity) {
    case ErrorSeverity.LOW:
      logger.debug('Low severity error:', logData)
      break
    case ErrorSeverity.MEDIUM:
      logger.warn('Medium severity error:', logData)
      break
    case ErrorSeverity.HIGH:
      logger.error('High severity error:', logData)
      break
    case ErrorSeverity.CRITICAL:
      logger.error('CRITICAL ERROR:', logData)
      break
    default:
      logger.error('Unknown severity error:', logData)
  }
}

export function sendCriticalErrorAlert(error: AppError): void {
  // In production, this would send alerts to your monitoring system
  // (e.g., Sentry, DataDog, PagerDuty, Slack, etc.)
  try {
    if (process.env.ALERT_WEBHOOK_URL) {
      fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: 'CRITICAL_ERROR',
          error: {
            code: error.code,
            message: error.message,
            severity: error.severity,
            category: error.category,
            endpoint: error.context.endpoint,
            method: error.context.method,
            userId: error.context.userId,
            requestId: error.context.requestId
          },
          timestamp: error.context.timestamp.toISOString(),
          environment: process.env.NODE_ENV
        })
      }).catch(webhookError => {
        logger.error('Failed to send critical error alert:', webhookError)
      })
    }
  } catch (alertError) {
    logger.error('Failed to send critical error alert:', alertError)
  }
}

export function createErrorResponse(error: AppError): Response {
  const statusCode = error.statusCode
  const body = error.toJSON()

  // Add additional headers for certain error types
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (error.retryable) {
    headers['Retry-After'] = '60'
  }

  if (error.category === ErrorCategory.AUTHENTICATION) {
    headers['WWW-Authenticate'] = 'Bearer'
  }

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers
  })
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export function shouldRetry(error: Error): boolean {
  if (error instanceof AppError) {
    return error.retryable
  }
  return false
}

// Error boundary for async operations
export function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<T> {
  return operation().catch(error => {
    handleError(error, context)
    throw error
  })
}

// Error boundary for sync operations
export function withErrorHandlingSync<T>(
  operation: () => T,
  context: Partial<ErrorContext> = {}
): T {
  try {
    return operation()
  } catch (error) {
    handleError(error as Error, context)
    throw error
  }
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ExternalAPIError,
  SystemError,
  BusinessLogicError,
  handleError,
  logError,
  createErrorResponse,
  isOperationalError,
  shouldRetry,
  withErrorHandling,
  withErrorHandlingSync,
  ErrorSeverity,
  ErrorCategory
} 