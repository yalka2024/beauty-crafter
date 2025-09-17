import { CSRFProtection, verifyCSRF, generateCSRFToken } from '@/lib/csrf'
import { NextRequest } from 'next/server'

const createMockRequest = (method: string, pathname: string, headers: Record<string, string> = {}, formData?: FormData): NextRequest => {
  const url = new URL(`http://localhost${pathname}`)
  const request = {
    method,
    nextUrl: { pathname },
    headers: {
      get: (name: string) => headers[name] || null
    },
    formData: async () => formData || new FormData()
  } as unknown as NextRequest

  return request
}

describe('CSRF Protection', () => {
  describe('CSRFProtection.generateToken', () => {
    it('should generate a token with correct length', () => {
      const token = CSRFProtection.generateToken()
      expect(token).toHaveLength(32)
    })

    it('should generate tokens with valid characters', () => {
      const token = CSRFProtection.generateToken()
      expect(token).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should generate unique tokens', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate tokens with mixed case and numbers', () => {
      const token = CSRFProtection.generateToken()
      expect(token).toMatch(/[A-Z]/)
      expect(token).toMatch(/[a-z]/)
      expect(token).toMatch(/[0-9]/)
    })
  })

  describe('CSRFProtection.validateToken', () => {
    it('should validate correct token from header', async () => {
      const token = CSRFProtection.generateToken()
      const request = createMockRequest('POST', '/api/test', { 'x-csrf-token': token })
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(true)
    })

    it('should validate correct token from csrf-token header', async () => {
      const token = CSRFProtection.generateToken()
      const request = createMockRequest('POST', '/api/test', { 'csrf-token': token })
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(true)
    })

    it('should validate correct token from form data', async () => {
      const token = CSRFProtection.generateToken()
      const formData = new FormData()
      formData.append('csrf_token', token)
      const request = createMockRequest('POST', '/api/test', {}, formData)
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(true)
    })

    it('should reject missing token', async () => {
      const request = createMockRequest('POST', '/api/test')
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(false)
    })

    it('should reject token with wrong length', async () => {
      const request = createMockRequest('POST', '/api/test', { 'x-csrf-token': 'short' })
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(false)
    })

    it('should reject token with invalid characters', async () => {
      const request = createMockRequest('POST', '/api/test', { 'x-csrf-token': 'invalid-token-with-special-chars!' })
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(false)
    })

    it('should handle form data errors gracefully', async () => {
      const request = createMockRequest('POST', '/api/test')
      // Mock formData to throw an error
      jest.spyOn(request, 'formData').mockRejectedValueOnce(new Error('Form data error'))
      const result = await CSRFProtection.validateToken(request)
      expect(result).toBe(false)
    })
  })

  describe('CSRFProtection.createTokenPair', () => {
    it('should create token pair with token and expiry', () => {
      const pair = CSRFProtection.createTokenPair()
      expect(pair).toHaveProperty('token')
      expect(pair).toHaveProperty('expiry')
      expect(pair.token).toHaveLength(32)
      expect(typeof pair.expiry).toBe('number')
    })

    it('should set expiry to future time', () => {
      const pair = CSRFProtection.createTokenPair()
      expect(pair.expiry).toBeGreaterThan(Date.now())
    })

    it('should set expiry to approximately 24 hours from now', () => {
      const pair = CSRFProtection.createTokenPair()
      const expectedExpiry = Date.now() + (24 * 60 * 60 * 1000)
      const tolerance = 1000 // 1 second tolerance
      expect(pair.expiry).toBeGreaterThan(expectedExpiry - tolerance)
      expect(pair.expiry).toBeLessThan(expectedExpiry + tolerance)
    })
  })

  describe('CSRFProtection.isTokenExpired', () => {
    it('should return false for future expiry', () => {
      const futureExpiry = Date.now() + (60 * 60 * 1000) // 1 hour from now
      const result = CSRFProtection.isTokenExpired(futureExpiry)
      expect(result).toBe(false)
    })

    it('should return true for past expiry', () => {
      const pastExpiry = Date.now() - (60 * 60 * 1000) // 1 hour ago
      const result = CSRFProtection.isTokenExpired(pastExpiry)
      expect(result).toBe(true)
    })

    it('should return true for current time expiry', () => {
      const nowExpiry = Date.now() - 1 // Ensure it's expired
      const result = CSRFProtection.isTokenExpired(nowExpiry)
      expect(result).toBe(true)
    })
  })

  describe('verifyCSRF', () => {
    it('should allow GET requests', async () => {
      const request = createMockRequest('GET', '/api/test')
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should allow public health endpoints', async () => {
      const request = createMockRequest('POST', '/api/health')
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should allow public metrics endpoints', async () => {
      const request = createMockRequest('POST', '/api/metrics')
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should allow nested public endpoints', async () => {
      const request = createMockRequest('POST', '/api/health/status')
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should validate CSRF for POST requests to protected endpoints', async () => {
      const token = CSRFProtection.generateToken()
      const request = createMockRequest('POST', '/api/user', { 'x-csrf-token': token })
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should reject POST requests without valid CSRF token', async () => {
      const request = createMockRequest('POST', '/api/user')
      const result = await verifyCSRF(request)
      expect(result).toBe(false)
    })

    it('should handle PUT requests', async () => {
      const token = CSRFProtection.generateToken()
      const request = createMockRequest('PUT', '/api/user', { 'x-csrf-token': token })
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should handle DELETE requests', async () => {
      const token = CSRFProtection.generateToken()
      const request = createMockRequest('DELETE', '/api/user', { 'x-csrf-token': token })
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })

    it('should handle PATCH requests', async () => {
      const token = CSRFProtection.generateToken()
      const request = createMockRequest('PATCH', '/api/user', { 'x-csrf-token': token })
      const result = await verifyCSRF(request)
      expect(result).toBe(true)
    })
  })

  describe('generateCSRFToken', () => {
    it('should generate a valid CSRF token', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(32)
      expect(token).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should generate unique tokens on multiple calls', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })
})
