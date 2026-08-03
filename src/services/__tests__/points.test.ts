import { describe, it, expect } from 'vitest';
import {
  pointsForRank,
  pointsForTiedRank,
  buildStandings,
  buildSeriesStandings,
  sortStandings,
  type PointRule,
  type ScoredEntry,
  type StandingRow,
} from '../points';

const RULES: PointRule[] = [
  { rank: 1, points: 10 },
  { rank: 2, points: 8 },
  { rank: 3, points: 6 },
  { rank: 4, points: 5 },
  { rank: 5, points: 4 },
  { rank: 6, points: 3 },
  { rank: 7, points: 2 },
  { rank: 8, points: 1 },
];

function entry(over: Partial<ScoredEntry> & { athlete_id: string; rank: number | null }): ScoredEntry {
  return {
    school_id: 'S1',
    grade_level: 'SD',
    class_name: 'Kelas 6',
    gender: 'male',
    ...over,
  };
}

describe('pointsForRank', () => {
  it('memetakan peringkat sesuai tabel poin', () => {
    expect(pointsForRank(1, RULES)).toBe(10);
    expect(pointsForRank(3, RULES)).toBe(6);
    expect(pointsForRank(8, RULES)).toBe(1);
  });

  it('peringkat di luar tabel bernilai 0', () => {
    expect(pointsForRank(9, RULES)).toBe(0);
  });

  it('tidak diperingkat (DQ/DNS) bernilai 0', () => {
    expect(pointsForRank(null, RULES)).toBe(0);
  });

  it('mengikuti tabel poin yang diubah panitia', () => {
    const custom: PointRule[] = [
      { rank: 1, points: 100 },
      { rank: 2, points: 50 },
    ];
    expect(pointsForRank(1, custom)).toBe(100);
    expect(pointsForRank(3, custom)).toBe(0);
  });
});

describe('pointsForTiedRank', () => {
  it('tanpa dead heat sama dengan poin biasa', () => {
    expect(pointsForTiedRank(1, 1, RULES)).toBe(10);
  });

  it('dua juara 1 berbagi poin peringkat 1 dan 2', () => {
    // (10 + 8) / 2 = 9
    expect(pointsForTiedRank(1, 2, RULES)).toBe(9);
  });

  it('tiga peserta seri di peringkat 1', () => {
    // (10 + 8 + 6) / 3 = 8
    expect(pointsForTiedRank(1, 3, RULES)).toBe(8);
  });

  it('kebijakan full memberi poin penuh ke semua yang seri', () => {
    expect(pointsForTiedRank(1, 2, RULES, 'full')).toBe(10);
  });
});

describe('buildStandings — Overall Champion', () => {
  it('mengakumulasi poin per sekolah', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a1', school_id: 'SEKOLAH-A', rank: 1, competition_event_id: 'CE1' }), // 10
      entry({ athlete_id: 'a2', school_id: 'SEKOLAH-A', rank: 3, competition_event_id: 'CE1' }), // 6
      entry({ athlete_id: 'b1', school_id: 'SEKOLAH-B', rank: 2, competition_event_id: 'CE1' }), // 8
    ];
    const rows = buildStandings(entries, RULES);
    expect(rows[0].school_id).toBe('SEKOLAH-A');
    expect(rows[0].points).toBe(16);
    expect(rows[1].points).toBe(8);
  });

  it('menghitung medali', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a1', school_id: 'A', rank: 1, competition_event_id: 'CE1' }),
      entry({ athlete_id: 'a2', school_id: 'A', rank: 1, competition_event_id: 'CE2' }),
      entry({ athlete_id: 'a3', school_id: 'A', rank: 3, competition_event_id: 'CE1' }),
      entry({ athlete_id: 'a4', school_id: 'A', rank: null, competition_event_id: 'CE3' }),
    ];
    const rows = buildStandings(entries, RULES);
    expect(rows[0].gold).toBe(2);
    expect(rows[0].bronze).toBe(1);
    expect(rows[0].silver).toBe(0);
  });

  it('peserta tanpa sekolah dikelompokkan sebagai independent', () => {
    const rows = buildStandings(
      [entry({ athlete_id: 'x', school_id: null, rank: 1 })],
      RULES
    );
    expect(rows[0].school_id).toBeNull();
    expect(rows[0].points).toBe(10);
  });

  it('mengubah tabel poin mengubah klasemen', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a', school_id: 'A', rank: 2, competition_event_id: 'CE1' }),
      entry({ athlete_id: 'b', school_id: 'B', rank: 1, competition_event_id: 'CE1' }),
    ];
    // Tabel normal: B (10) menang atas A (8)
    expect(buildStandings(entries, RULES)[0].school_id).toBe('B');

    // Panitia membuat peringkat 2 lebih bernilai
    const flipped: PointRule[] = [
      { rank: 1, points: 5 },
      { rank: 2, points: 20 },
    ];
    expect(buildStandings(entries, flipped)[0].school_id).toBe('A');
  });

  it('array kosong', () => {
    expect(buildStandings([], RULES)).toEqual([]);
  });
});

