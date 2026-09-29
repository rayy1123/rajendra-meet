import { redis, getCache, setCache } from '@/lib/cache/redis';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari

// In-memory fallback map jika redis belum terkonfigurasi
const localSessionStore = new Map<string, { sessionId: string; updatedAt: number }>();

export function generateSessionId(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `sess_${time}_${rand}`;
}

export async function setActiveSession(userId: string, sessionId: string): Promise<void> {
  const key = `user_active_session:${userId}`;
  try {
    await redis.set(key, sessionId, { ex: SESSION_TTL_SECONDS });
  } catch (err) {
    console.warn('[SessionLimiter] Redis set warning:', err);
  }
  localSessionStore.set(userId, { sessionId, updatedAt: Date.now() });
}

export async function getActiveSession(userId: string): Promise<string | null> {
  const key = `user_active_session:${userId}`;
  try {
    const fromCache = await redis.get<string>(key);
    if (fromCache) return fromCache;
  } catch (err) {
    console.warn('[SessionLimiter] Redis get warning:', err);
  }

  const local = localSessionStore.get(userId);
  return local ? local.sessionId : null;
}

export async function clearActiveSession(userId: string): Promise<void> {
  const key = `user_active_session:${userId}`;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('[SessionLimiter] Redis del warning:', err);
  }
  localSessionStore.delete(userId);
}

/**
 * Validasi apakah session klien masih merupakan sesi aktif tunggal yang sah.
 * Jika ada orang lain yang login bersamaan menggunakan akun ini, sessionId akan berubah
 * sehingga sesi lama otomatis tidak valid (concurrent session limit).
 */
export async function validateUserSession(
  userId: string,
  clientSessionId?: string | null
): Promise<{ isValid: boolean; activeSessionId: string | null }> {
  const activeSessionId = await getActiveSession(userId);

  // Jika belum ada sesi aktif yang tercatat, sesi saat ini didaftarkan sebagai sesi aktif
  if (!activeSessionId) {
    if (clientSessionId) {
      await setActiveSession(userId, clientSessionId);
      return { isValid: true, activeSessionId: clientSessionId };
    }
    return { isValid: true, activeSessionId: null };
  }

  // Jika ada sesi aktif dan klien tidak memiliki sessionId atau berbeda -> konkurensi terdeteksi
  if (!clientSessionId || clientSessionId !== activeSessionId) {
    return { isValid: false, activeSessionId };
  }

  return { isValid: true, activeSessionId };
}
