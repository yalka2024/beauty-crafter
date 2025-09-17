import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp: {
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
    formAction: string[]
    baseUri: string[]
    upgradeInsecureRequests: boolean
  }
  
  // Other security headers
  hsts: {
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  
  // Feature Policy
  featurePolicy: {
    camera: string[]
    microphone: string[]
    geolocation: string[]
    payment: string[]
    usb: string[]
    magnetometer: string[]
    gyroscope: string[]
    accelerometer: string[]
  }
}

export const defaultSecurityConfig: SecurityHeadersConfig = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'",   // Required for Next.js development
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS
      "https://fonts.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "https://images.unsplash.com",
      "https://www.google-analytics.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://fonts.googleapis.com"
    ],
    connectSrc: [
      "'self'",
      "https://api.beautycrafter.com",
      "https://www.google-analytics.com"
    ],
    frameSrc: [
      "'self'",
      "https://www.google.com",
      "https://www.youtube.com"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: true
  },
  
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  featurePolicy: {
    camera: ["'self'"],
    microphone: ["'self'"],
    geolocation: ["'self'"],
    payment: ["'self'"],
    usb: ["'self'"],
    magnetometer: ["'self'"],
    gyroscope: ["'self'"],
    accelerometer: ["'self'"]
  }
}

export function generateCSPHeader(config: SecurityHeadersConfig): string {
  const { csp } = config
  
  const directives = [
    `default-src ${csp.defaultSrc.join(' ')}`,
    `script-src ${csp.scriptSrc.join(' ')}`,
    `style-src ${csp.styleSrc.join(' ')}`,
    `img-src ${csp.imgSrc.join(' ')}`,
    `font-src ${csp.fontSrc.join(' ')}`,
    `connect-src ${csp.connectSrc.join(' ')}`,
    `frame-src ${csp.frameSrc.join(' ')}`,
    `object-src ${csp.objectSrc.join(' ')}`,
    `media-src ${csp.mediaSrc.join(' ')}`,
    `manifest-src ${csp.manifestSrc.join(' ')}`,
    `worker-src ${csp.workerSrc.join(' ')}`,
    `form-action ${csp.formAction.join(' ')}`,
    `base-uri ${csp.baseUri.join(' ')}`
  ]
  
  if (csp.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests')
  }
  
  return directives.join('; ')
}

export function generateFeaturePolicyHeader(config: SecurityHeadersConfig): string {
  const { featurePolicy } = config
  
  const policies = Object.entries(featurePolicy).map(([feature, sources]) => {
    return `${feature} ${sources.join(' ')}`
  })
  
  return policies.join('; ')
}

export function generateHSTSHeader(config: SecurityHeadersConfig): string {
  const { hsts } = config
  
  let header = `max-age=${hsts.maxAge}`
  
  if (hsts.includeSubDomains) {
    header += '; includeSubDomains'
  }
  
  if (hsts.preload) {
    header += '; preload'
  }
  
  return header
}

export function applySecurityHeaders(
  request: NextRequest,
  config: SecurityHeadersConfig = defaultSecurityConfig
): NextResponse {
  const response = NextResponse.next()
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', generateCSPHeader(config))
  
  // HTTP Strict Transport Security
  response.headers.set('Strict-Transport-Security', generateHSTSHeader(config))
  
  // Feature Policy (Permissions Policy in newer browsers)
  response.headers.set('Permissions-Policy', generateFeaturePolicyHeader(config))
  
  // X-Frame-Options (prevent clickjacking)
  response.headers.set('X-Frame-Options', 'DENY')
  
  // X-Content-Type-Options (prevent MIME type sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // X-XSS-Protection (enable XSS filtering)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Type Options
  response.headers.set('X-Download-Options', 'noopen')
  
  // X-Permitted-Cross-Domain-Policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  // Clear-Site-Data (for logout scenarios)
  // response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')
  
  // Cross-Origin Embedder Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  
  // Cross-Origin Opener Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  
  // Cross-Origin Resource Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  return response
}

export function createSecurityMiddleware(config?: SecurityHeadersConfig) {
  return function securityMiddleware(request: NextRequest) {
    return applySecurityHeaders(request, config)
  }
}

// Environment-specific configurations
export const productionSecurityConfig: SecurityHeadersConfig = {
  ...defaultSecurityConfig,
  csp: {
    ...defaultSecurityConfig.csp,
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ]
  }
}

export const developmentSecurityConfig: SecurityHeadersConfig = {
  ...defaultSecurityConfig,
  csp: {
    ...defaultSecurityConfig.csp,
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ]
  }
}

// Export the appropriate config based on environment
export const securityConfig = process.env.NODE_ENV === 'production' 
  ? productionSecurityConfig 
  : developmentSecurityConfig


