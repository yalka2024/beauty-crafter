import { NextRequest, NextResponse } from 'next/server'

interface SecurityHeadersConfig {
  csp: {
    enabled: boolean
    reportOnly: boolean
    directives: {
      defaultSrc: string[]
      scriptSrc: string[]
      styleSrc: string[]
      imgSrc: string[]
      fontSrc: string[]
      connectSrc: string[]
      frameSrc: string[]
      objectSrc: string[]
      mediaSrc: string[]
      manifestSrc: string[]
      workerSrc: string[]
      childSrc: string[]
      formAction: string[]
      frameAncestors: string[]
      baseUri: string[]
      upgradeInsecureRequests: boolean
      blockAllMixedContent: boolean
    }
  }
  hsts: {
    enabled: boolean
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  permissionsPolicy: {
    enabled: boolean
    features: Record<string, string[]>
  }
  cors: {
    enabled: boolean
    origins: string[]
    methods: string[]
    headers: string[]
    credentials: boolean
  }
}

const defaultSecurityConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    reportOnly: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for Next.js development
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://js.stripe.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "https://images.unsplash.com",
        "https://via.placeholder.com"
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "https://www.google-analytics.com",
        "https://api.stripe.com",
        "https://api.openai.com",
        "wss:",
        "ws:"
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: true,
      blockAllMixedContent: true
    }
  },
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  permissionsPolicy: {
    enabled: true,
    features: {
      camera: [],
      microphone: [],
      geolocation: ["'self'"],
      payment: ["'self'"],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
      ambientLightSensor: [],
      autoplay: ["'self'"],
      encryptedMedia: ["'self'"],
      fullscreen: ["'self'"],
      pictureInPicture: ["'self'"],
      syncXhr: []
    }
  },
  cors: {
    enabled: true,
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    credentials: true
  }
}

export function generateCSPHeader(config: SecurityHeadersConfig): string {
  if (!config.csp.enabled) return ''
  
  const { directives } = config.csp
  const parts: string[] = []
  
  // Add all directives
  Object.entries(directives).forEach(([key, value]) => {
    if (key === 'upgradeInsecureRequests' && value) {
      parts.push('upgrade-insecure-requests')
    } else if (key === 'blockAllMixedContent' && value) {
      parts.push('block-all-mixed-content')
    } else if (Array.isArray(value) && value.length > 0) {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      parts.push(`${directiveName} ${value.join(' ')}`)
    }
  })
  
  return parts.join('; ')
}

export function generateHSTSHeader(config: SecurityHeadersConfig): string {
  if (!config.hsts.enabled) return ''
  
  const { maxAge, includeSubDomains, preload } = config.hsts
  let header = `max-age=${maxAge}`
  
  if (includeSubDomains) {
    header += '; includeSubDomains'
  }
  
  if (preload) {
    header += '; preload'
  }
  
  return header
}

export function generatePermissionsPolicyHeader(config: SecurityHeadersConfig): string {
  if (!config.permissionsPolicy.enabled) return ''
  
  const { features } = config.permissionsPolicy
  const parts: string[] = []
  
  Object.entries(features).forEach(([feature, allowlist]) => {
    if (allowlist.length === 0) {
      parts.push(`${feature}=()`)
    } else {
      parts.push(`${feature}=(${allowlist.join(' ')})`)
    }
  })
  
  return parts.join(', ')
}

export function generateCORSHeaders(config: SecurityHeadersConfig, origin?: string): Record<string, string> {
  if (!config.cors.enabled) return {}
  
  const { origins, methods, headers, credentials } = config.cors
  const corsHeaders: Record<string, string> = {}
  
  // Check if origin is allowed
  const isAllowedOrigin = !origin || origins.includes(origin) || origins.includes('*')
  
  if (isAllowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin || '*'
    corsHeaders['Access-Control-Allow-Methods'] = methods.join(', ')
    corsHeaders['Access-Control-Allow-Headers'] = headers.join(', ')
    
    if (credentials) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true'
    }
  }
  
  return corsHeaders
}

export function applyEnhancedSecurityHeaders(
  request: NextRequest,
  config: SecurityHeadersConfig = defaultSecurityConfig
): NextResponse {
  const response = NextResponse.next()
  const origin = request.headers.get('origin')
  
  // Content Security Policy
  if (config.csp.enabled) {
    const cspHeader = generateCSPHeader(config)
    if (cspHeader) {
      const headerName = config.csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
      response.headers.set(headerName, cspHeader)
    }
  }
  
  // HTTP Strict Transport Security
  if (config.hsts.enabled && request.nextUrl.protocol === 'https:') {
    const hstsHeader = generateHSTSHeader(config)
    if (hstsHeader) {
      response.headers.set('Strict-Transport-Security', hstsHeader)
    }
  }
  
  // Permissions Policy
  if (config.permissionsPolicy.enabled) {
    const permissionsHeader = generatePermissionsPolicyHeader(config)
    if (permissionsHeader) {
      response.headers.set('Permissions-Policy', permissionsHeader)
    }
  }
  
  // CORS headers
  if (config.cors.enabled) {
    const corsHeaders = generateCORSHeaders(config, origin || undefined)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  // Remove server information
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')
  
  // Add custom security headers
  response.headers.set('X-Platform', 'Beauty Crafter')
  response.headers.set('X-Owner', 'Kryst Investments LLC')
  response.headers.set('X-Version', process.env.APP_VERSION || '1.0.0')
  
  return response
}

export function createSecurityMiddleware(config?: Partial<SecurityHeadersConfig>) {
  const mergedConfig = {
    ...defaultSecurityConfig,
    ...config
  }
  
  return (request: NextRequest) => {
    return applyEnhancedSecurityHeaders(request, mergedConfig)
  }
}
