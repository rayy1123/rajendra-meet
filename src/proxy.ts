import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { validateUserSession } from '@/lib/auth/session-limiter';

/**
 * Proxy (menggantikan middleware yang sudah deprecated di Next.js 16).
 * Tugas:
 *   1. Refresh sesi Supabase (set cookie session lewat response).
 *   2. Guard rute — hanya rute publik yang boleh diakses tanpa login.
 *   3. Batasi konkurensi sesi (single active session enforcement).
 *   4. Suntikkan security headers pada SETIAP response.
 */

const PUBLIC_ROUTE_PREFIXES = [
  '/public',
  '/public-live',
  '/scoreboard',
  '/medali',
  '/rajendra-record',
  '/guide',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/kontak',
  '/program',
  '/galeri',
  '/live',
  '/invoice',
  '/videos',
  '/gallery',
  '/slider',
  '/brand',
  '/uploads',
  '/403',
  '/api/auth',
  '/api/register',
  '/api/schools',
  '/api/scoreboard',
  '/api/showcases',
  '/api/health',
  '/',
];

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // Cloudflare Header Handling: Tangkap IP Pengunjung Asli (CF-Connecting-IP)
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (clientIp) {
    requestHeaders.set('x-client-ip', clientIp);
    requestHeaders.set('x-real-ip', clientIp);
  }

  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry) {
    requestHeaders.set('x-client-country', cfCountry);
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/[\r\n\t]/g, '');
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/[\r\n\t]/g, '');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  const pathname = request.nextUrl.pathname;
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('sec-purpose') === 'prefetch';

  const isPublicRoute =
    pathname === '/login' ||
    PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  // Cek apakah ada cookie sesi auth Supabase
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) =>
    c.name.includes('supabase') || c.name.startsWith('sb-')
  );

  // 1. Optimasi Navigasi Publik: Jika rute publik dan tidak ada cookie auth,
  // langsung kembalikan response tanpa network call ke auth server (Instan 0ms overhead).
  if (isPublicRoute && !hasAuthCookie) {
    return applySecurityHeaders(response);
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

  if (!user && !isPublicRoute) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return applySecurityHeaders(redirectResponse);
  }

  // Pembatasan Sesi Bersamaan (Concurrent Session Limit):
  // Pastikan akun hanya aktif pada satu sesi tunggal.
  // Lewati pemeriksaan sesi berat pada request prefetch agar navigasi klik instan.
  if (user && !isPublicRoute && !isPrefetch) {
    const clientSessionId = request.cookies.get('scms_session_id')?.value;
    const { isValid, activeSessionId } = await validateUserSession(user, clientSessionId);

    if (!isValid) {
      if (pathname.startsWith('/api/')) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: 'Sesi Anda telah berakhir karena akun ini sedang aktif di perangkat lain.' },
            { status: 401 }
          )
        );
      }

      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'concurrent_session');
      const redirectResponse = NextResponse.redirect(url);

      request.cookies.getAll().forEach((c) => {
        if (c.name.includes('supabase') || c.name.startsWith('sb-') || c.name === 'scms_session_id') {
          redirectResponse.cookies.set(c.name, '', { path: '/', maxAge: 0 });
        }
      });
      return applySecurityHeaders(redirectResponse);
    }

    // Jika sesi valid dan response belum memiliki cookie scms_session_id, sertakan
    if (activeSessionId && !clientSessionId) {
      response.cookies.set('scms_session_id', activeSessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      });
    }
  }

  if (user && pathname === '/login') {
    // Jangan redirect jika ada notifikasi error sesi bersamaan
    if (request.nextUrl.searchParams.has('error')) {
      return applySecurityHeaders(response);
    }

    // Sudah login: arahkan ke dashboard masing-masing, bukan /dashboard
    // (yang hanya untuk admin & akan memantulkan viewer ke landing).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile as { role?: string } | null)?.role;
    const ADMIN_ROLES = [
      'super_admin',
      'event_admin',
      'operator',
      'admin',
      'admin_kejuaraan',
      'admin_keuangan',
    ];
    const target = role && ADMIN_ROLES.includes(role) ? '/dashboard' : '/dashboard-viewer';
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
    // Supabase JS, Brevo API, & Cloudflare; izinkan host terkait.
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.brevo.com https://*.cloudflare.com",
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav|ico|txt)$).*)',
  ],
};
