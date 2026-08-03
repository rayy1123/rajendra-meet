/**
 * Uji integrasi memakai data NYATA dari Kejurda Banten 2026
 * (hasil rekonstruksi rayy1123 project): 9 peserta 50M Gaya Bebas,
 * kolam 8 lintasan.
 *
 * Tujuannya membuktikan logika bekerja pada bentuk data sungguhan,
 * bukan hanya fixture buatan.
 */
import { describe, it, expect } from 'vitest';
import { generateHeats, type RegistrationSeed } from '../seeding';
import { rankResults, medalForRank, type RankableResult } from '../ranking';
import { buildStandings, type PointRule, type ScoredEntry } from '../points';
import { resolveAgeGroup, type AgeGroupRule } from '../age-group';

/** Data asli dari database, seed dalam milidetik. */
const REAL_SWIMMERS = [
  { registration_id: 'r-radit', name: 'Radit', seed_time_ms: 34120 },
  { registration_id: 'r-rafael', name: 'Rafael', seed_time_ms: 35210 },
  { registration_id: 'r-rayvanes', name: 'Rayvanes Arrasyid', seed_time_ms: 35300 },
  { registration_id: 'r-arkan', name: 'Arkan Bogan Syahputra', seed_time_ms: 37000 },
  { registration_id: 'r-fasih', name: 'Fasih', seed_time_ms: 37210 },
  { registration_id: 'r-ahmad', name: 'Ahmad Dekatama', seed_time_ms: 40000 },
  { registration_id: 'r-farrel', name: 'Farrel Reno', seed_time_ms: 45220 },
  { registration_id: 'r-dzaky', name: 'Dzaky Almair Rasyid', seed_time_ms: 50320 },
  { registration_id: 'r-edgar', name: 'Edgar Peter', seed_time_ms: 82200 },
];

const LANE_COUNT = 8;

const seeds: RegistrationSeed[] = REAL_SWIMMERS.map((s) => ({
  registration_id: s.registration_id,
  seed_time_ms: s.seed_time_ms,
}));

const nameOf = (id: string) =>
  REAL_SWIMMERS.find((s) => s.registration_id === id)!.name;

describe('data nyata Kejurda Banten 2026 — pembagian heat', () => {
  const heats = generateHeats(seeds, LANE_COUNT);

  it('9 peserta di kolam 8 lintasan menghasilkan 2 heat', () => {
    expect(heats).toHaveLength(2);
  });

  it('heat yang tidak penuh adalah heat 1, bukan heat terakhir', () => {
    expect(heats[0].assignments).toHaveLength(1);
    expect(heats[1].assignments).toHaveLength(8);
  });

  it('Edgar Peter (paling lambat) berada di heat 1', () => {
    const heat1 = heats[0].assignments.map((a) => nameOf(a.registration_id));
    expect(heat1).toEqual(['Edgar Peter']);
  });

  it('Radit (tercepat) berada di heat terakhir', () => {
    const last = heats[heats.length - 1].assignments.map((a) => nameOf(a.registration_id));
    expect(last).toContain('Radit');
  });

  it('Radit mendapat lintasan tengah (lane 4)', () => {
    const last = heats[heats.length - 1];
    const radit = last.assignments.find((a) => nameOf(a.registration_id) === 'Radit');
    expect(radit?.lane_number).toBe(4);
  });

  it('semua 9 peserta terjadwal tepat sekali', () => {
    const all = heats.flatMap((h) => h.assignments.map((a) => a.registration_id));
    expect(all).toHaveLength(9);
    expect(new Set(all).size).toBe(9);
  });

  it('tidak ada lintasan ganda dalam satu heat', () => {
    for (const h of heats) {
      const lanes = h.assignments.map((a) => a.lane_number);
      expect(new Set(lanes).size).toBe(lanes.length);
      lanes.forEach((l) => {
        expect(l).toBeGreaterThanOrEqual(1);
        expect(l).toBeLessThanOrEqual(LANE_COUNT);
      });
    }
  });
});

