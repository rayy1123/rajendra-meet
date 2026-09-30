import { redis, isRedisAvailable } from '@/lib/cache/redis';

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

  // Prioritaskan session ID dari user metadata Supabase Auth (sumber terpusat)
  const activeSessionId = userMetadataSession || (await getActiveSession(userId));

  // 1. Jika belum ada sesi di store ATAU klien belum memiliki cookie sessionId:
  // adopsi/daftarkan sesi saat ini sebagai sesi aktif resmi tanpa menendang user.
  if (!activeSessionId || !clientSessionId) {
    const newOrExisting = clientSessionId || activeSessionId || generateSessionId();
    await setActiveSession(userId, newOrExisting);
    return { isValid: true, activeSessionId: newOrExisting };
  }

  // 2. Jika clientSessionId ada tetapi tidak cocok dengan activeSessionId yang tersimpan:
  // Sesi di perangkat lain baru saja mengambil alih akun -> sesi lama invalid.
  if (clientSessionId !== activeSessionId) {
    return { isValid: false, activeSessionId };
  }

  return { isValid: true, activeSessionId };
}
