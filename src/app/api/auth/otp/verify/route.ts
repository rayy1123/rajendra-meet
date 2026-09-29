import { NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/auth/otp-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan kode OTP 6-digit wajib diisi.' },
        { status: 400 }
      );
    }

    const res = await verifyEmailOtp({ email, code });

    if (!res.ok) {
      return NextResponse.json({ error: res.error || 'Verifikasi OTP gagal.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi dengan OTP!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat verifikasi OTP.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
