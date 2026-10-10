import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUserAccountServer } from '@/lib/data/accounts-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, username, email, password, school_id, phone } = body;

    if (!full_name || !password || (!username && !email)) {
      return NextResponse.json(
        { error: 'Nama lengkap, username/email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const rawIdentifier = (email || username || '').trim().toLowerCase();
    const cleanUsername = (username || email?.split('@')[0] || '').trim().toLowerCase().replace(/\s+/g, '_');
    const authEmail = rawIdentifier.includes('@') ? rawIdentifier : `${cleanUsername}@scms.local`;

    const supabase = await createClient();
    let registeredUserId: string | undefined = undefined;

    // 1. Coba daftarkan ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        data: {
          full_name: full_name.trim(),
          username: cleanUsername,
          school_id: school_id || null,
          phone: phone || null,
        },
      },
    });

    if (data?.user) {
      registeredUserId = data.user.id;
      // Inisialisasi atau lengkapi data profil jika user berhasil terdaftar di auth.users
      await supabase
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          username: cleanUsername,
          school_id: school_id || null,
          role: 'viewer',
        })
        .eq('id', data.user.id);
    } else if (error) {
      const isRateLimit =
        error.message?.toLowerCase().includes('rate limit') ||
        error.status === 429;
      const isAlreadyRegistered =
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists');

      if (isAlreadyRegistered) {
        return NextResponse.json(
          { error: `Akun dengan email ${authEmail} sudah terdaftar. Silakan langsung login di halaman Masuk.` },
          { status: 400 }
        );
      }

      if (isRateLimit) {
        return NextResponse.json(
          {
            error:
              'Batas pengiriman email bawaan Supabase tercapai (rate limit). Harap nonaktifkan "Confirm email" di Supabase Dashboard (Authentication -> Providers -> Email -> Confirm email: OFF) agar registrasi aktif langsung tanpa hambatan.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2. Kirim email selamat datang resmi via Brevo API (Bukan via Supabase)
    if (authEmail && authEmail.includes('@') && !authEmail.endsWith('@scms.local')) {
      try {
        const { sendAccountRegistrationEmail } = await import('@/lib/email/brevo');
        await sendAccountRegistrationEmail({
          toEmail: authEmail,
          toName: full_name.trim(),
          username: cleanUsername,
        });
      } catch (emailErr) {
        console.warn('[Register Email Notice via Brevo]:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil. Akun Anda telah aktif dan terverifikasi.',
      user: {
        id: registeredUserId,
        email: authEmail,
        username: cleanUsername,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat registrasi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
