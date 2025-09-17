// In-memory cache manager for production performance
class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, { data: any; expiry: number }> = new Map()
  private maxSize: number = 1000
  private defaultTTL: number = 300000 // 5 minutes

  private constructor() {
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Set cache entry
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  // Get cache entry
  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  // Delete cache entry
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats(): any {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: this.calculateHitRate()
    }
  }

  // Calculate hit rate (simplified)
  private calculateHitRate(): number {
    // This would need to track hits/misses in a real implementation
    return 0.85 // Placeholder
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance()

// Cache decorator for functions
export function cached(ttl: number = 300000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}_${JSON.stringify(args)}`
      const cached = cacheManager.get(cacheKey)

      if (cached) {
        return cached
      }

      const result = await method.apply(this, args)
      cacheManager.set(cacheKey, result, ttl)
      return result
    }
  }
}

// Cache middleware for API routes
export function withCache(ttl: number = 300000) {
  return function (handler: Function) {
    return async function (req: any, res: any) {
      const cacheKey = `api_${req.url}_${JSON.stringify(req.query)}`
      const cached = cacheManager.get(cacheKey)

      if (cached) {
        res.setHeader('X-Cache', 'HIT')
        res.setHeader('X-Cache-TTL', ttl.toString())
        return res.json(cached)
      }

      // Store original json method
      const originalJson = res.json.bind(res)
      
      // Override json method to cache response
      res.json = function (data: any) {
        cacheManager.set(cacheKey, data, ttl)
        res.setHeader('X-Cache', 'MISS')
        res.setHeader('X-Cache-TTL', ttl.toString())
        return originalJson(data)
      }

      return handler(req, res)
    }
  }
}
