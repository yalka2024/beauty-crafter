import { NextRequest } from "next/server"

// CSRF token generation and validation for Edge Runtime compatibility
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Generate a CSRF token
   */
  static generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < this.TOKEN_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Validate CSRF token from request
   */
  static async validateToken(request: NextRequest): Promise<boolean> {
    try {
      // Get token from header or form data
      const token = request.headers.get('x-csrf-token') || 
                   request.headers.get('csrf-token') ||
                   (await request.formData()).get('csrf_token')?.toString()

      if (!token) {
        return false
      }

      // For Edge Runtime, we'll use a simpler validation approach
      // In production, you might want to store tokens in Redis or similar
      return token.length === this.TOKEN_LENGTH && /^[A-Za-z0-9]+$/.test(token)
    } catch (error) {
      return false
    }
  }

  /**
   * Create a CSRF token pair (token + expiry)
   */
  static createTokenPair(): { token: string; expiry: number } {
    return {
      token: this.generateToken(),
      expiry: Date.now() + this.TOKEN_EXPIRY
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiry: number): boolean {
    return Date.now() > expiry
  }
}

/**
 * Verify CSRF token for a request
 */
export async function verifyCSRF(request: NextRequest): Promise<boolean> {
  // Skip CSRF for GET requests
  if (request.method === 'GET') {
    return true
  }

  // Skip CSRF for public API endpoints that don't modify state
  const publicEndpoints = ['/api/health', '/api/metrics']
  if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
    return true
  }

  return await CSRFProtection.validateToken(request)
}

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken(): string {
  return CSRFProtection.generateToken()
}
