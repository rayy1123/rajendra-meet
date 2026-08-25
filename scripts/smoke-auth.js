// Smoke test autentikasi: login sebagai admin, lalu GET halaman data admin.
// Menangkap status + error runtime (Next menyuntikkan error ke HTML saat crash).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const pick = (k) => env.match(new RegExp(`${k}=\"?([^\"\\n]+)\"?`))?.[1];
const url = pick('NEXT_PUBLIC_SUPABASE_URL');
const key = pick('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const sb = createClient(url, key, { auth: { persistSession: false } });

const routes = [
  '/dashboard',
  '/events',
  '/athletes',
  '/heats',
  '/results',
  '/rankings',
  '/awards',
  '/medals',
  '/verifikasi-pembayaran',
  '/equipment',
  '/audit',
  '/schools',
  '/settings',
  '/export',
  '/sertifikat',
  '/live',
];

const EMAIL = process.env.TEST_EMAIL || 'admin@rajendra.id';
const PW = process.env.TEST_PASSWORD || 'Rajendra#2026';

async function main() {
  const { error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PW });
  if (error) {
    console.error('LOGIN FAIL:', error.message);
    process.exit(1);
  }
  const { data } = await sb.auth.getSession();
  const access = data.session?.access_token;
  const refresh = data.session?.refresh_token;
  const cookies = [
    `sb-${url.split('//')[1].split('.')[0]}-auth-token=base64-${Buffer.from(
      JSON.stringify({ access_token: access, refresh_token: refresh })
    ).toString('base64url')}`,
  ].join('; ');

  let fails = 0;
  for (const r of routes) {
    try {
      const res = await fetch('http://localhost:3000' + r, { headers: { cookie: cookies }, redirect: 'manual' });
      const body = res.status === 200 ? await res.text() : '';
      const crashed =
        body.includes('Application error') ||
        body.includes('Internal Server Error') ||
        /__next_error__/.test(body);
      const status = res.status;
      const flag = status >= 500 || crashed ? '  <-- FAIL' : '';
      if (flag) fails++;
      console.log(`${r} -> ${status}${flag}`);
    } catch (e) {
      console.log(`${r} -> ERR ${e.message}`);
      fails++;
    }
  }
  console.log(fails === 0 ? '\nALL OK' : `\n${fails} FAIL`);
  process.exit(fails === 0 ? 0 : 1);
}

main();
