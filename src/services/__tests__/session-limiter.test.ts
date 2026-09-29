import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSessionId,
  setActiveSession,
  getActiveSession,
  clearActiveSession,
  validateUserSession,
} from '@/lib/auth/session-limiter';

describe('Concurrent Session Limiter (Pembatasan Multi-Login Bersamaan)', () => {
  const userA = 'user-test-concurrent-a';
  const userB = 'user-test-concurrent-b';

  beforeEach(async () => {
    await clearActiveSession(userA);
    await clearActiveSession(userB);
  });

  it('menghasilkan ID sesi unik', () => {
    const s1 = generateSessionId();
    const s2 = generateSessionId();
    expect(s1).toBeDefined();
    expect(s2).toBeDefined();
    expect(s1).not.toBe(s2);
    expect(s1.startsWith('sess_')).toBe(true);
  });

  it('mendaftarkan dan membaca sesi aktif pengguna', async () => {
    const session1 = generateSessionId();
    await setActiveSession(userA, session1);

    const active = await getActiveSession(userA);
    expect(active).toBe(session1);
  });

  it('mengizinkan akses jika sessionId klien cocok dengan sesi aktif', async () => {
    const session1 = generateSessionId();
    await setActiveSession(userA, session1);

    const check = await validateUserSession(userA, session1);
    expect(check.isValid).toBe(true);
    expect(check.activeSessionId).toBe(session1);
  });

  it('menolak dan membatasi sesi lama saat ada login bersamaan di perangkat lain', async () => {
    // 1. User A login di Perangkat 1
    const device1Session = generateSessionId();
    await setActiveSession(userA, device1Session);

    const checkDevice1 = await validateUserSession(userA, device1Session);
    expect(checkDevice1.isValid).toBe(true);

    // 2. User A (atau orang lain menggunakan akun sama) login di Perangkat 2
    const device2Session = generateSessionId();
    await setActiveSession(userA, device2Session);

    // 3. Perangkat 1 sekarang otomatis invalid karena sesi aktif telah digantikan oleh Perangkat 2
    const checkOldDevice1 = await validateUserSession(userA, device1Session);
    expect(checkOldDevice1.isValid).toBe(false);
    expect(checkOldDevice1.activeSessionId).toBe(device2Session);

    // 4. Perangkat 2 tetap valid sebagai sesi aktif tunggal
    const checkNewDevice2 = await validateUserSession(userA, device2Session);
    expect(checkNewDevice2.isValid).toBe(true);
  });

  it('membersihkan sesi saat pengguna logout', async () => {
    const session1 = generateSessionId();
    await setActiveSession(userA, session1);

    await clearActiveSession(userA);
    const active = await getActiveSession(userA);
    expect(active).toBeNull();
  });
});
