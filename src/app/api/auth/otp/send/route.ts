import { NextResponse } from 'next/server';
import { sendEmailOtp } from '@/lib/auth/otp-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Alamat email tidak valid.' },
        { status: 400 }
      );
    }

    const res = await sendEmailOtp({ email, fullName });

    if (!res.ok) {
      return NextResponse.json({ error: res.error || 'Gagal mengirim OTP.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      fallbackToAdmin: res.fallbackToAdmin ?? false,
      reason: res.reason,
      message: res.fallbackToAdmin
        ? 'Kuota email habis atau tertunda. Kode OTP berhasil diteruskan ke Dashboard Panitia/Admin.'
        : `Kode OTP 6-digit berhasil dikirim ke ${email}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat mengirim OTP.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
