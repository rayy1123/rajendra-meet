'use server';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 10;
const RATE_LIMIT_COOKIE = 'rl_login';

type RateLimitRecord = {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
};

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function getRateLimitKey(ip: string): string {
  return `login:${ip}`;
}

export async function checkLoginRateLimit(request: Request): Promise<{ allowed: boolean; remaining: number }> {
  const ip = getClientIp(request);
  const key = getRateLimitKey(ip);
  const cookieStore = await cookies();
  const raw = cookieStore.get(RATE_LIMIT_COOKIE)?.value;

  let records: Record<string, RateLimitRecord> = {};
  try {
    records = raw ? JSON.parse(raw) : {};
  } catch {
    records = {};
  }

  const record = records[key];
  const now = Date.now();

  if (!record) {
    records[key] = { count: 1, firstAttempt: now, lastAttempt: now };
    await setRateLimitCookie(records);
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    records[key] = { count: 1, firstAttempt: now, lastAttempt: now };
    await setRateLimitCookie(records);
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  record.lastAttempt = now;
  await setRateLimitCookie(records);
  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - record.count };
}

export async function clearLoginRateLimit(request: Request): Promise<void> {
  const ip = getClientIp(request);
  const key = getRateLimitKey(ip);
  const cookieStore = await cookies();
  const raw = cookieStore.get(RATE_LIMIT_COOKIE)?.value;

  let records: Record<string, RateLimitRecord> = {};
  try {
    records = raw ? JSON.parse(raw) : {};
  } catch {
    records = {};
  }

  delete records[key];
  await setRateLimitCookie(records);
}

async function setRateLimitCookie(records: Record<string, RateLimitRecord>) {
  const cookieStore = await cookies();
  cookieStore.set(RATE_LIMIT_COOKIE, JSON.stringify(records), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: RATE_LIMIT_WINDOW_MS / 1000,
  });
}
