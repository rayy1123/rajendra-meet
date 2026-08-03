import { describe, it, expect } from 'vitest';
import {
  scoreSwimmers,
  selectBestSwimmers,
  compareSwimmers,
  detectBrokenRecords,
  type SwimmerEntry,
  type SwimmerScore,
  type RecordCandidate,
  type ExistingRecord,
} from '../records';
import type { PointRule } from '../points';

const RULES: PointRule[] = [
  { rank: 1, points: 10 },
  { rank: 2, points: 8 },
  { rank: 3, points: 6 },
  { rank: 4, points: 5 },
];

function sw(over: Partial<SwimmerEntry> & { athlete_id: string; competition_event_id: string; rank: number | null }): SwimmerEntry {
  return {
    athlete_name: over.athlete_id.toUpperCase(),
    school_id: 'S1',
    grade_level: 'SD',
    class_name: 'Kelas 6',
    gender: 'male',
    ...over,
  };
}

function score(over: Partial<SwimmerScore>): SwimmerScore {
  return {
    athlete_id: 'x',
    athlete_name: 'X',
    school_id: 'S',
    grade_level: 'SD',
    class_name: 'Kelas 6',
    gender: 'male',
    points: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    event_count: 0,
    ...over,
  };
}

describe('scoreSwimmers', () => {
  it('mengakumulasi poin lintas nomor lomba', () => {
    const scored = scoreSwimmers(
      [
        sw({ athlete_id: 'a', competition_event_id: 'CE1', rank: 1 }),
        sw({ athlete_id: 'a', competition_event_id: 'CE2', rank: 2 }),
      ],
      RULES
    );
    expect(scored).toHaveLength(1);
    expect(scored[0].points).toBe(18);
    expect(scored[0].event_count).toBe(2);
    expect(scored[0].gold).toBe(1);
    expect(scored[0].silver).toBe(1);
  });

  it('peserta DQ tetap terhitung ikut lomba tapi tanpa poin', () => {
    const scored = scoreSwimmers(
      [sw({ athlete_id: 'a', competition_event_id: 'CE1', rank: null })],
      RULES
    );
    expect(scored[0].points).toBe(0);
    expect(scored[0].event_count).toBe(1);
  });
});

describe('selectBestSwimmers', () => {
  it('memilih peraih poin terbanyak', () => {
    const entries: SwimmerEntry[] = [
      sw({ athlete_id: 'juara', competition_event_id: 'CE1', rank: 1 }),
      sw({ athlete_id: 'juara', competition_event_id: 'CE2', rank: 1 }),
      sw({ athlete_id: 'lawan', competition_event_id: 'CE1', rank: 2 }),
    ];
    const groups = selectBestSwimmers(entries, RULES);
    expect(groups).toHaveLength(1);
    expect(groups[0].winner?.athlete_id).toBe('juara');
    expect(groups[0].winner?.points).toBe(20);
    expect(groups[0].tied).toBe(false);
  });

  it('memisahkan kelas dan gender', () => {
    const entries: SwimmerEntry[] = [
      sw({ athlete_id: 'putra', competition_event_id: 'CE1', rank: 1, gender: 'male' }),
      sw({ athlete_id: 'putri', competition_event_id: 'CE2', rank: 1, gender: 'female' }),
      sw({ athlete_id: 'smp', competition_event_id: 'CE3', rank: 1, grade_level: 'SMP', class_name: 'Kelas 9' }),
    ];
    const groups = selectBestSwimmers(entries, RULES);
    expect(groups).toHaveLength(3);
    const keys = groups.map((g) => g.group_key);
    expect(keys).toContain('SD Kelas 6 / male');
    expect(keys).toContain('SD Kelas 6 / female');
    expect(keys).toContain('SMP Kelas 9 / male');
  });

  it('poin sama diputus oleh jumlah emas', () => {
    const entries: SwimmerEntry[] = [
      // A: emas + peringkat 4 = 15
      sw({ athlete_id: 'a', competition_event_id: 'CE1', rank: 1 }),
      sw({ athlete_id: 'a', competition_event_id: 'CE2', rank: 4 }),
      // B: perak + perunggu + ... = 15 tanpa emas
      sw({ athlete_id: 'b', competition_event_id: 'CE1', rank: 2 }),
      sw({ athlete_id: 'b', competition_event_id: 'CE2', rank: 3 }),
      sw({ athlete_id: 'b', competition_event_id: 'CE3', rank: null }),
    ];
    const groups = selectBestSwimmers(entries, RULES);
    // keduanya 15 poin; A menang karena punya emas
    expect(groups[0].winner?.athlete_id).toBe('a');
  });

  it('poin & medali sama diputus oleh jumlah nomor lomba lebih sedikit', () => {
    const entries: SwimmerEntry[] = [
      sw({ athlete_id: 'efisien', competition_event_id: 'CE1', rank: 1 }),
      sw({ athlete_id: 'banyak', competition_event_id: 'CE2', rank: 1 }),
      sw({ athlete_id: 'banyak', competition_event_id: 'CE3', rank: null }),
    ];
    const groups = selectBestSwimmers(entries, RULES);
    expect(groups[0].winner?.athlete_id).toBe('efisien');
  });

  it('seri sempurna tidak ditebak — ditandai tied untuk keputusan panitia', () => {
    const entries: SwimmerEntry[] = [
      sw({ athlete_id: 'a', competition_event_id: 'CE1', rank: 1 }),
      sw({ athlete_id: 'b', competition_event_id: 'CE2', rank: 1 }),
    ];
    const groups = selectBestSwimmers(entries, RULES);
    expect(groups[0].tied).toBe(true);
    expect(groups[0].winner).toBeNull();
    expect(groups[0].contenders.map((c) => c.athlete_id).sort()).toEqual(['a', 'b']);
  });

  it('atlet tanpa poin tidak menjadi kandidat', () => {
    const entries: SwimmerEntry[] = [
      sw({ athlete_id: 'dq', competition_event_id: 'CE1', rank: null }),
    ];
    const groups = selectBestSwimmers(entries, RULES);
    expect(groups[0].winner).toBeNull();
    expect(groups[0].standings).toHaveLength(0);
  });

  it('array kosong', () => {
    expect(selectBestSwimmers([], RULES)).toEqual([]);
  });
});

