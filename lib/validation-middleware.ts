import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from './logging'
import { monitoring } from './monitoring'
import { rateLimit } from './rate-limit'

// Validation schemas
const commonSchemas = {
  // User input validation
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // ID validation
  uuid: z.string().uuid('Invalid UUID format'),
  numericId: z.string().regex(/^\d+$/, 'Invalid numeric ID'),
  
  // Date validation
  date: z.string().datetime('Invalid date format'),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine(data => new Date(data.start) < new Date(data.end), {
    message: 'Start date must be before end date'
  }),
  
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Search validation
  search: z.object({
    query: z.string().min(1, 'Search query cannot be empty').max(500, 'Search query too long'),
    filters: z.record(z.any()).optional(),
    includeInactive: z.boolean().default(false)
  })
}

// Request validation middleware
export class ValidationMiddleware {
  private static instance: ValidationMiddleware
  private schemas: Map<string, z.ZodSchema> = new Map()
  private sanitizers: Map<string, (data: any) => any> = new Map()

  private constructor() {
    this.initializeSchemas()
    this.initializeSanitizers()
  }

  public static getInstance(): ValidationMiddleware {
    if (!ValidationMiddleware.instance) {
      ValidationMiddleware.instance = new ValidationMiddleware()
    }
    return ValidationMiddleware.instance
  }

