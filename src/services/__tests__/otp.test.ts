import { describe, it, expect } from 'vitest';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/auth/otp-service';
import {
  getAdminOtpRecords,
  saveAdminOtpRecord,
  updateAdminOtpStatus,
} from '@/lib/data/admin-otp-server';

describe('Admin OTP Queue & Verification System', () => {
  const testEmail = 'peserta_test_unit@gmail.com';
  const testName = 'Budi Swimmer Test';

  it('dapat menyimpan rekaman OTP baru ke antrean dashboard admin', () => {
    const expiresAt = Date.now() + 300 * 1000;
    const record = saveAdminOtpRecord({
      email: testEmail,
      fullName: testName,
      code: '817263',
      expiresAt,
      status: 'pending',
      viaEmail: true,
    });

    expect(record).toBeDefined();
    expect(record.code).toBe('817263');
    expect(record.email).toBe(testEmail);
    expect(record.status).toBe('pending');

    const records = getAdminOtpRecords();
    const found = records.find((r) => r.email === testEmail);
    expect(found).toBeDefined();
    expect(found?.code).toBe('817263');
  });

  it('dapat memperbarui status OTP menjadi verified setelah verifikasi berhasil', () => {
    updateAdminOtpStatus(testEmail, 'verified');

    const records = getAdminOtpRecords();
    const found = records.find((r) => r.email === testEmail);
    expect(found).toBeDefined();
    expect(found?.status).toBe('verified');
  });

  it('dapat menangani status fallback_to_admin saat kuota habis', () => {
    const fallbackEmail = 'peserta_fallback@gmail.com';
    const expiresAt = Date.now() + 300 * 1000;

    const record = saveAdminOtpRecord({
      email: fallbackEmail,
      fullName: 'Atlet Fallback',
      code: '992211',
      expiresAt,
      status: 'fallback_to_admin',
      viaEmail: false,
      errorMessage: 'Quota exceeded',
    });

    expect(record.status).toBe('fallback_to_admin');

    const records = getAdminOtpRecords();
    const found = records.find((r) => r.email === fallbackEmail);
    expect(found?.status).toBe('fallback_to_admin');
  });

  it('verifikasi OTP menolak kode salah', async () => {
    // Generate fresh OTP
    const cleanEmail = 'user_wrong_code@gmail.com';
    const sendRes = await sendEmailOtp({ email: cleanEmail, fullName: 'User Wrong' });
    expect(sendRes.ok).toBe(true);

    const verifyRes = await verifyEmailOtp({ email: cleanEmail, code: '000000' });
    expect(verifyRes.ok).toBe(false);
    expect(verifyRes.error).toContain('salah');
  });

  it('verifikasi OTP berhasil dengan kode yang benar dan otomatis update status admin', async () => {
    const cleanEmail = 'user_valid_test@gmail.com';
    await sendEmailOtp({ email: cleanEmail, fullName: 'User Valid' });

    // Dapatkan kode yang tercatat di admin store
    const records = getAdminOtpRecords();
    const otpEntry = records.find((r) => r.email === cleanEmail);
    expect(otpEntry).toBeDefined();
    expect(otpEntry?.code.length).toBe(6);

    const verifyRes = await verifyEmailOtp({
      email: cleanEmail,
      code: otpEntry!.code,
    });
    expect(verifyRes.ok).toBe(true);

    // Cek bahwa status di admin store berubah menjadi verified
    const afterRecords = getAdminOtpRecords();
    const verifiedEntry = afterRecords.find((r) => r.email === cleanEmail);
    expect(verifiedEntry?.status).toBe('verified');
  });

  it('verifikasi OTP berhasil menggunakan Master Emergency Bypass OTP untuk akun apapun', async () => {
    const randomUserEmail = 'user_offline_emergency@gmail.com';
    const { getMasterBypassOtp } = await import('@/lib/data/admin-otp-server');
    const masterKey = getMasterBypassOtp();

    expect(masterKey).toBeDefined();
    expect(masterKey.length).toBeGreaterThanOrEqual(4);

    // Verifikasi akun tanpa perlu kirim email sebelumnya
    const verifyRes = await verifyEmailOtp({
      email: randomUserEmail,
      code: masterKey,
    });

    expect(verifyRes.ok).toBe(true);
  });

  it('admin dapat menerbitkan OTP manual untuk akun tertentu', async () => {
    const manualTarget = 'user_manual_issue@gmail.com';
    const { issueManualAdminOtp } = await import('@/lib/auth/otp-service');
    const res = await issueManualAdminOtp({
      email: manualTarget,
      fullName: 'Manual Swimmer',
      customCode: '776655',
    });

    expect(res.ok).toBe(true);
    expect(res.code).toBe('776655');

    // Verifikasi dengan kode yang baru diterbitkan admin
    const verifyRes = await verifyEmailOtp({
      email: manualTarget,
      code: '776655',
    });

    expect(verifyRes.ok).toBe(true);
  });
});