describe('compareSwimmers', () => {
  it('deterministik: nama sebagai penentu terakhir', () => {
    const a = score({ athlete_id: 'a', athlete_name: 'Andi', points: 10, event_count: 1 });
    const b = score({ athlete_id: 'b', athlete_name: 'Budi', points: 10, event_count: 1 });
    expect(compareSwimmers(a, b)).toBeLessThan(0);
    expect(compareSwimmers(b, a)).toBeGreaterThan(0);
  });
});

describe('detectBrokenRecords', () => {
  const existing: ExistingRecord[] = [{ competition_event_id: 'CE1', time_ms: 30000 }];

  function cand(over: Partial<RecordCandidate> & { time_ms: number }): RecordCandidate {
    return {
      competition_event_id: 'CE1',
      athlete_id: 'a',
      athlete_name: 'Andi',
      status: 'finished',
      ...over,
    };
  }

  it('waktu lebih cepat memecahkan rekor', () => {
    const broken = detectBrokenRecords([cand({ time_ms: 29000 })], existing);
    expect(broken).toHaveLength(1);
    expect(broken[0].previous_time_ms).toBe(30000);
    expect(broken[0].improvement_ms).toBe(1000);
  });

  it('waktu lebih lambat tidak memecahkan rekor', () => {
    expect(detectBrokenRecords([cand({ time_ms: 31000 })], existing)).toHaveLength(0);
  });

  it('waktu sama persis TIDAK memecahkan rekor', () => {
    expect(detectBrokenRecords([cand({ time_ms: 30000 })], existing)).toHaveLength(0);
  });

  it('nomor lomba tanpa rekor sebelumnya langsung tercatat', () => {
    const broken = detectBrokenRecords(
      [cand({ competition_event_id: 'BARU', time_ms: 40000 })],
      existing
    );
    expect(broken).toHaveLength(1);
    expect(broken[0].previous_time_ms).toBeNull();
    expect(broken[0].improvement_ms).toBeNull();
  });

  it('DQ/DNS tidak pernah memecahkan rekor', () => {
    const broken = detectBrokenRecords(
      [cand({ time_ms: 1000, status: 'dq' }), cand({ time_ms: 1000, status: 'dns' })],
      existing
    );
    expect(broken).toHaveLength(0);
  });

  it('beberapa pemecah di nomor sama: hanya yang tercepat tercatat', () => {
    const broken = detectBrokenRecords(
      [
        cand({ athlete_id: 'a', athlete_name: 'Andi', time_ms: 29500 }),
        cand({ athlete_id: 'b', athlete_name: 'Budi', time_ms: 28000 }),
      ],
      existing
    );
    expect(broken).toHaveLength(1);
    expect(broken[0].athlete_id).toBe('b');
    expect(broken[0].time_ms).toBe(28000);
  });

  it('waktu nol atau negatif diabaikan', () => {
    expect(detectBrokenRecords([cand({ time_ms: 0 })], existing)).toHaveLength(0);
  });

  it('menangani beberapa nomor lomba sekaligus', () => {
    const broken = detectBrokenRecords(
      [
        cand({ competition_event_id: 'CE1', time_ms: 29000 }),
        cand({ competition_event_id: 'CE2', time_ms: 50000 }),
      ],
      [
        { competition_event_id: 'CE1', time_ms: 30000 },
        { competition_event_id: 'CE2', time_ms: 45000 },
      ]
    );
    expect(broken.map((b) => b.competition_event_id)).toEqual(['CE1']);
  });
});
