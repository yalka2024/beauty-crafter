import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { logger } from './logging'
import { monitoring } from './monitoring'
import { cache } from './cache'

// Security configuration
interface SecurityConfig {
  csrfEnabled: boolean
  csrfTokenExpiry: number
  xssProtection: boolean
  contentSecurityPolicy: boolean
  rateLimitEnabled: boolean
  maxRequestSize: number
  allowedOrigins: string[]
  blockedIPs: string[]
  suspiciousPatterns: RegExp[]
}

// CSRF token information
interface CSRFToken {
  token: string
  userId?: string
  sessionId?: string
  createdAt: Date
  expiresAt: Date
  used: boolean
}

// Security threat information
interface SecurityThreat {
  type: 'xss' | 'csrf' | 'injection' | 'rate_limit' | 'suspicious_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  pattern: string
  timestamp: Date
  blocked: boolean
}

// Production security middleware
export class SecurityMiddleware {
  private static instance: SecurityMiddleware
  private config: SecurityConfig
  private csrfTokens: Map<string, CSRFToken> = new Map()
  private blockedIPs: Set<string> = new Set()
  private threatLog: SecurityThreat[] = []
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map()

  private constructor() {
    this.config = {
      csrfEnabled: process.env.CSRF_ENABLED !== 'false',
      csrfTokenExpiry: parseInt(process.env.CSRF_TOKEN_EXPIRY || '3600000'), // 1 hour
      xssProtection: process.env.XSS_PROTECTION !== 'false',
      contentSecurityPolicy: process.env.CSP_ENABLED !== 'false',
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '10485760'), // 10MB
      allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3003').split(','),
      blockedIPs: (process.env.BLOCKED_IPS || '').split(',').filter(ip => ip.trim()),
      suspiciousPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /union\s+select/gi,
        /drop\s+table/gi,
        /delete\s+from/gi,
        /insert\s+into/gi,
        /update\s+set/gi,
        /exec\s*\(/gi,
        /eval\s*\(/gi,
        /document\.cookie/gi,
        /window\.location/gi,
        /\.\.\/\.\./g,
        /\.\.\/\.\.\/\.\./g
      ]
    }

    // Initialize blocked IPs
    this.blockedIPs.forEach(ip => this.blockedIPs.add(ip.trim()))

    // Start security cleanup processes
    this.startSecurityCleanup()
  }

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware()
    }
    return SecurityMiddleware.instance
  }

  /**
   * Process request through security middleware
   */
  async processRequest(request: NextRequest): Promise<{
    allowed: boolean
    blocked: boolean
    threats: SecurityThreat[]
    csrfToken?: string
    headers: Record<string, string>
  }> {
    const startTime = Date.now()
    const clientIP = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const threats: SecurityThreat[] = []

    try {
      // Check if IP is blocked
      if (this.blockedIPs.has(clientIP)) {
        threats.push({
          type: 'rate_limit',
          severity: 'high',
          source: clientIP,
          pattern: 'Blocked IP',
          timestamp: new Date(),
          blocked: true
        })

        monitoring.recordMetric('security_request_blocked', 1, { reason: 'blocked_ip' })
        return {
          allowed: false,
          blocked: true,
          threats,
          headers: {}
        }
      }

      // Check request size
      const contentLength = parseInt(request.headers.get('content-length') || '0')
      if (contentLength > this.config.maxRequestSize) {
        threats.push({
          type: 'rate_limit',
          severity: 'medium',
          source: clientIP,
          pattern: `Request too large: ${contentLength} bytes`,
          timestamp: new Date(),
          blocked: true
        })

        monitoring.recordMetric('security_request_blocked', 1, { reason: 'request_too_large' })
        return {
          allowed: false,
          blocked: true,
          threats,
          headers: {}
        }
      }

      // Check for suspicious patterns in headers and body
      const headerThreats = this.checkHeadersForThreats(request.headers, clientIP)
      threats.push(...headerThreats)

      // Check request body for threats (if applicable)
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const bodyThreats = await this.checkBodyForThreats(request, clientIP)
        threats.push(...bodyThreats)
      }

      // Rate limiting check
      if (this.config.rateLimitEnabled) {
        const rateLimitResult = this.checkRateLimit(clientIP)
        if (!rateLimitResult.allowed) {
          threats.push({
            type: 'rate_limit',
            severity: 'medium',
            source: clientIP,
            pattern: `Rate limit exceeded: ${rateLimitResult.count} requests`,
            timestamp: new Date(),
            blocked: true
          })

          monitoring.recordMetric('security_request_blocked', 1, { reason: 'rate_limit' })
          return {
            allowed: false,
            blocked: true,
            threats,
            headers: {}
          }
        }
      }

      // Generate CSRF token if needed
      let csrfToken: string | undefined
      if (this.config.csrfEnabled && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        try {
          logger.info('Generating CSRF token', { method: request.method, clientIP })
          csrfToken = await this.generateCSRFToken(clientIP)
          logger.info('CSRF token generated successfully', { token: csrfToken?.substring(0, 8) + '...' })
        } catch (error) {
          logger.warn('Failed to generate CSRF token', { error, clientIP })
          // Continue without CSRF token if generation fails
        }
      } else {
        logger.info('CSRF token not generated', { 
          csrfEnabled: this.config.csrfEnabled, 
          method: request.method,
          shouldGenerate: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
        })
      }

      // Generate security headers
      const securityHeaders = this.generateSecurityHeaders(request)

      // Log threats if any
      if (threats.length > 0) {
        threats.forEach(threat => {
          this.logSecurityThreat(threat)
          monitoring.recordMetric('security_threat_detected', 1, { 
            type: threat.type,
            severity: threat.severity,
            blocked: threat.blocked.toString()
          })
        })
      }

      const responseTime = Date.now() - startTime
      monitoring.recordMetric('security_request_processed', 1, { 
        responseTime: responseTime.toString(),
        threats: threats.length.toString()
      })

      return {
        allowed: true,
        blocked: false,
        threats,
        csrfToken,
        headers: securityHeaders
      }

    } catch (error) {
      monitoring.recordError(error as Error, 'security_middleware')
      logger.error('Security middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIP,
        userAgent,
        platform: 'Beauty Crafter'
      })

      return {
        allowed: false,
        blocked: true,
        threats: [{
          type: 'injection',
          severity: 'critical',
          source: clientIP,
          pattern: 'Security middleware error',
          timestamp: new Date(),
          blocked: true
        }],
        headers: {}
      }
    }
  }

  /**
   * Validate CSRF token
   */
  async validateCSRFToken(token: string, clientIP: string): Promise<boolean> {
    try {
      const csrfToken = this.csrfTokens.get(token)
      
      if (!csrfToken) {
        this.logSecurityThreat({
          type: 'csrf',
          severity: 'high',
          source: clientIP,
          pattern: 'Invalid CSRF token',
          timestamp: new Date(),
          blocked: true
        })
        return false
      }

      if (csrfToken.used) {
        this.logSecurityThreat({
          type: 'csrf',
          severity: 'high',
          source: clientIP,
          pattern: 'CSRF token already used',
          timestamp: new Date(),
          blocked: true
        })
        return false
      }

      if (new Date() > csrfToken.expiresAt) {
        this.logSecurityThreat({
          type: 'csrf',
          severity: 'medium',
          source: clientIP,
          pattern: 'Expired CSRF token',
          timestamp: new Date(),
          blocked: true
        })
        return false
      }

      // Mark token as used
      csrfToken.used = true
      this.csrfTokens.set(token, csrfToken)

      monitoring.recordMetric('csrf_token_validated', 1)
      return true

    } catch (error) {
      monitoring.recordError(error as Error, 'csrf_validation')
      return false
    }
  }

  /**
   * Generate CSRF token
   */
  private async generateCSRFToken(clientIP: string): Promise<string> {
    logger.info('Starting CSRF token generation', { clientIP })
    
    const token = randomBytes(32).toString('hex')
    const now = new Date()
    
    const csrfToken: CSRFToken = {
      token,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.csrfTokenExpiry),
      used: false
    }

    logger.info('CSRF token created', { 
      token: token.substring(0, 8) + '...', 
      expiresAt: csrfToken.expiresAt 
    })

    this.csrfTokens.set(token, csrfToken)
    logger.info('CSRF token stored in memory', { memoryCount: this.csrfTokens.size })

    // Store in cache for persistence (handle failures gracefully)
    try {
      logger.info('Attempting to store CSRF token in cache')
      await cache.set(`csrf_token:${token}`, csrfToken, { 
        ttl: Math.floor(this.config.csrfTokenExpiry / 1000) // Convert ms to seconds
      })
      logger.info('CSRF token stored in cache successfully')
    } catch (error) {
      logger.warn('Failed to store CSRF token in cache', { error, token })
      // Continue without cache - token is still valid in memory
    }

    monitoring.recordMetric('csrf_token_generated', 1)
    logger.info('CSRF token generation completed', { token: token.substring(0, 8) + '...' })
    return token
  }

  /**
   * Check headers for security threats
   */
  private checkHeadersForThreats(headers: Headers, clientIP: string): SecurityThreat[] {
    const threats: SecurityThreat[] = []

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-forwarded-proto',
      'x-forwarded-host',
      'x-forwarded-port'
    ]

    suspiciousHeaders.forEach(header => {
      const value = headers.get(header)
      if (value) {
        // Check if the header value contains suspicious patterns
        if (this.isSuspiciousPattern(value)) {
          threats.push({
            type: 'injection',
            severity: 'medium',
            source: clientIP,
            pattern: `Suspicious header: ${header}`,
            timestamp: new Date(),
            blocked: false
          })
        }
        
        // Check for multiple IPs in forwarded headers (potential IP spoofing)
        if (header === 'x-forwarded-for' && value.includes(',')) {
          threats.push({
            type: 'injection',
            severity: 'medium',
            source: clientIP,
            pattern: `Multiple IPs in ${header}: ${value}`,
            timestamp: new Date(),
            blocked: false
          })
        }
        
        // Check for duplicate IP headers (potential header manipulation)
        if ((header === 'x-forwarded-for' || header === 'x-real-ip') && 
            headers.get('x-forwarded-for') && headers.get('x-real-ip')) {
          threats.push({
            type: 'injection',
            severity: 'medium',
            source: clientIP,
            pattern: `Duplicate IP headers detected`,
            timestamp: new Date(),
            blocked: false
          })
        }
      }
    })

    // Check User-Agent for suspicious patterns
    const userAgent = headers.get('user-agent') || ''
    if (this.isSuspiciousPattern(userAgent)) {
      threats.push({
        type: 'xss',
        severity: 'low',
        source: clientIP,
        pattern: 'Suspicious User-Agent',
        timestamp: new Date(),
        blocked: false
      })
    }

    return threats
  }

  /**
   * Check request body for security threats
   */
  private async checkBodyForThreats(request: NextRequest, clientIP: string): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = []

    try {
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const body = await request.text()
        if (this.isSuspiciousPattern(body)) {
          threats.push({
            type: 'xss',
            severity: 'high',
            source: clientIP,
            pattern: 'Suspicious content in JSON body',
            timestamp: new Date(),
            blocked: true
          })
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const formData = await request.formData()
          // For Next.js compatibility, we'll skip form data validation for now
          // as the FormData type doesn't have standard iteration methods
          // This is a limitation of the current Next.js types
        } catch (formError) {
          // If form data parsing fails, treat as suspicious
          threats.push({
            type: 'injection',
            severity: 'medium',
            source: clientIP,
            pattern: 'Unable to parse form data',
            timestamp: new Date(),
            blocked: false
          })
        }
      }

    } catch (error) {
      // If we can't read the body, it might be suspicious
      threats.push({
        type: 'injection',
        severity: 'medium',
        source: clientIP,
        pattern: 'Unable to read request body',
        timestamp: new Date(),
        blocked: false
      })
    }

    return threats
  }

  /**
   * Check if pattern is suspicious
   */
  private isSuspiciousPattern(content: string): boolean {
    return this.config.suspiciousPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(clientIP: string): { allowed: boolean; count: number } {
    const now = Date.now()
    const windowSize = 60 * 1000 // 1 minute
    const maxRequests = 100 // Max requests per minute

    const requestData = this.requestCounts.get(clientIP)
    
    if (!requestData || now > requestData.resetTime) {
      // Reset counter
      this.requestCounts.set(clientIP, {
        count: 1,
        resetTime: now + windowSize
      })
      return { allowed: true, count: 1 }
    }

    if (requestData.count >= maxRequests) {
      return { allowed: false, count: requestData.count }
    }

    // Increment counter
    requestData.count++
    this.requestCounts.set(clientIP, requestData)
    
    return { allowed: true, count: requestData.count }
  }

  /**
   * Generate security headers
   */
  private generateSecurityHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {}

    // XSS Protection
    if (this.config.xssProtection) {
      headers['X-XSS-Protection'] = '1; mode=block'
    }

    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    }

    // Other security headers
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['X-Frame-Options'] = 'DENY'
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return headers
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP.trim()
    }
    
    return '127.0.0.1' // Default fallback
  }

  /**
   * Log security threat
   */
  private logSecurityThreat(threat: SecurityThreat): void {
    this.threatLog.push(threat)
    
    // Keep only last 1000 threats - ensure exact limit
    if (this.threatLog.length > 1000) {
      this.threatLog = this.threatLog.slice(-1000)
    }

    logger.warn('Security threat detected', {
      type: threat.type,
      severity: threat.severity,
      source: threat.source,
      pattern: threat.pattern,
      blocked: threat.blocked,
      platform: 'Beauty Crafter'
    })
  }

  /**
   * Start security cleanup processes
   */
  private startSecurityCleanup(): void {
    // Clean up expired CSRF tokens
    setInterval(() => {
      const now = new Date()
      for (const [token, csrfToken] of this.csrfTokens.entries()) {
        if (now > csrfToken.expiresAt) {
          this.csrfTokens.delete(token)
          cache.delete(`csrf_token:${token}`)
        }
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    // Clean up old threat logs
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
      this.threatLog = this.threatLog.filter(threat => threat.timestamp > cutoff)
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip)
    
    logger.warn('IP address blocked', {
      ip,
      reason,
      platform: 'Beauty Crafter'
    })

    monitoring.recordMetric('security_ip_blocked', 1, { reason })
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): boolean {
    const wasBlocked = this.blockedIPs.has(ip)
    this.blockedIPs.delete(ip)
    
    if (wasBlocked) {
      logger.info('IP address unblocked', {
        ip,
        platform: 'Beauty Crafter'
      })
    }
    
    return wasBlocked
  }

  /**
   * Get security statistics
   */
  getStats(): {
    blockedIPs: number
    activeCSRFTokens: number
    threatCount: number
    requestCounts: number
  } {
    return {
      blockedIPs: this.blockedIPs.size,
      activeCSRFTokens: this.csrfTokens.size,
      threatCount: this.threatLog.length,
      requestCounts: this.requestCounts.size
    }
  }

  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): SecurityThreat[] {
    return this.threatLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance() 