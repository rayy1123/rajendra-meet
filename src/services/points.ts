/**
 * Sistem poin dan klasemen kejuaraan.
 *
 * Poin sepenuhnya dikonfigurasi panitia lewat tabel `point_rules`
 * (Settings), jadi tidak ada angka yang dipatok di kode ini.
 *
 * Klasemen yang didukung:
 *   - Overall Champion : akumulasi seluruh nomor lomba
 *   - Grade Champion   : dikelompokkan per tingkat (SD/SMP/SMA)
 *   - Class Champion   : dikelompokkan per kelas
 *   - Series Champion  : akumulasi lintas event dalam satu series
 */

export type Medal = 'gold' | 'silver' | 'bronze' | null;

export interface PointRule {
  rank: number;
  points: number;
}

/** Bagaimana poin dibagi ketika terjadi dead heat. */
export type DeadHeatPolicy = 'split' | 'full';

/**
 * Poin untuk sebuah peringkat.
 * Peringkat di luar tabel poin bernilai 0.
 */
export function pointsForRank(rank: number | null, rules: PointRule[]): number {
  if (rank == null) return 0;
  const rule = rules.find((r) => r.rank === rank);
  return rule ? rule.points : 0;
}

/**
 * Poin untuk sebuah peringkat dengan memperhitungkan dead heat.
 *
 * 'split' (default): total poin peringkat yang ditempati dibagi rata.
 *   Contoh dua orang juara 1 dengan tabel 10/8 -> masing-masing (10+8)/2 = 9.
 * 'full': setiap peserta menerima poin penuh peringkatnya.
 */
export function pointsForTiedRank(
  rank: number | null,
  tieCount: number,
  rules: PointRule[],
  policy: DeadHeatPolicy = 'split'
): number {
  if (rank == null) return 0;
  if (tieCount <= 1 || policy === 'full') return pointsForRank(rank, rules);

  let total = 0;
  for (let i = 0; i < tieCount; i++) {
    total += pointsForRank(rank + i, rules);
  }
  return total / tieCount;
}

export interface ScoredEntry {
  /** Peserta pemilik poin. */
  athlete_id: string;
  /** Sekolah/klub — dipakai untuk klasemen tim. */
  school_id: string | null;
  grade_level: string;
  class_name: string;
  gender: string;
  rank: number | null;
  /**
   * Nomor lomba asal peringkat ini. Dead heat hanya berlaku di dalam
   * satu nomor lomba: dua juara 1 dari nomor lomba berbeda bukan seri.
   */
  competition_event_id?: string;
  /** Diisi bila akumulasi lintas event (Series Champion). */
  event_id?: string;
}

export interface StandingRow {
  key: string;
  school_id: string | null;
  points: number;
  gold: number;
  silver: number;
  bronze: number;
}

function medalOf(rank: number | null): Medal {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return null;
}

/**
 * Hitung berapa peserta yang berbagi peringkat, DI DALAM nomor lomba
 * masing-masing. Dua juara 1 pada nomor lomba berbeda bukan dead heat.
 */
function tieCounts(entries: ScoredEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.rank == null) continue;
    const key = `${e.competition_event_id ?? ''}#${e.rank}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Kunci pencarian tie untuk satu entri. */
function tieKey(e: ScoredEntry): string {
  return `${e.competition_event_id ?? ''}#${e.rank}`;
}

/**
 * Klasemen per SEKOLAH/KLUB.
 * `groupBy` menentukan jenis klasemen: overall, grade, atau class.
 */
export function buildStandings(
  entries: ScoredEntry[],
  rules: PointRule[],
  options: {
    groupBy?: 'overall' | 'grade' | 'class';
    deadHeat?: DeadHeatPolicy;
  } = {}
): StandingRow[] {
  const { groupBy = 'overall', deadHeat = 'split' } = options;
  if (!entries || entries.length === 0) return [];

  const ties = tieCounts(entries);
  const rows = new Map<string, StandingRow>();

  for (const e of entries) {
    const scope =
      groupBy === 'grade'
        ? e.grade_level
        : groupBy === 'class'
          ? `${e.grade_level} ${e.class_name}`.trim()
          : '';

    const school = e.school_id ?? 'independent';
    const key = scope ? `${scope}::${school}` : school;

    let row = rows.get(key);
    if (!row) {
      row = { key, school_id: e.school_id, points: 0, gold: 0, silver: 0, bronze: 0 };
      rows.set(key, row);
    }

    row.points += pointsForTiedRank(e.rank, ties.get(tieKey(e)) ?? 1, rules, deadHeat);

    const medal = medalOf(e.rank);
    if (medal === 'gold') row.gold++;
    else if (medal === 'silver') row.silver++;
    else if (medal === 'bronze') row.bronze++;
  }

  return sortStandings([...rows.values()]);
}

/** Urutan klasemen: poin, lalu emas, perak, perunggu. */
export function sortStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Series Champion: akumulasi seluruh event dalam satu series.
 * Masukan boleh berasal dari beberapa event sekaligus.
 */
export function buildSeriesStandings(
  entries: ScoredEntry[],
  rules: PointRule[],
  deadHeat: DeadHeatPolicy = 'split'
): StandingRow[] {
  return buildStandings(entries, rules, { groupBy: 'overall', deadHeat });
}