describe('data nyata — perangkingan lintas heat', () => {
  it('peserta heat 1 yang tampil bagus tetap bisa juara', () => {
    // Skenario: Edgar (heat 1, sendirian) berenang jauh lebih cepat
    // daripada perkiraan dan mengalahkan seluruh peserta heat 2.
    const results: RankableResult[] = [
      { registration_id: 'r-edgar', time_ms: 33000, status: 'finished' },
      { registration_id: 'r-radit', time_ms: 34000, status: 'finished' },
      { registration_id: 'r-rafael', time_ms: 35000, status: 'finished' },
    ];
    const ranked = rankResults(results);
    expect(ranked[0].registration_id).toBe('r-edgar');
    expect(medalForRank(ranked[0].rank)).toBe('gold');
  });

  it('DQ pada peserta tercepat memindahkan emas ke peringkat berikutnya', () => {
    const results: RankableResult[] = [
      { registration_id: 'r-radit', time_ms: null, status: 'dq' },
      { registration_id: 'r-rafael', time_ms: 35210, status: 'finished' },
      { registration_id: 'r-rayvanes', time_ms: 35300, status: 'finished' },
    ];
    const ranked = rankResults(results);
    expect(ranked[0].registration_id).toBe('r-rafael');
    expect(medalForRank(ranked[0].rank)).toBe('gold');
    expect(ranked.find((r) => r.registration_id === 'r-radit')?.rank).toBeNull();
  });
});

describe('data nyata — Kelompok Umur', () => {
  // Aturan default hasil seeding: KU 1 = kelahiran s.d. 2009-12-31
  const rules: AgeGroupRule[] = [
    { code: 'KU 1', birthDateFrom: null, birthDateTo: '2009-12-31', sortOrder: 1 },
    { code: 'KU 2', birthDateFrom: '2010-01-01', birthDateTo: '2011-12-31', sortOrder: 2 },
  ];

  it('Rayvanes (11 Juni 2008) masuk KU 1', () => {
    expect(resolveAgeGroup('2008-06-11', 'male', rules)).toBe('KU 1');
  });

  it('atlet kelahiran 2009 juga KU 1', () => {
    expect(resolveAgeGroup('2009-06-29', 'male', rules)).toBe('KU 1');
  });

  it('panitia menggeser batas KU 1 ke 2008 — Rayvanes tetap KU 1, Fasih turun', () => {
    const geser: AgeGroupRule[] = [
      { code: 'KU 1', birthDateFrom: null, birthDateTo: '2008-12-31', sortOrder: 1 },
      { code: 'KU 2', birthDateFrom: '2009-01-01', birthDateTo: '2009-12-31', sortOrder: 2 },
    ];
    expect(resolveAgeGroup('2008-06-11', 'male', geser)).toBe('KU 1'); // Rayvanes
    expect(resolveAgeGroup('2009-06-29', 'male', geser)).toBe('KU 2'); // Fasih
  });
});

describe('data nyata — klasemen sekolah', () => {
  const RULES: PointRule[] = [
    { rank: 1, points: 10 },
    { rank: 2, points: 8 },
    { rank: 3, points: 6 },
  ];

  it('SSG Aquatic unggul lewat dua podium', () => {
    const entries: ScoredEntry[] = [
      {
        athlete_id: 'rayvanes', school_id: 'SSG', grade_level: 'SMA',
        class_name: '', gender: 'male', rank: 1, competition_event_id: 'CE1',
      },
      {
        athlete_id: 'radit', school_id: 'SSG', grade_level: 'SMA',
        class_name: '', gender: 'male', rank: 3, competition_event_id: 'CE1',
      },
      {
        athlete_id: 'farrel', school_id: 'LAIN', grade_level: 'SMK',
        class_name: '', gender: 'male', rank: 2, competition_event_id: 'CE1',
      },
    ];
    const rows = buildStandings(entries, RULES);
    expect(rows[0].school_id).toBe('SSG');
    expect(rows[0].points).toBe(16);
    expect(rows[0].gold).toBe(1);
  });
});
