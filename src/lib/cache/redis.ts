import { Redis } from '@upstash/redis';

// In-Memory Fallback Cache when Redis environment variables are not configured
interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number | null;
}

class InMemoryCache {
  private store = new Map<string, MemoryCacheEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<'OK'> {
    const ttlSeconds = options?.ex;
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;

    // Prune old keys if map gets too large (> 2000 items)
    if (this.store.size > 2000) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (v.expiresAt !== null && now > v.expiresAt) {
          this.store.delete(k);
        }
      }
    }

    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        count++;
      }
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matching: string[] = [];
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regexPattern.test(key)) {
        matching.push(key);
      }
    }

    return matching;
  }
}

// Check Redis environment
const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Global singleton for Next.js hot-reloading
const globalForCache = globalThis as unknown as {
  redisClient?: Redis;
  memoryCache?: InMemoryCache;
};

export const redis: Redis | InMemoryCache = (() => {
  if (isUpstashConfigured) {
    if (!globalForCache.redisClient) {
      globalForCache.redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
    return globalForCache.redisClient;
  }

  if (!globalForCache.memoryCache) {
    globalForCache.memoryCache = new InMemoryCache();
  }
  return globalForCache.memoryCache;
})();

export function isRedisAvailable(): boolean {
  return isUpstashConfigured;
}

/**
 * Get value from cache (either Redis or In-Memory)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.warn('[Cache] Error getting key:', key, err);
    return null;
  }
}

/**
 * Set value in cache with TTL in seconds (default: 10s for live scores)
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 10
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, { ex: ttlSeconds });
  } catch (err) {
    console.warn('[Cache] Error setting key:', key, err);
  }
}

/**
 * Invalidate cache by key or wildcard pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (pattern.includes('*')) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch (err) {
    console.warn('[Cache] Error invalidating pattern:', pattern, err);
  }
}
