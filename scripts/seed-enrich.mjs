// Enrich seed: daftarkan atlet realistis ke banyak nomor lomba & hasilkan
// heats + heat_assignments + results agar scoreboard / ranking / medali terisi penuh.
// Tidak mengubah nama atlet/sekolah (sudah di-seed sebelumnya).
// Idempoten: bersihkan dulu results/assignments/heats/registrations lalu bangun ulang.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const pick = (k) => env.match(new RegExp(`${k}=\"?([^\"\\n]+)\"?`))?.[1];
const URL = pick('NEXT_PUBLIC_SUPABASE_URL');
const ANON = pick('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const sb = createClient(URL, ANON, { auth: { persistSession: false } });

const BASE = {
  Freestyle: { 25: 16000, 50: 33000, 100: 75000 },
  Backstroke: { 25: 18000, 50: 36000, 100: 82000 },
  Breaststroke: { 25: 20000, 50: 40000, 100: 90000 },
  Butterfly: { 25: 17000, 50: 35000, 100: 80000 },
  Medley: { 25: 21000, 50: 41000, 100: 92000 },
  'Individual Medley': { 100: 93000, 200: 175000 },
};
function realisticTime(stroke, dist) {
  const map = BASE[stroke] || BASE.Freestyle;
  const base = map[dist] || map[Object.keys(map)[0]] || 40000;
  const v = base * (0.80 + Math.random() * 0.40);
  return Math.round(v / 10) * 10;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

async function main() {
  const { error: e0 } = await sb.auth.signInWithPassword({ email: 'admin@rajendra.id', password: 'Rajendra#2026' });
  if (e0) throw new Error('LOGIN GAGAL: ' + e0.message);

  // Bersihkan hasil & pendaftaran lama (demo hanya berisi seed)
  await sb.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('heat_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('heats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✓ data lomba lama dibersihkan');

  const { data: events } = await sb.from('events').select('id,lane_count');
  const { data: athletes } = await sb.from('athletes').select('id,event_id,gender');
  const { data: ces } = await sb.from('competition_events').select('id,event_id,stroke,distance_meters');
  const byEvent = {};
  (ces || []).forEach((c) => (byEvent[c.event_id] = byEvent[c.event_id] || []).push(c));
  const athByEvent = {};
  (athletes || []).forEach((a) => (athByEvent[a.event_id] = athByEvent[a.event_id] || []).push(a));

  let regCount = 0, heatCount = 0, resCount = 0;
  for (const ev of events) {
    const evAths = shuffle((athByEvent[ev.id] || []).slice());
    const evCEs = shuffle((byEvent[ev.id] || []).slice());
    const lane = ev.lane_count || 8;
    // setiap atlet ikut 5-8 nomor acak (realistis: perenang ikut beberapa nomor)
    const usedPairs = new Set();
    for (const a of evAths) {
      const n = 5 + Math.floor(Math.random() * 4); // 5..8
      const chosen = shuffle(evCEs.slice()).slice(0, n);
      for (const ce of chosen) {
        const key = a.id + '|' + ce.id;
        if (usedPairs.has(key)) continue;
        usedPairs.add(key);
        const { error } = await sb.from('registrations').insert({
          event_id: ev.id, athlete_id: a.id, competition_event_id: ce.id, seed_time_ms: 0,
        });
        if (!error) regCount++;
      }
    }
    // bangun heats per CE yang punya >=2 registrasi
    const { data: regs } = await sb.from('registrations').select('id,competition_event_id').eq('event_id', ev.id);
    const byCE = {};
    (regs || []).forEach((r) => (byCE[r.competition_event_id] = byCE[r.competition_event_id] || []).push(r));
    const ceMap = {}; (ces || []).forEach((c) => (ceMap[c.id] = c));
    for (const ceId of Object.keys(byCE)) {
      const list = byCE[ceId];
      if (list.length < 2) continue;
      const numHeats = Math.ceil(list.length / lane);
      for (let h = 0; h < numHeats; h++) {
        const slice = list.slice(h * lane, (h + 1) * lane);
        if (slice.length === 0) continue;
        const { data: heat } = await sb.from('heats').insert({ competition_event_id: ceId, heat_number: h + 1 }).select('id').single();
        for (let i = 0; i < slice.length; i++) {
          const { data: ha } = await sb.from('heat_assignments').insert({ heat_id: heat.id, registration_id: slice[i].id, lane_number: i + 1 }).select('id').single();
          const t = realisticTime(ceMap[ceId]?.stroke, ceMap[ceId]?.distance_meters);
          await sb.from('results').insert({ heat_assignment_id: ha.id, time_ms: t, status: 'finished', is_new_record: false });
          resCount++;
        }
        heatCount++;
      }
    }
  }
  console.log(`✓ registrations: ${regCount} | heats: ${heatCount} | results: ${resCount}`);
  console.log('\nENRICH SELESAI');
}

main().catch((e) => { console.error('GAGAL:', e.message); process.exit(1); });
