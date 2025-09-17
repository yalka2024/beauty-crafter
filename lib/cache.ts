// Redis Caching Example (for hot endpoints)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getOrSetCache(key: string, fetcher: () => Promise<any>, ttl = 60) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
  return data;
}
import { monitoring } from './monitoring'
import { logger } from './logging'

// Cache entry interface
interface CacheEntry<T = any> {
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  tags?: string[]
}

// Cache configuration
interface CacheConfig {
  maxSize: number
  defaultTTL: number
  cleanupInterval: number
  maxMemoryUsage: number
  enableCompression: boolean
  enablePersistence: boolean
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 60000, // 1 minute
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  enableCompression: false,
  enablePersistence: false
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  memoryUsage: number
  hitRate: number
  totalKeys: number
}

// Advanced caching system
export class AdvancedCache {
  private static instance: AdvancedCache
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private stats: CacheStats
  private cleanupInterval?: NodeJS.Timeout
  private memoryUsage: number = 0

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config }
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
      hitRate: 0,
      totalKeys: 0
    }
  }

  public static getInstance(config?: Partial<CacheConfig>): AdvancedCache {
    if (!AdvancedCache.instance) {
      AdvancedCache.instance = new AdvancedCache(config)
    }
    return AdvancedCache.instance
  }

  /**
   * Initialize the cache system
   */
  initialize(): void {
    try {
      logger.info('Initializing advanced cache system', {
        config: this.config,
        platform: 'Beauty Crafter'
      })

      // Start cleanup interval
      this.startCleanupInterval()

      // Load persisted cache if enabled
      if (this.config.enablePersistence) {
        this.loadPersistedCache()
      }

      monitoring.recordMetric('cache_initialized', 1)
      logger.info('Advanced cache system initialized successfully', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_initialization')
      logger.error('Failed to initialize cache system', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options: { ttl?: number; tags?: string[] } = {}): boolean {
    try {
      const ttl = options.ttl || this.config.defaultTTL
      const tags = options.tags || []

      // Check memory usage and evict if necessary
      this.ensureMemoryCapacity()

      // Check cache size and evict if necessary
      if (this.cache.size >= this.config.maxSize) {
        this.evictLRU()
      }

      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        tags
      }

      this.cache.set(key, entry)
      this.stats.sets++
      this.stats.totalKeys = this.cache.size

      // Update memory usage
      this.updateMemoryUsage(key, value)

      monitoring.recordMetric('cache_set', 1, { key })
      return true
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_set')
      logger.error('Failed to set cache value', {
        error,
        key,
        platform: 'Beauty Crafter'
      })
      return false
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key)
      
      if (!entry) {
        this.stats.misses++
        monitoring.recordMetric('cache_miss', 1, { key })
        return null
      }

      // Check if entry has expired
      if (this.isExpired(entry)) {
        this.delete(key)
        this.stats.misses++
        monitoring.recordMetric('cache_miss', 1, { key, reason: 'expired' })
        return null
      }

      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = Date.now()

      this.stats.hits++
      this.updateHitRate()
      monitoring.recordMetric('cache_hit', 1, { key })

      return entry.value
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_get')
      logger.error('Failed to get cache value', {
        error,
        key,
        platform: 'Beauty Crafter'
      })
      return null
    }
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    try {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.stats.deletes++
        this.stats.totalKeys = this.cache.size
        
        // Update memory usage
        this.updateMemoryUsage(key, entry.value, true)
        
        monitoring.recordMetric('cache_delete', 1, { key })
        return true
      }
      return false
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_delete')
      logger.error('Failed to delete cache value', {
        error,
        key,
        platform: 'Beauty Crafter'
      })
      return false
    }
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Get multiple values by keys
   */
  mget<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>()
    
    for (const key of keys) {
      result.set(key, this.get<T>(key))
    }
    
    return result
  }

  /**
   * Set multiple values
   */
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number; tags?: string[] }>): boolean {
    try {
      for (const entry of entries) {
        this.set(entry.key, entry.value, {
          ttl: entry.ttl,
          tags: entry.tags
        })
      }
      return true
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_mset')
      return false
    }
  }

  /**
   * Delete multiple keys
   */
  mdelete(keys: string[]): number {
    let deletedCount = 0
    
    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++
      }
    }
    
    return deletedCount
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      this.cache.clear()
      this.stats.totalKeys = 0
      this.memoryUsage = 0
      
      monitoring.recordMetric('cache_cleared', 1)
      logger.info('Cache cleared', { platform: 'Beauty Crafter' })
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_clear')
      logger.error('Failed to clear cache', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache keys by tag
   */
  getKeysByTag(tag: string): string[] {
    const keys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        keys.push(key)
      }
    }
    
    return keys
  }

  /**
   * Delete all entries with a specific tag
   */
  deleteByTag(tag: string): number {
    const keys = this.getKeysByTag(tag)
    return this.mdelete(keys)
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Check if cache is empty
   */
  isEmpty(): boolean {
    return this.cache.size === 0
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all cache values
   */
  values<T>(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  /**
   * Get all cache entries
   */
  entries<T>(): Array<[string, T]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value])
  }

  /**
   * Shutdown the cache system
   */
  shutdown(): void {
    try {
      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
      }

      // Persist cache if enabled
      if (this.config.enablePersistence) {
        this.persistCache()
      }

      // Clear cache
      this.clear()

      monitoring.recordMetric('cache_shutdown', 1)
      logger.info('Cache system shutdown completed', {
        platform: 'Beauty Crafter'
      })
    } catch (error) {
      monitoring.recordError(error as Error, 'cache_shutdown')
      logger.error('Error during cache shutdown', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
      this.stats.evictions++
      monitoring.recordMetric('cache_eviction', 1, { reason: 'lru' })
    }
  }

  /**
   * Ensure memory capacity
   */
  private ensureMemoryCapacity(): void {
    if (this.memoryUsage > this.config.maxMemoryUsage) {
      // Evict entries until memory usage is acceptable
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

      for (const [key, entry] of entries) {
        this.delete(key)
        this.stats.evictions++
        
        if (this.memoryUsage <= this.config.maxMemoryUsage * 0.8) {
          break
        }
      }

      monitoring.recordMetric('cache_eviction', 1, { reason: 'memory' })
    }
  }

  /**
   * Update memory usage
   */
  private updateMemoryUsage(key: string, value: any, isDeletion: boolean = false): void {
    try {
      const size = this.estimateSize(key, value)
      
      if (isDeletion) {
        this.memoryUsage = Math.max(0, this.memoryUsage - size)
      } else {
        this.memoryUsage += size
      }
      
      this.stats.memoryUsage = this.memoryUsage
    } catch (error) {
      // Ignore memory calculation errors
    }
  }

  /**
   * Estimate size of a key-value pair
   */
  private estimateSize(key: string, value: any): number {
    try {
      const keySize = Buffer.byteLength(key, 'utf8')
      const valueSize = Buffer.byteLength(JSON.stringify(value), 'utf8')
      return keySize + valueSize
    } catch {
      return 1024 // Default size if calculation fails
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    try {
      const now = Date.now()
      const expiredKeys: string[] = []

      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry)) {
          expiredKeys.push(key)
        }
      }

      if (expiredKeys.length > 0) {
        this.mdelete(expiredKeys)
        monitoring.recordMetric('cache_cleanup', expiredKeys.length)
      }
    } catch (error) {
      logger.warn('Cache cleanup failed', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Persist cache to storage
   */
  private persistCache(): void {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment
        localStorage.setItem('beauty-crafter-cache', JSON.stringify({
          entries: Array.from(this.cache.entries()),
          stats: this.stats,
          memoryUsage: this.memoryUsage
        }))
      } else {
        // Node.js environment
        // This would be implemented with file system or Redis
        logger.info('Cache persistence not implemented for Node.js', {
          platform: 'Beauty Crafter'
        })
      }
    } catch (error) {
      logger.warn('Failed to persist cache', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }

  /**
   * Load persisted cache from storage
   */
  private loadPersistedCache(): void {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment
        const persisted = localStorage.getItem('beauty-crafter-cache')
        if (persisted) {
          const data = JSON.parse(persisted)
          this.cache = new Map(data.entries || [])
          this.stats = data.stats || this.stats
          this.memoryUsage = data.memoryUsage || 0
          this.stats.totalKeys = this.cache.size
        }
      }
    } catch (error) {
      logger.warn('Failed to load persisted cache', {
        error,
        platform: 'Beauty Crafter'
      })
    }
  }
}

// Export singleton instance
export const cache = AdvancedCache.getInstance()

// Cache decorator for methods
export function Cacheable(ttl?: number, tags?: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache
      let result = cache.get(cacheKey)
      if (result !== null) {
        return result
      }

      // Execute method and cache result
      result = await method.apply(this, args)
      cache.set(cacheKey, result, { ttl, tags })
      
      return result
    }
  }
}

// Cache utility functions
export const cacheUtils = {
  /**
   * Generate cache key from object
   */
  generateKey(prefix: string, data: any): string {
    return `${prefix}:${JSON.stringify(data)}`
  },

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern: string): number {
    const keys = cache.keys().filter(key => key.includes(pattern))
    return cache.mdelete(keys)
  },

  /**
   * Warm up cache with data
   */
  warmUp<T>(entries: Array<{ key: string; value: T; ttl?: number; tags?: string[] }>): void {
    cache.mset(entries)
  }
} 