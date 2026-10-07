import { NextResponse } from 'next/server';
import { readLocalAccounts, writeLocalAccounts } from '@/lib/data/accounts-server';
import { sendBrevoEmail } from '@/lib/email/brevo';
import { createClient } from '@/lib/supabase/server';
import { isEmailOtpVerified, consumeEmailOtpVerified } from '@/lib/auth/otp-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Alamat email tidak valid.' },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi baru minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Verifikasi bukti bahwa pengguna telah memverifikasi kode OTP email
    const isVerified = await isEmailOtpVerified(cleanEmail);
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Akses ditolak: Alamat email belum diverifikasi via kode OTP resmi.' },
        { status: 403 }
      );
    }

    // Konsumsi status verifikasi agar tidak bisa digunakan ulang
    await consumeEmailOtpVerified(cleanEmail);

    // 1. Update password di accounts-store jika ada
    const accounts = readLocalAccounts();
    let accountUpdated = false;
    const updatedAccounts = accounts.map((acc) => {
      if (acc.email.toLowerCase() === cleanEmail) {
        accountUpdated = true;
        return {
          ...acc,
          generated_password: cleanPassword,
        };
      }
      return acc;
    });

    if (accountUpdated) {
      writeLocalAccounts(updatedAccounts);
    }

    // 2. Coba update password di Supabase Auth jika ada user aktif
    try {
      const supabase = await createClient();
      await supabase.auth.updateUser({
        password: cleanPassword,
      });
    } catch (err) {
      console.warn('[Reset Password] Supabase auth update notice:', err);
    }

    // 3. Kirim email pemberitahuan resmi via Brevo
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background-color: #0f2b5c; padding: 20px; border-radius: 12px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; text-transform: uppercase;">Rajendra Swim System</h2>
            <p style="color: #38bdf8; margin: 4px 0 0 0; font-size: 11px; font-weight: bold;">KATA SANDI BERHASIL DIPERBARUI</p>
          </div>
          <div style="padding: 24px 0; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p>Halo <b>${cleanEmail}</b>,</p>
            <p>Kata sandi akun Rajendra Swim System Anda telah <b>berhasil diperbarui</b> melalui verifikasi kode OTP resmi.</p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 10px; margin: 16px 0; color: #166534; font-size: 13px;">
              ✅ <b>Keamanan Terjamin:</b> Anda sekarang dapat masuk ke akun Anda menggunakan kata sandi baru.
            </div>
            <p style="font-size: 12px; color: #64748b;">
              Jika Anda tidak merasa melakukan perubahan ini, segera hubungi tim admin Rajendra Swim System.
            </p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
            © 2026 Rajendra Swim System • Layanan Notifikasi Keamanan Resmi
          </div>
        </div>
      `;

      await sendBrevoEmail({
        to: [{ email: cleanEmail }],
        subject: '[Rajendra Swim System] Kata Sandi Akun Anda Berhasil Diperbarui',
        htmlContent,
      });
    } catch (emailErr) {
      console.warn('[Reset Password] Brevo notify email error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat mereset kata sandi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
