import { Ratelimit } from '@upstash/ratelimit';
import { redis, isRedisAvailable } from './redis';
import { Redis } from '@upstash/redis';

// In-Memory Token Bucket / Sliding Window Rate Limiter
interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

class InMemoryRateLimiter {
  private clients = new Map<string, RateLimitEntry>();
  private defaultLimit: number;
  private windowMs: number;

  constructor(defaultLimit: number = 60, windowMs: number = 60000) {
    this.defaultLimit = defaultLimit;
    this.windowMs = windowMs;
  }

  async limit(identifier: string, limit: number = this.defaultLimit, windowMs: number = this.windowMs) {
    const now = Date.now();
    let entry = this.clients.get(identifier);

    if (!entry) {
      entry = { tokens: limit, lastRefill: now };
      this.clients.set(identifier, entry);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - entry.lastRefill;
    if (elapsed > windowMs) {
      entry.tokens = limit;
      entry.lastRefill = now;
    }

    const reset = Math.ceil((entry.lastRefill + windowMs) / 1000);

    if (entry.tokens > 0) {
      entry.tokens--;
      return {
        success: true,
        limit,
        remaining: entry.tokens,
        reset,
      };
    }

    // Rate limited
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter(60, 60000); // 60 requests / minute

let upstashRatelimit: Ratelimit | null = null;
if (isRedisAvailable()) {
  try {
    upstashRatelimit = new Ratelimit({
      redis: redis as Redis,
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      analytics: true,
      prefix: 'scms:ratelimit',
    });
  } catch (err) {
    console.warn('[RateLimit] Failed to initialize Upstash ratelimit:', err);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a client identifier (e.g. IP address or user ID)
 * Default limit: 60 requests per 60 seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60
): Promise<RateLimitResult> {
  if (upstashRatelimit && isRedisAvailable()) {
    try {
      const res = await upstashRatelimit.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      console.warn('[RateLimit] Upstash limit error, falling back to memory:', err);
    }
  }

  // Fallback to in-memory rate limiter
  return inMemoryLimiter.limit(identifier, limit, 60000);
}
