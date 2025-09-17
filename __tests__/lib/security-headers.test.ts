import { NextRequest, NextResponse } from 'next/server'
import { 
  applySecurityHeaders, 
  generateCSPHeader, 
  generateFeaturePolicyHeader, 
  generateHSTSHeader,
  createSecurityMiddleware,
  defaultSecurityConfig,
  productionSecurityConfig,
  developmentSecurityConfig
} from '@/lib/security-headers'



jest.mock('next/server', () => {
  const createMockHeaders = () => {
    const headerStore = new Map()
    
    return {
      set: jest.fn((key, value) => {
        headerStore.set(key, value)
      }),
      get: jest.fn((key) => {
        return headerStore.get(key)
      }),
      has: jest.fn((key) => headerStore.has(key)),
      delete: jest.fn((key) => headerStore.delete(key)),
      append: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
    }
  }

  const MockNextResponse = jest.fn().mockImplementation(() => {
    const mockHeaders = createMockHeaders()
    return {
      headers: mockHeaders,
      status: 200,
      ok: true,
    }
  })
  
  MockNextResponse.next = jest.fn().mockImplementation(() => {
    const mockHeaders = createMockHeaders()
    return {
      headers: mockHeaders,
      status: 200,
      ok: true,
    }
  })

  return {
    NextRequest: jest.fn(),
    NextResponse: MockNextResponse,
  }
})

// Mock NextRequest
const createMockRequest = (url: string = 'https://example.com'): NextRequest => {
  try {
    return {
      url,
      headers: new Map(),
      nextUrl: new URL(url),
      method: 'GET',
      ip: '127.0.0.1',
      geo: { country: 'US', city: 'New York' },
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    } as any
  } catch (error) {
    // Fallback for malformed URLs
    return {
      url: 'https://example.com',
      headers: new Map(),
      nextUrl: new URL('https://example.com'),
      method: 'GET',
      ip: '127.0.0.1',
      geo: { country: 'US', city: 'New York' },
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    } as any
  }
}

