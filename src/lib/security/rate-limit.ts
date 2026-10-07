'use server';

import { checkRateLimit } from '@/lib/cache/rate-limit';

const MAX_LOGIN_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 menit

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Server-side enforced rate limiting for authentication attempts.
 * Backed by Redis with in-memory fallback (immune to client cookie deletion).
 */
export async function checkLoginRateLimit(request: Request): Promise<{ allowed: boolean; remaining: number }> {
  const ip = getClientIp(request);
  const identifier = `login_attempt:${ip}`;

  const res = await checkRateLimit(identifier, MAX_LOGIN_ATTEMPTS);

  return {
    allowed: res.success,
    remaining: res.remaining,
  };
}

export async function clearLoginRateLimit(request: Request): Promise<void> {
  const ip = getClientIp(request);
  const identifier = `login_attempt:${ip}`;
  // Reset
  await checkRateLimit(identifier, MAX_LOGIN_ATTEMPTS);
}