  /**
   * Initialize validation schemas
   */
  private initializeSchemas(): void {
    // User management schemas
    this.schemas.set('user.create', z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: commonSchemas.name,
      lastName: commonSchemas.name,
      phone: commonSchemas.phone.optional(),
      role: z.enum(['user', 'provider', 'admin']).default('user'),
      permissions: z.array(z.string()).default([])
    }))

    this.schemas.set('user.update', z.object({
      firstName: commonSchemas.name.optional(),
      lastName: commonSchemas.name.optional(),
      phone: commonSchemas.phone.optional(),
      role: z.enum(['user', 'provider', 'admin']).optional(),
      permissions: z.array(z.string()).optional()
    }))

    this.schemas.set('user.login', z.object({
      email: commonSchemas.email,
      password: commonSchemas.password
    }))

    // Service management schemas
    this.schemas.set('service.create', z.object({
      name: z.string().min(3, 'Service name must be at least 3 characters').max(200, 'Service name too long'),
      description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
      category: z.string().min(2, 'Category must be at least 2 characters').max(100, 'Category too long'),
      price: z.number().positive('Price must be positive'),
      duration: z.number().int().positive('Duration must be a positive integer'),
      isActive: z.boolean().default(true)
    }))

    this.schemas.set('service.update', z.object({
      name: z.string().min(3, 'Service name must be at least 3 characters').max(200, 'Service name too long').optional(),
      description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long').optional(),
      category: z.string().min(2, 'Category must be at least 2 characters').max(100, 'Category too long').optional(),
      price: z.number().positive('Price must be positive').optional(),
      duration: z.number().int().positive('Duration must be a positive integer').optional(),
      isActive: z.boolean().optional()
    }))

    // Booking management schemas
    this.schemas.set('booking.create', z.object({
      serviceId: commonSchemas.uuid,
      providerId: commonSchemas.uuid,
      scheduledDate: commonSchemas.date,
      scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      notes: z.string().max(1000, 'Notes too long').optional(),
      specialRequests: z.string().max(500, 'Special requests too long').optional()
    }))

    this.schemas.set('booking.update', z.object({
      scheduledDate: commonSchemas.date.optional(),
      scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
      notes: z.string().max(1000, 'Notes too long').optional(),
      specialRequests: z.string().max(500, 'Special requests too long').optional()
    }))

    // Review management schemas
    this.schemas.set('review.create', z.object({
      serviceId: commonSchemas.uuid,
      providerId: commonSchemas.uuid,
      rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
      comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long'),
      isAnonymous: z.boolean().default(false)
    }))

    this.schemas.set('review.update', z.object({
      rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
      comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long').optional(),
      isAnonymous: z.boolean().optional()
    }))

    // Payment schemas
    this.schemas.set('payment.create', z.object({
      amount: z.number().positive('Amount must be positive'),
      currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
      paymentMethod: z.enum(['card', 'paypal', 'bank_transfer']),
      description: z.string().max(500, 'Description too long'),
      metadata: z.record(z.any()).optional()
    }))

    // API key management schemas
    this.schemas.set('apikey.create', z.object({
      name: z.string().min(3, 'API key name must be at least 3 characters').max(100, 'API key name too long'),
      permissions: z.array(z.string()).min(1, 'At least one permission is required'),
      expiresAt: commonSchemas.date.optional()
    }))

    // Deployment management schemas
    this.schemas.set('deployment.create', z.object({
      environment: z.enum(['development', 'staging', 'production']),
      version: z.string().min(1, 'Version is required'),
      strategy: z.enum(['rolling', 'blue-green', 'canary']).default('rolling')
    }))

    this.schemas.set('deployment.rollback', z.object({
      environment: z.enum(['development', 'staging', 'production'])
    }))

    // Environment configuration schemas
    this.schemas.set('environment.update', z.object({
      environment: z.enum(['development', 'staging', 'production']),
      config: z.object({
        security: z.object({
          csrfEnabled: z.boolean().optional(),
          xssProtection: z.boolean().optional(),
          rateLimitEnabled: z.boolean().optional()
        }).optional(),
        performance: z.object({
          queryTimeout: z.number().positive().optional(),
          cacheWarmupEnabled: z.boolean().optional(),
          monitoringEnabled: z.boolean().optional()
        }).optional(),
        monitoring: z.object({
          prometheusEnabled: z.boolean().optional(),
          alertingEnabled: z.boolean().optional(),
          logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional()
        }).optional()
      })
    }))

    // Search and filter schemas
    this.schemas.set('search.services', z.object({
      query: commonSchemas.search.query,
      category: z.string().optional(),
      priceRange: z.object({
        min: z.number().min(0, 'Minimum price cannot be negative').optional(),
        max: z.number().positive('Maximum price must be positive').optional()
      }).optional(),
      location: z.string().optional(),
      availability: commonSchemas.dateRange.optional(),
      pagination: commonSchemas.pagination
    }))

    this.schemas.set('search.providers', z.object({
      query: commonSchemas.search.query,
      services: z.array(commonSchemas.uuid).optional(),
      location: z.string().optional(),
      rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
      availability: commonSchemas.dateRange.optional(),
      pagination: commonSchemas.pagination
    }))
  }

  /**
   * Initialize data sanitizers
   */
  private initializeSanitizers(): void {
    // HTML sanitization
    this.sanitizers.set('html', (data: string) => {
      if (typeof data !== 'string') return data
      
      // Remove potentially dangerous HTML tags and attributes
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim()
    })

    // SQL injection prevention
    this.sanitizers.set('sql', (data: string) => {
      if (typeof data !== 'string') return data
      
      // Remove SQL injection patterns
      const sqlPatterns = [
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /(;|\'|\"|`)/g
      ]
      
      return sqlPatterns.reduce((sanitized, pattern) => 
        sanitized.replace(pattern, ''), data
      ).trim()
    })

    // XSS prevention
    this.sanitizers.set('xss', (data: string) => {
      if (typeof data !== 'string') return data
      
      // Encode potentially dangerous characters
      return data
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim()
    })

    // Phone number sanitization
    this.sanitizers.set('phone', (data: string) => {
      if (typeof data !== 'string') return data
      
      // Remove all non-digit characters except +, -, (, ), and space
      return data.replace(/[^\d\s\-\(\)\+]/g, '').trim()
    })

    // Email sanitization
    this.sanitizers.set('email', (data: string) => {
      if (typeof data !== 'string') return data
      
      // Convert to lowercase and trim
      return data.toLowerCase().trim()
    })

    // Name sanitization
    this.sanitizers.set('name', (data: string) => {
      if (typeof data !== 'string') return data
      
      // Remove special characters and normalize whitespace
      return data
        .replace(/[^\w\s\-']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    })
  }

  /**
   * Validate request data against schema
   */
  async validateRequest(
    request: NextRequest,
    schemaName: string,
    options: {
      sanitize?: boolean
      rateLimit?: boolean
      logValidation?: boolean
    } = {}
  ): Promise<{
    success: boolean
    data?: any
    errors?: string[]
    sanitized?: boolean
  }> {
    const startTime = Date.now()
    
    try {
      // Rate limiting check
      if (options.rateLimit !== false) {
        const rateLimitResult = await rateLimit(request)
        if (!rateLimitResult.success) {
          monitoring.recordMetric('validation_rate_limited', 1)
          return {
            success: false,
            errors: ['Too many validation requests']
          }
        }
      }

      // Get schema
      const schema = this.schemas.get(schemaName)
      if (!schema) {
        monitoring.recordError(new Error(`Schema not found: ${schemaName}`), 'validation_schema_not_found')
        return {
          success: false,
          errors: [`Validation schema '${schemaName}' not found`]
        }
      }

      // Parse request body
      let requestData: any
      try {
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          requestData = await request.json()
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          requestData = Object.fromEntries(formData.entries())
        } else {
          requestData = {}
        }
      } catch (error) {
        monitoring.recordError(error as Error, 'validation_request_parsing')
        return {
          success: false,
          errors: ['Invalid request format']
        }
      }

      // Sanitize data if requested
      let sanitizedData = requestData
      if (options.sanitize) {
        sanitizedData = this.sanitizeData(requestData)
      }

      // Validate data
      const validationResult = schema.safeParse(sanitizedData)
      
      if (validationResult.success) {
        const responseTime = Date.now() - startTime
        
        // Record successful validation
        monitoring.recordMetric('validation_success', 1, { 
          schema: schemaName,
          responseTime: responseTime.toString()
        })

        if (options.logValidation) {
          logger.info('Request validation successful', {
            schema: schemaName,
            responseTime: `${responseTime}ms`,
            platform: 'Beauty Crafter'
          })
        }

        return {
          success: true,
          data: validationResult.data,
          sanitized: options.sanitize
        }
      } else {
        const errors = validationResult.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        )
        
        const responseTime = Date.now() - startTime
        
        // Record validation failure
        monitoring.recordMetric('validation_failure', 1, { 
          schema: schemaName,
          errorCount: errors.length.toString()
        })

        if (options.logValidation) {
          logger.warn('Request validation failed', {
            schema: schemaName,
            errors,
            responseTime: `${responseTime}ms`,
            platform: 'Beauty Crafter'
          })
        }

        return {
          success: false,
          errors,
          sanitized: options.sanitize
        }
      }

    } catch (error) {
      monitoring.recordError(error as Error, 'validation_middleware')
      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        schema: schemaName,
        platform: 'Beauty Crafter'
      })

      return {
        success: false,
        errors: ['Validation system error']
      }
    }
  }

  /**
   * Sanitize data using registered sanitizers
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Apply all sanitizers to strings
      let sanitized = data
      for (const sanitizer of this.sanitizers.values()) {
        sanitized = sanitizer(sanitized)
      }
      return sanitized
    } else if (Array.isArray(data)) {
      // Recursively sanitize arrays
      return data.map(item => this.sanitizeData(item))
    } else if (typeof data === 'object' && data !== null) {
      // Recursively sanitize objects
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value)
      }
      return sanitized
    }
    
    return data
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    totalSchemas: number
    totalSanitizers: number
    schemas: string[]
  } {
    return {
      totalSchemas: this.schemas.size,
      totalSanitizers: this.sanitizers.size,
      schemas: Array.from(this.schemas.keys())
    }
  }

  /**
   * Add custom validation schema
   */
  addSchema(name: string, schema: z.ZodSchema): void {
    this.schemas.set(name, schema)
    logger.info('Custom validation schema added', { 
      name, 
      platform: 'Beauty Crafter' 
    })
  }

  /**
   * Add custom sanitizer
   */
  addSanitizer(name: string, sanitizer: (data: any) => any): void {
    this.sanitizers.set(name, sanitizer)
    logger.info('Custom sanitizer added', { 
      name, 
      platform: 'Beauty Crafter' 
    })
  }
}

// Export singleton instance
export const validationMiddleware = ValidationMiddleware.getInstance()

// Export common schemas for direct use
export { commonSchemas } 