describe('buildStandings — Grade & Class Champion', () => {
  it('grade memisahkan SD dan SMP', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'sd', school_id: 'A', grade_level: 'SD', rank: 1, competition_event_id: 'CE-SD' }),
      entry({ athlete_id: 'smp', school_id: 'A', grade_level: 'SMP', rank: 1, competition_event_id: 'CE-SMP' }),
    ];
    const rows = buildStandings(entries, RULES, { groupBy: 'grade' });
    expect(rows).toHaveLength(2);
    rows.forEach((r) => expect(r.points).toBe(10));
  });

  it('class memisahkan kelas 5 dan kelas 6', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'k5', school_id: 'A', class_name: 'Kelas 5', rank: 1, competition_event_id: 'CE-K5' }),
      entry({ athlete_id: 'k6', school_id: 'A', class_name: 'Kelas 6', rank: 1, competition_event_id: 'CE-K6' }),
    ];
    const rows = buildStandings(entries, RULES, { groupBy: 'class' });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.key).sort()).toEqual([
      'SD Kelas 5::A',
      'SD Kelas 6::A',
    ]);
  });

  it('overall menggabungkan semua tingkat', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'sd', school_id: 'A', grade_level: 'SD', rank: 1, competition_event_id: 'CE-SD' }),
      entry({ athlete_id: 'smp', school_id: 'A', grade_level: 'SMP', rank: 1, competition_event_id: 'CE-SMP' }),
    ];
    const rows = buildStandings(entries, RULES, { groupBy: 'overall' });
    expect(rows).toHaveLength(1);
    expect(rows[0].points).toBe(20);
  });
});

describe('dead heat pada klasemen', () => {
  it('dua juara 1 di NOMOR LOMBA YANG SAMA membagi poin', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a', school_id: 'A', rank: 1, competition_event_id: 'CE1' }),
      entry({ athlete_id: 'b', school_id: 'B', rank: 1, competition_event_id: 'CE1' }),
    ];
    const rows = buildStandings(entries, RULES);
    rows.forEach((r) => expect(r.points).toBe(9)); // (10+8)/2
  });

  it('juara 1 di nomor lomba BERBEDA bukan dead heat — masing-masing 10', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a', school_id: 'A', rank: 1, competition_event_id: 'CE1' }),
      entry({ athlete_id: 'b', school_id: 'B', rank: 1, competition_event_id: 'CE2' }),
    ];
    const rows = buildStandings(entries, RULES);
    rows.forEach((r) => expect(r.points).toBe(10));
  });

  it('kebijakan full memberi 10 kepada keduanya', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a', school_id: 'A', rank: 1, competition_event_id: 'CE1' }),
      entry({ athlete_id: 'b', school_id: 'B', rank: 1, competition_event_id: 'CE1' }),
    ];
    const rows = buildStandings(entries, RULES, { deadHeat: 'full' });
    rows.forEach((r) => expect(r.points).toBe(10));
  });
});

describe('sortStandings — tie-break', () => {
  it('poin sama diputus oleh jumlah emas', () => {
    const rows: StandingRow[] = [
      { key: 'A', school_id: 'A', points: 20, gold: 1, silver: 3, bronze: 0 },
      { key: 'B', school_id: 'B', points: 20, gold: 2, silver: 0, bronze: 0 },
    ];
    expect(sortStandings(rows)[0].key).toBe('B');
  });

  it('emas sama diputus oleh perak', () => {
    const rows: StandingRow[] = [
      { key: 'A', school_id: 'A', points: 20, gold: 2, silver: 0, bronze: 5 },
      { key: 'B', school_id: 'B', points: 20, gold: 2, silver: 1, bronze: 0 },
    ];
    expect(sortStandings(rows)[0].key).toBe('B');
  });

  it('perak sama diputus oleh perunggu', () => {
    const rows: StandingRow[] = [
      { key: 'A', school_id: 'A', points: 20, gold: 1, silver: 1, bronze: 0 },
      { key: 'B', school_id: 'B', points: 20, gold: 1, silver: 1, bronze: 3 },
    ];
    expect(sortStandings(rows)[0].key).toBe('B');
  });
});

describe('buildSeriesStandings', () => {
  it('mengakumulasi poin lintas event dalam satu series', () => {
    const entries: ScoredEntry[] = [
      entry({ athlete_id: 'a', school_id: 'A', rank: 1, event_id: 'seri-1', competition_event_id: 'S1-CE1' }),
      entry({ athlete_id: 'a', school_id: 'A', rank: 2, event_id: 'seri-2', competition_event_id: 'S2-CE1' }),
      entry({ athlete_id: 'b', school_id: 'B', rank: 1, event_id: 'seri-2', competition_event_id: 'S2-CE1' }),
    ];
    const rows = buildSeriesStandings(entries, RULES);
    expect(rows[0].school_id).toBe('A');
    expect(rows[0].points).toBe(18); // 10 + 8
  });
});
