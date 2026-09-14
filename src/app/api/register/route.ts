import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Inisialisasi atau lengkapi data profil jika user berhasil terdaftar
    if (data.user) {
      await supabase
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          username: cleanUsername,
          school_id: school_id || null,
          role: 'viewer',
        })
        .eq('id', data.user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      user: {
        id: data.user?.id,
        email: authEmail,
        username: cleanUsername,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat registrasi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
