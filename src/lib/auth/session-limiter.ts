import { redis, isRedisAvailable } from '@/lib/cache/redis';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari

// In-memory fallback map jika redis belum terkonfigurasi
const localSessionStore = new Map<string, { sessionId: string; updatedAt: number }>();

// Cache validasi sesi in-memory singkat (5 detik) untuk menghindari round-trip berulang pada navigasi cepat
const fastValidationCache = new Map<string, { isValid: boolean; activeSessionId: string; expiresAt: number }>();

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
  fastValidationCache.set(userId, { isValid: true, activeSessionId: sessionId, expiresAt: Date.now() + 5000 });
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
  fastValidationCache.delete(userId);
}

/**
 * Validasi apakah session klien masih merupakan sesi aktif tunggal yang sah.
 * Jika ada orang lain yang login bersamaan menggunakan akun ini di perangkat lain,
 * sessionId akan diperbarui sehingga sesi di perangkat lama otomatis dihentikan.
 */
export async function validateUserSession(
  userOrId: { id: string; user_metadata?: Record<string, any> } | string,
  clientSessionId?: string | null
): Promise<{ isValid: boolean; activeSessionId: string | null }> {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  const userMetadataSession =
    typeof userOrId === 'object' ? userOrId.user_metadata?.active_session_id : null;

  // 1. Fast path: jika cookie klien persis cocok dengan metadata auth Supabase, langsung sahkan 0ms
  if (clientSessionId && userMetadataSession && clientSessionId === userMetadataSession) {
    return { isValid: true, activeSessionId: clientSessionId };
  }

  // 2. Fast cache: jika sesi baru saja divalidasi dalam 5 detik terakhir di server ini
  if (clientSessionId) {
    const cached = fastValidationCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      if (cached.activeSessionId === clientSessionId) {
        return { isValid: cached.isValid, activeSessionId: cached.activeSessionId };
      } else {
        return { isValid: false, activeSessionId: cached.activeSessionId };
      }
    }
  }

  // Prioritaskan session ID dari user metadata Supabase Auth (sumber terpusat)
  const activeSessionId = userMetadataSession || (await getActiveSession(userId));

  // 3. Jika belum ada sesi di store ATAU klien belum memiliki cookie sessionId:
  // adopsi/daftarkan sesi saat ini sebagai sesi aktif resmi tanpa menendang user.
  if (!activeSessionId || !clientSessionId) {
    const newOrExisting = clientSessionId || activeSessionId || generateSessionId();
    await setActiveSession(userId, newOrExisting);
    fastValidationCache.set(userId, { isValid: true, activeSessionId: newOrExisting, expiresAt: Date.now() + 5000 });
    return { isValid: true, activeSessionId: newOrExisting };
  }

  // 4. Jika clientSessionId ada tetapi tidak cocok dengan activeSessionId yang tersimpan:
  // Sesi di perangkat lain baru saja mengambil alih akun -> sesi lama invalid.
  if (clientSessionId !== activeSessionId) {
    fastValidationCache.delete(userId);
    return { isValid: false, activeSessionId };
  }

  fastValidationCache.set(userId, { isValid: true, activeSessionId, expiresAt: Date.now() + 5000 });
  return { isValid: true, activeSessionId };
}
