import { describe, it, expect } from 'vitest';
import { getCache, setCache, invalidateCache } from '../../lib/cache/redis';
import { checkRateLimit } from '../../lib/cache/rate-limit';

describe('Cache & Rate Limiter System', () => {
  it('should set and retrieve cache data properly', async () => {
    const testKey = 'test:scoreboard:event-1';
    const testPayload = { message: 'Live data test', count: 42 };

    await setCache(testKey, testPayload, 5);
    const retrieved = await getCache<typeof testPayload>(testKey);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.message).toBe('Live data test');
    expect(retrieved?.count).toBe(42);

    await invalidateCache(testKey);
    const afterInvalidation = await getCache(testKey);
    expect(afterInvalidation).toBeNull();
  });

  it('should enforce rate limits and return appropriate remaining count', async () => {
    const testClient = 'test-client-ip-123';
    const limit = 5;

    // First request
    const firstRes = await checkRateLimit(testClient, limit);
    expect(firstRes.success).toBe(true);
    expect(firstRes.limit).toBe(limit);

    // Consume remaining tokens
    for (let i = 0; i < limit - 1; i++) {
      const res = await checkRateLimit(testClient, limit);
      expect(res.success).toBe(true);
    }

    // 6th request should exceed limit
    const blockedRes = await checkRateLimit(testClient, limit);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });
});
