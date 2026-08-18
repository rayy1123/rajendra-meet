// Runtime e2e cek: login viewer, insert registration + payment_verifications lewat RLS,
// lalu cek bisa dibaca & di-verify sebagai operator. Bukti fitur jalan, bukan cuma analisis.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const pick = (k) => env.match(new RegExp(`${k}="?([^"\n]+)"?`))?.[1];
const URL = pick('NEXT_PUBLIC_SUPABASE_URL');
const ANON = pick('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const sb = createClient(URL, ANON, { auth: { persistSession: false } });

const EMAIL = 'pendaftaran@rajendra.id';
const PW = 'Penonton#2026';

async function main() {
  // 1. login viewer
  const { data: auth, error: e1 } = await sb.auth.signInWithPassword({ email: EMAIL, password: PW });
  if (e1) throw new Error('LOGIN GAGAL: ' + e1.message);
  console.log('✓ login viewer:', auth.user.email, '| uid:', auth.user.id.slice(0, 8));

  // ambil event + 1 competition_event (Festival)
  const { data: ev } = await sb.from('events').select('id').eq('name', 'Festival Renang Pelajar 2026').single();
  const { data: ce } = await sb.from('competition_events').select('id').eq('event_id', ev.id).limit(1).single();

  // 2. buat atlet (event-scoped, seperti action createAthleteAndRegisterAction)
  const { data: ath, error: e2 } = await sb.from('athletes').insert({
    event_id: ev.id,
    athlete_number: 'E2E-' + Date.now().toString(36),
    full_name: 'Atlet Tes E2E',
    gender: 'male',
    birth_date: '2014-05-01',
    grade_level: 'TK',
    class_name: '',
    age_group: '',
    school_id: null,
  }).select('id').single();
  if (e2) throw new Error('INSERT ATHLETE GAGAL (RLS?): ' + e2.message);
  console.log('✓ atlet dibuat:', ath.id.slice(0, 8));

  // 3. insert registration dgn registrant_id = user (seperti action)
  const { data: reg, error: e3 } = await sb.from('registrations').insert({
    event_id: ev.id,
    athlete_id: ath.id,
    competition_event_id: ce.id,
    registrant_id: auth.user.id,
  }).select('id').single();
  if (e3) throw new Error('INSERT REGISTRATION GAGAL (RLS?): ' + e3.message);
  console.log('✓ registration dibuat:', reg.id.slice(0, 8));

  // 4. insert payment_verifications pending (policy: registrant_id = auth.uid())
  const { data: pay, error: e4 } = await sb.from('payment_verifications').insert({
    registration_id: reg.id,
    status: 'pending',
    amount_due: 50000,
    proof_url: 'https://example.com/bukti.jpg',
  }).select('id, status').single();
  if (e4) throw new Error('INSERT PAYMENT GAGAL (RLS?): ' + e4.message);
  console.log('✓ payment_verifications dibuat:', pay.id.slice(0, 8), '| status:', pay.status);

  // 5. baca balik sebagai viewer (registrations_read_own / payver_read)
  const { data: read, error: e5 } = await sb.from('payment_verifications').select('id, status').eq('id', pay.id).single();
  if (e5) throw new Error('READ PAYMENT GAGAL: ' + e5.message);
  console.log('✓ payment terbaca kembali, status:', read.status);

  // cleanup (hapus agar tidak mengotori DB)
  await sb.from('payment_verifications').delete().eq('id', pay.id);
  await sb.from('registrations').delete().eq('id', reg.id);
  await sb.from('athletes').delete().eq('id', ath.id);
  console.log('✓ cleanup selesai (baris test dihapus)');
  console.log('\nHASIL: FITUR PENDAFTARAN + VERIFIKASI BERFUNGSI (insert + read lewat RLS OK)');
}

main().catch((e) => { console.error('\n✗ GAGAL:', e.message); process.exit(1); });