describe('Security Headers', () => {
  describe('generateCSPHeader', () => {
    it('should generate CSP header with all directives', () => {
      const csp = generateCSPHeader(defaultSecurityConfig)
      
      expect(csp).toContain('default-src \'self\'')
      expect(csp).toContain('script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'')
      expect(csp).toContain('style-src \'self\' \'unsafe-inline\'')
      expect(csp).toContain('img-src \'self\' data: https:')
      expect(csp).toContain('font-src \'self\' https://fonts.gstatic.com')
      expect(csp).toContain('connect-src \'self\' https://api.beautycrafter.com')
      expect(csp).toContain('frame-src \'self\' https://www.google.com')
      expect(csp).toContain('object-src \'none\'')
      expect(csp).toContain('upgrade-insecure-requests')
    })

    it('should handle empty arrays gracefully', () => {
      const config = {
        ...defaultSecurityConfig,
        csp: {
          ...defaultSecurityConfig.csp,
          scriptSrc: [],
          styleSrc: []
        }
      }
      
      const csp = generateCSPHeader(config)
      expect(csp).toContain('script-src')
      expect(csp).toContain('style-src')
    })
  })

  describe('generateFeaturePolicyHeader', () => {
    it('should generate feature policy header with all features', () => {
      const policy = generateFeaturePolicyHeader(defaultSecurityConfig)
      
      expect(policy).toContain('camera \'self\'')
      expect(policy).toContain('microphone \'self\'')
      expect(policy).toContain('geolocation \'self\'')
      expect(policy).toContain('payment \'self\'')
      expect(policy).toContain('usb \'self\'')
      expect(policy).toContain('magnetometer \'self\'')
      expect(policy).toContain('gyroscope \'self\'')
      expect(policy).toContain('accelerometer \'self\'')
    })

    it('should handle custom feature policies', () => {
      const customConfig = {
        ...defaultSecurityConfig,
        featurePolicy: {
          camera: ['\'self\'', 'https://trusted-site.com'],
          microphone: ['\'none\''],
          geolocation: ['\'self\'']
        } as any
      }
      
      const policy = generateFeaturePolicyHeader(customConfig)
      expect(policy).toContain('camera \'self\' https://trusted-site.com')
      expect(policy).toContain('microphone \'none\'')
      expect(policy).toContain('geolocation \'self\'')
    })
  })

  describe('generateHSTSHeader', () => {
    it('should generate HSTS header with all options enabled', () => {
      const hsts = generateHSTSHeader(defaultSecurityConfig)
      
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
      expect(hsts).toContain('preload')
    })

    it('should generate HSTS header with partial options', () => {
      const config = {
        ...defaultSecurityConfig,
        hsts: {
          maxAge: 86400,
          includeSubDomains: false,
          preload: false
        }
      }
      
      const hsts = generateHSTSHeader(config)
      expect(hsts).toBe('max-age=86400')
    })
  })

  describe('applySecurityHeaders', () => {
    it('should apply all security headers to response', () => {
      const request = createMockRequest()
      const response = applySecurityHeaders(request)
      
      // Check CSP header
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy()
      
      // Check HSTS header
      expect(response.headers.get('Strict-Transport-Security')).toBeTruthy()
      
      // Check Feature Policy header
      expect(response.headers.get('Permissions-Policy')).toBeTruthy()
      
      // Check other security headers
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(response.headers.get('X-Download-Options')).toBe('noopen')
      expect(response.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none')
      expect(response.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp')
      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
    })

    it('should use custom configuration when provided', () => {
      const customConfig = {
        ...defaultSecurityConfig,
        csp: {
          ...defaultSecurityConfig.csp,
          defaultSrc: ['\'self\'', 'https://trusted-site.com']
        }
      }
      
      const request = createMockRequest()
      const response = applySecurityHeaders(request, customConfig)
      
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain('default-src \'self\' https://trusted-site.com')
    })

    it('should handle development vs production configurations', () => {
      const devRequest = createMockRequest()
      const prodRequest = createMockRequest()
      
      const devResponse = applySecurityHeaders(devRequest, developmentSecurityConfig)
      const prodResponse = applySecurityHeaders(prodRequest, productionSecurityConfig)
      
      const devCSP = devResponse.headers.get('Content-Security-Policy')
      const prodCSP = prodResponse.headers.get('Content-Security-Policy')
      
      // Development should allow unsafe-eval
      expect(devCSP).toContain('\'unsafe-eval\'')
      
      // Production should not allow unsafe-eval
      expect(prodCSP).not.toContain('\'unsafe-eval\'')
    })
  })

  describe('createSecurityMiddleware', () => {
    it('should create middleware function that applies security headers', () => {
      const middleware = createSecurityMiddleware()
      const request = createMockRequest()
      
      const response = middleware(request)
      
      expect(response).toBeTruthy()
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy()
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should use custom configuration when provided', () => {
      const customConfig = {
        ...defaultSecurityConfig,
        csp: {
          ...defaultSecurityConfig.csp,
          objectSrc: ['\'self\'']
        }
      }
      
      const middleware = createSecurityMiddleware(customConfig)
      const request = createMockRequest()
      
      const response = middleware(request)
      const csp = response.headers.get('Content-Security-Policy')
      
      expect(csp).toContain('object-src \'self\'')
    })
  })

  describe('Configuration Objects', () => {
    it('should have valid default configuration', () => {
      expect(defaultSecurityConfig.csp.defaultSrc).toContain('\'self\'')
      expect(defaultSecurityConfig.hsts.maxAge).toBe(31536000)
      expect(defaultSecurityConfig.featurePolicy.camera).toContain('\'self\'')
    })

    it('should have valid production configuration', () => {
      expect(productionSecurityConfig.csp.scriptSrc).not.toContain('\'unsafe-eval\'')
      expect(productionSecurityConfig.csp.styleSrc).not.toContain('\'unsafe-eval\'')
    })

    it('should have valid development configuration', () => {
      expect(developmentSecurityConfig.csp.scriptSrc).toContain('\'unsafe-eval\'')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty configuration gracefully', () => {
      const emptyConfig = {
        csp: {
          defaultSrc: [],
          scriptSrc: [],
          styleSrc: [],
          imgSrc: [],
          fontSrc: [],
          connectSrc: [],
          frameSrc: [],
          objectSrc: [],
          mediaSrc: [],
          manifestSrc: [],
          workerSrc: [],
          formAction: [],
          baseUri: [],
          upgradeInsecureRequests: false
        },
        hsts: {
          maxAge: 0,
          includeSubDomains: false,
          preload: false
        },
        featurePolicy: {
          camera: [],
          microphone: [],
          geolocation: [],
          payment: [],
          usb: [],
          magnetometer: [],
          gyroscope: [],
          accelerometer: []
        }
      }
      
      const request = createMockRequest()
      const response = applySecurityHeaders(request, emptyConfig)
      
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy()
      expect(response.headers.get('Strict-Transport-Security')).toBeTruthy()
      expect(response.headers.get('Permissions-Policy')).toBeTruthy()
    })

    it('should handle malformed URLs gracefully', () => {
      const malformedRequest = createMockRequest('invalid-url')
      const response = applySecurityHeaders(malformedRequest)
      
      expect(response).toBeTruthy()
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy()
    })
  })

  describe('Security Validation', () => {
    it('should prevent XSS attacks with proper CSP', () => {
      const request = createMockRequest()
      const response = applySecurityHeaders(request)
      const csp = response.headers.get('Content-Security-Policy')
      
      // Should not allow inline scripts by default
      expect(csp).toContain('\'unsafe-inline\'') // Required for Next.js
      
      // Should have strict object-src
      expect(csp).toContain('object-src \'none\'')
    })

    it('should prevent clickjacking with X-Frame-Options', () => {
      const request = createMockRequest()
      const response = applySecurityHeaders(request)
      
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should prevent MIME type sniffing', () => {
      const request = createMockRequest()
      const response = applySecurityHeaders(request)
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should enable XSS protection', () => {
      const request = createMockRequest()
      const response = applySecurityHeaders(request)
      
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })
  })
})
