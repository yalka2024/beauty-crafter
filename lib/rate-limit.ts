import { NextRequest } from "next/server"

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: "rate_limit"
}

// Redis-based rate limiting for production
class RedisRateLimiter {
  private static instance: RedisRateLimiter
  private redis: any = null
  private config: RateLimitConfig

  private constructor(config: RateLimitConfig) {
    this.config = config
    this.initRedis()
  }

  static getInstance(config?: Partial<RateLimitConfig>): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter({ ...DEFAULT_CONFIG, ...config })
    }
    return RedisRateLimiter.instance
  }

  private async initRedis() {
    try {
      // In production, this would connect to Redis
      // For now, we'll use a fallback to in-memory with better structure
      this.redis = null
    } catch (error) {
      console.error("Redis connection failed, falling back to in-memory rate limiting")
      this.redis = null
    }
  }

  async checkLimit(key: string): Promise<RateLimitResult> {
    try {
      if (this.redis) {
        return await this.checkRedisLimit(key)
      } else {
        return await this.checkMemoryLimit(key)
      }
    } catch (error) {
      // Fallback to memory-based limiting
      return await this.checkMemoryLimit(key)
    }
  }

  private async checkRedisLimit(key: string): Promise<RateLimitResult> {
    // Redis implementation would go here
    // For now, fallback to memory
    return await this.checkMemoryLimit(key)
  }

  private async checkMemoryLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Use a more robust in-memory store with cleanup
    if (!global.rateLimitStore) {
      global.rateLimitStore = new Map()
    }

    const store = global.rateLimitStore
    const record = store.get(key)

    if (!record || record.windowStart < windowStart) {
      // New window or expired
      store.set(key, {
        count: 1,
        windowStart: now,
        reset: new Date(now + this.config.windowMs)
      })
      
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        reset: new Date(now + this.config.windowMs)
      }
    }

    if (record.count >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: record.reset
      }
    }

    // Increment count
    record.count++
    
    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - record.count,
      reset: record.reset
    }
  }

  // Cleanup expired entries periodically
  public cleanup() {
    if (!global.rateLimitStore) return
    
    const now = Date.now()
    const store = global.rateLimitStore
    
    for (const [key, record] of store.entries()) {
      if (record.windowStart < now - this.config.windowMs) {
        store.delete(key)
      }
    }
  }
}

// Initialize cleanup every 5 minutes
if (typeof global !== 'undefined' && !global.rateLimitCleanupInterval) {
  global.rateLimitCleanupInterval = setInterval(() => {
    RedisRateLimiter.getInstance().cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Rate limit middleware function
 */
export async function rateLimit(request: NextRequest): Promise<RateLimitResult> {
  const limiter = RedisRateLimiter.getInstance()
  
  // Create a unique key for rate limiting
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown"
  
  const key = `${limiter['config'].keyPrefix}:${ip}:${request.nextUrl.pathname}`
  
  return await limiter.checkLimit(key)
}

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig>) {
  return RedisRateLimiter.getInstance(config)
}

// Type declaration for global rate limit store
declare global {
  // eslint-disable-next-line no-var
  var rateLimitStore: Map<string, {
    count: number
    windowStart: number
    reset: Date
  }> | undefined
  
  // eslint-disable-next-line no-var
  var rateLimitCleanupInterval: NodeJS.Timeout | undefined
}
