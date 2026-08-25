import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (menggantikan middleware yang sudah deprecated di Next.js 16).
 * Tugas:
 *   1. Refresh sesi Supabase (set cookie session lewat response).
 *   2. Guard rute — hanya rute publik yang boleh diakses tanpa login.
 *   3. Suntikkan security headers pada SETIAP response.
 */

const PUBLIC_ROUTE_PREFIXES = [
  '/public',
  '/public-live',
  '/scoreboard',
  '/medali',
  '/guide',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/kontak',
  '/program',
  '/galeri',
  '/live',
  '/',
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Guard dijalankan di bawah (setelah refresh sesi) agar cookie terbaru
  // ikut terbawa ke redirect.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname === '/login' ||
    PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return applySecurityHeaders(redirectResponse);
  }

  if (user && pathname === '/login') {
    // Sudah login: arahkan ke dashboard masing-masing, bukan /dashboard
    // (yang hanya untuk admin & akan memantulkan viewer ke landing).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile as { role?: string } | null)?.role;
    const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator'];
    const target = role && ADMIN_ROLES.includes(role) ? '/events' : '/dashboard-viewer';
    const url = request.nextUrl.clone();
    url.pathname = target;
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return applySecurityHeaders(redirectResponse);
  }

  return applySecurityHeaders(response);
}

/**
 * Header keamanan standar tinggi untuk seluruh aplikasi.
 * - CSP: membatasi sumber script/style/connect agar mitigasi XSS & injeksi.
 * - HSTS: paksa HTTPS (hanya aktif efektif di production/Vercel).
 * - X-Frame-Options + frame-ancestors: cegah clickjacking.
 * - NoSniff: cegah MIME sniffing.
 * - Referrer-Policy: tidak bocor path saat navigasi keluar.
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // React dev (Next.js dev mode) membutuhkan 'unsafe-eval' untuk HMR &
  // runtime dev-nya; tanpa ini client tidak ter-hydrate sehingga seluruh
  // interaktivitas (tombol, form, hamburger) mati di `npm run dev`.
  // Di production React sudah ter-compile sehingga eval tidak diperlukan
  // dan kita biarkan CSP tetap ketat (tanpa unsafe-eval).
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  const csp = [
    "default-src 'self'",
    // Supabase JS butuh wasm + WS untuk realtime; izinkan host Supabase.
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    // Style inline diperlukan oleh Tailwind (CDN-free, tapi ada style dinamis).
    "style-src 'self' 'unsafe-inline'",
    // Script: hanya milik sendiri (Next.js menyajikan dari /_next).
    `script-src ${scriptSrc}`,
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
