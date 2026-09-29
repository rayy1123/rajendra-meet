import { redis } from '@/lib/cache/redis';
import { sendBrevoEmail } from '@/lib/email/brevo';

const OTP_TTL_SECONDS = 300; // 5 menit

interface LocalOtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const localOtpStore = new Map<string, LocalOtpEntry>();

function generateNumericOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Buat dan kirim kode OTP 6-digit ke email penerima via Brevo
 */
export async function sendEmailOtp(params: {
  email: string;
  fullName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Alamat email tidak valid.' };
  }

  const otpCode = generateNumericOtp();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
  const key = `otp_code:${cleanEmail}`;

  // 1. Simpan ke Redis / Local Cache
  try {
    await redis.set(
      key,
      JSON.stringify({ code: otpCode, expiresAt, attempts: 0 }),
      { ex: OTP_TTL_SECONDS }
    );
  } catch (err) {
    console.warn('[OTP Store] Redis set notice:', err);
  }
  localOtpStore.set(cleanEmail, { code: otpCode, expiresAt, attempts: 0 });

  // 2. Kirim Email OTP via Brevo API
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #0f2b5c; padding: 20px; border-radius: 12px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Rajendra Swim System</h2>
        <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 11px; font-weight: 800; tracking-wider: uppercase;">KODE OTP VERIFIKASI EMAIL</p>
      </div>
      <div style="padding: 24px 0; color: #0f172a; font-size: 14px; line-height: 1.6; text-align: center;">
        <p style="margin: 0; font-size: 15px;">Halo <b>${params.fullName || cleanEmail}</b>,</p>
        <p style="margin: 8px 0 16px 0; color: #475569;">Gunakan kode OTP 6-digit di bawah ini untuk memverifikasi alamat email Anda:</p>

        <div style="background-color: #f0f9ff; border: 2px dashed #0284c7; padding: 18px; border-radius: 12px; margin: 20px 0; display: inline-block;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0369a1;">${otpCode}</span>
        </div>

        <p style="font-size: 12px; color: #e11d48; font-weight: bold; margin-top: 12px;">
          ⚠️ Kode OTP ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
        © 2026 Rajendra Swim System • Sistem Keamanan & Verifikasi Resmi
      </div>
    </div>
  `;

  const emailRes = await sendBrevoEmail({
    to: [{ email: cleanEmail, name: params.fullName }],
    subject: `[OTP: ${otpCode}] Kode Verifikasi Email - Rajendra Swim System`,
    htmlContent: html,
  });

  if (!emailRes.ok) {
    // Jika BREVO API Key belum diisi di environment dev, izinkan fallback dengan notice
    if (emailRes.error?.includes('BREVO_API_KEY')) {
      console.log(`[DEV MODE OTP] Email: ${cleanEmail} -> OTP: ${otpCode}`);
      return { ok: true };
    }
    return { ok: false, error: emailRes.error || 'Gagal mengirim email OTP.' };
  }

  return { ok: true };
}

/**
 * Verifikasi Kode OTP 6-digit dari user
 */
export async function verifyEmailOtp(params: {
  email: string;
  code: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanCode = params.code.trim();

  if (!cleanEmail || !cleanCode) {
    return { ok: false, error: 'Email dan kode OTP wajib diisi.' };
  }

  const key = `otp_code:${cleanEmail}`;
  let stored: LocalOtpEntry | null = null;

  try {
    const raw = await redis.get<string | LocalOtpEntry>(key);
    if (raw) {
      stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  } catch (err) {
    console.warn('[OTP Store] Redis get notice:', err);
  }

  if (!stored) {
    stored = localOtpStore.get(cleanEmail) || null;
  }

  if (!stored) {
    return { ok: false, error: 'Kode OTP tidak ditemukan atau telah kedaluwarsa. Silakan minta kode baru.' };
  }

  if (Date.now() > stored.expiresAt) {
    localOtpStore.delete(cleanEmail);
    try { await redis.del(key); } catch {}
    return { ok: false, error: 'Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan minta kode baru.' };
  }

  if (stored.code !== cleanCode) {
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts >= 5) {
      localOtpStore.delete(cleanEmail);
      try { await redis.del(key); } catch {}
      return { ok: false, error: 'Batas percobaan habis. Silakan minta kode OTP baru.' };
    }
    return { ok: false, error: 'Kode OTP yang Anda masukkan salah. Periksa kembali email Anda.' };
  }

  // OTP Valid -> Hapus dari store
  localOtpStore.delete(cleanEmail);
  try { await redis.del(key); } catch {}

  return { ok: true };
}
