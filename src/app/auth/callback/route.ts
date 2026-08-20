import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback (PKCE flow wajib untuk Supabase SSR).
 * Link dari email — konfirmasi pendaftaran maupun reset password —
 * mendarat di sini membawa ?code=... yang ditukar menjadi session.
 * Tanpa route ini, user yang klik link email tidak akan pernah login.
 */

// Cegah open-redirect: hanya izinkan path relatif yang diawali '/' dan
// BUKAN protocol-relative ('//') agar tidak bisa dialihkan ke domain lain.
function safeNext(raw: string | null): string {
  if (!raw) return '/';
  // Tolak absolute URL (http://, https://) dan protocol-relative (//).
  if (/^(https?:)?\/\//i.test(raw)) return '/';
  // Hanya izinkan path yang diawali satu slash tunggal.
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Kegagalan penukaran: arahkan ke login dengan indikator error.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
