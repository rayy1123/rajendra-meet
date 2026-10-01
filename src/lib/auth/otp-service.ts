import { redis } from '@/lib/cache/redis';
import { sendBrevoEmail } from '@/lib/email/brevo';
import { saveAdminOtpRecord, updateAdminOtpStatus } from '@/lib/data/admin-otp-server';

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
 * Buat dan kirim kode OTP 6-digit ke email penerima via Brevo,
 * dengan sinkronisasi otomatis ke Dashboard Admin jika kuota email habis
 */
export async function sendEmailOtp(params: {
  email: string;
  fullName?: string;
}): Promise<{ ok: boolean; fallbackToAdmin?: boolean; reason?: string; error?: string }> {
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

  // 2. Simpan ke Dashboard Admin Store
  saveAdminOtpRecord({
    email: cleanEmail,
    fullName: params.fullName,
    code: otpCode,
    expiresAt,
    status: 'pending',
    viaEmail: false,
  });

  // 3. Kirim Email OTP via Brevo API dengan Logo Resmi & Tampilan Terpusat
  const brandLogoUrl = 'https://raw.githubusercontent.com/rayy1123/rajendra-meet/main/public/brand/logo.png';
  const organizerLogoUrl = 'https://raw.githubusercontent.com/rayy1123/rajendra-meet/main/public/brand/rajendra-organizer-logo.png';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode OTP Verifikasi - Rajendra Swim System</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <!-- Header Terpusat dengan Logo Rajendra Swim System -->
        <tr>
          <td style="padding: 32px 24px 20px 24px; text-align: center; background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); border-bottom: 1px solid #f1f5f9;">
            <img src="${brandLogoUrl}" alt="Rajendra Swim System Logo" width="76" height="76" style="width: 76px; height: 76px; object-fit: contain; margin: 0 auto 12px auto; display: block; border-radius: 12px;" />
            <h1 style="margin: 0; font-size: 19px; font-weight: 900; color: #0f2b5c; letter-spacing: 0.5px; text-transform: uppercase;">
              Rajendra <span style="color: #0284c7;">Swim System</span>
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 2px;">
              Sistem Manajemen Kejuaraan Renang
            </p>
          </td>
        </tr>

        <!-- Isi Surat Terpusat Berfokus ke Kode OTP -->
        <tr>
          <td style="padding: 28px 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              Halo, <span style="color: #0369a1;">${params.fullName || cleanEmail}</span>
            </p>

            <p style="margin: 0 auto 20px auto; max-width: 420px; font-size: 13px; line-height: 1.6; color: #475569;">
              Gunakan 6 digit kode OTP resmi di bawah ini untuk menyelesaikan proses verifikasi pendaftaran akun Anda:
            </p>

            <!-- Card Kode OTP Berfokus Tinggi & Teks Gelap Kontras Maksimal -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px auto; width: 100%; max-width: 380px;">
              <tr>
                <td style="background-color: #ffffff; border: 2.5px solid #0f172a; border-radius: 16px; padding: 24px 16px; text-align: center; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);">
                  <span style="display: block; font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                    KODE VERIFIKASI RESMI
                  </span>

                  <span style="display: block; font-family: 'Courier New', Courier, monospace; font-size: 46px; font-weight: 900; letter-spacing: 14px; color: #000000; padding-left: 14px;">
                    ${otpCode}
                  </span>

                  <div style="display: inline-block; margin-top: 14px; padding: 4px 14px; background-color: #fef2f2; border: 1.5px solid #fecaca; border-radius: 9999px;">
                    <span style="font-size: 11px; font-weight: 800; color: #991b1b;">
                      ⏱️ Berlaku selama 5 menit
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <p style="margin: 22px auto 0 auto; max-width: 420px; font-size: 12px; color: #475569; line-height: 1.6;">
              Masukkan kode ini pada jendela verifikasi akun. Jangan bagikan kode ini kepada pihak mana pun demi menjaga keamanan data peserta.
            </p>

            <p style="margin: 16px auto 0 auto; max-width: 420px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              Jika Anda tidak merasa melakukan pendaftaran di Rajendra Swim System, abaikan email ini dengan aman.
            </p>
          </td>
        </tr>

        <!-- Footer Terpusat dengan Logo Rajendra Project -->
        <tr>
          <td style="padding: 20px 24px 24px 24px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
            <img src="${organizerLogoUrl}" alt="Rajendra Project" width="110" height="24" style="height: 22px; width: auto; object-fit: contain; margin: 0 auto 8px auto; display: block; opacity: 0.85;" />
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b;">
              © 2026 Rajendra Swim System • Championship Management
            </p>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8;">
              Email resmi otomatis sistem verifikasi terpusat • Mohon tidak membalas email ini
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const emailRes = await sendBrevoEmail({
    to: [{ email: cleanEmail, name: params.fullName }],
    subject: `[OTP: ${otpCode}] Kode Verifikasi Email - Rajendra Swim System`,
    htmlContent: html,
  });

  if (!emailRes.ok) {
    console.warn(`[OTP Notice] Pengiriman Brevo tidak aktif atau kuota habis (${emailRes.error}). Diteruskan ke Dashboard Admin: ${cleanEmail} -> ${otpCode}`);

    // Update status di Admin Store bahwa email tidak terkirim langsung
    saveAdminOtpRecord({
      email: cleanEmail,
      fullName: params.fullName,
      code: otpCode,
      expiresAt,
      status: 'fallback_to_admin',
      viaEmail: false,
      errorMessage: emailRes.error,
    });

    // Tetap kembalikan ok: true dengan sinyal fallbackToAdmin agar user dapat lanjut memasukkan OTP
    return {
      ok: true,
      fallbackToAdmin: true,
      reason: 'Kuota email pengiriman habis atau server email sibuk. Kode OTP telah diteruskan ke Dashboard Panitia/Admin.',
    };
  }

  // Berhasil dikirim via email
  saveAdminOtpRecord({
    email: cleanEmail,
    fullName: params.fullName,
    code: otpCode,
    expiresAt,
    status: 'sent',
    viaEmail: true,
  });

  return { ok: true, fallbackToAdmin: false };
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

  // OTP Valid -> Hapus dari store & tandai status verifikasi
  localOtpStore.delete(cleanEmail);
  try { await redis.del(key); } catch {}
  updateAdminOtpStatus(cleanEmail, 'verified');

  return { ok: true };
}
