/**
 * Best Swimmer dan Rajendra Record.
 *
 * Best Swimmer dipilih PER KELAS + GENDER (sesuai kebutuhan panitia),
 * berdasarkan akumulasi poin seluruh nomor lomba yang diikuti atlet.
 *
 * Tie-break berurutan:
 *   1. Poin terbanyak
 *   2. Emas terbanyak, lalu perak, lalu perunggu
 *   3. Jumlah nomor lomba lebih sedikit (efisiensi: poin sama dari
 *      lebih sedikit nomor dianggap lebih baik)
 *   4. Nama (agar hasil deterministik, bukan acak)
 *
 * Bila setelah semua tie-break masih seri, `tied` bernilai true supaya
 * panitia memutuskan secara manual — sistem tidak menebak.
 */

import { pointsForRank, type PointRule } from './points';

export interface SwimmerEntry {
  athlete_id: string;
  athlete_name: string;
  school_id: string | null;
  grade_level: string;
  class_name: string;
  gender: string;
  competition_event_id: string;
  rank: number | null;
}

export interface SwimmerScore {
  athlete_id: string;
  athlete_name: string;
  school_id: string | null;
  grade_level: string;
  class_name: string;
  gender: string;
  points: number;
  gold: number;
  silver: number;
  bronze: number;
  event_count: number;
}

export interface BestSwimmerGroup {
  /** Kelas + gender, mis. "SD Kelas 6 / male". */
  group_key: string;
  grade_level: string;
  class_name: string;
  gender: string;
  winner: SwimmerScore | null;
  /** true bila juara tidak dapat ditentukan otomatis. */
  tied: boolean;
  /** Peserta yang seri di puncak (hanya diisi saat tied). */
  contenders: SwimmerScore[];
  standings: SwimmerScore[];
}

function groupKeyOf(e: { grade_level: string; class_name: string; gender: string }): string {
  const cls = `${e.grade_level} ${e.class_name}`.trim();
  return `${cls} / ${e.gender}`;
}

/** Akumulasi poin dan medali per atlet. */
export function scoreSwimmers(
  entries: SwimmerEntry[],
  rules: PointRule[]
): SwimmerScore[] {
  const map = new Map<string, SwimmerScore>();

  for (const e of entries) {
    let s = map.get(e.athlete_id);
    if (!s) {
      s = {
        athlete_id: e.athlete_id,
        athlete_name: e.athlete_name,
        school_id: e.school_id,
        grade_level: e.grade_level,
        class_name: e.class_name,
        gender: e.gender,
        points: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        event_count: 0,
      };
      map.set(e.athlete_id, s);
    }

    s.points += pointsForRank(e.rank, rules);
    s.event_count += 1;
    if (e.rank === 1) s.gold++;
    else if (e.rank === 2) s.silver++;
    else if (e.rank === 3) s.bronze++;
  }

  return [...map.values()];
}

/** Urutan Best Swimmer sesuai tie-break yang disepakati. */
export function compareSwimmers(a: SwimmerScore, b: SwimmerScore): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gold !== a.gold) return b.gold - a.gold;
  if (b.silver !== a.silver) return b.silver - a.silver;
  if (b.bronze !== a.bronze) return b.bronze - a.bronze;
  if (a.event_count !== b.event_count) return a.event_count - b.event_count;
  return a.athlete_name.localeCompare(b.athlete_name);
}

/** Dua atlet benar-benar tidak terpisahkan oleh tie-break objektif. */
function indistinguishable(a: SwimmerScore, b: SwimmerScore): boolean {
  return (
    a.points === b.points &&
    a.gold === b.gold &&
    a.silver === b.silver &&
    a.bronze === b.bronze &&
    a.event_count === b.event_count
  );
}

/**
 * Best Swimmer per kelas + gender.
 * Atlet tanpa poin sama sekali tidak dianggap kandidat.
 */
export function selectBestSwimmers(
  entries: SwimmerEntry[],
  rules: PointRule[]
): BestSwimmerGroup[] {
  if (!entries || entries.length === 0) return [];

  const buckets = new Map<string, SwimmerEntry[]>();
  for (const e of entries) {
    const k = groupKeyOf(e);
    const list = buckets.get(k);
    if (list) list.push(e);
    else buckets.set(k, [e]);
  }

  const groups: BestSwimmerGroup[] = [];

  for (const [groupKey, list] of buckets) {
    const scored = scoreSwimmers(list, rules)
      .filter((s) => s.points > 0)
      .sort(compareSwimmers);

    const first = scored[0] ?? null;
    const contenders = first
      ? scored.filter((s) => indistinguishable(s, first))
      : [];
    const tied = contenders.length > 1;

    groups.push({
      group_key: groupKey,
      grade_level: list[0].grade_level,
      class_name: list[0].class_name,
      gender: list[0].gender,
      winner: tied ? null : first,
      tied,
      contenders: tied ? contenders : [],
      standings: scored,
    });
  }

  return groups.sort((a, b) => a.group_key.localeCompare(b.group_key));
}

// =====================================================================
// Rajendra Record
// =====================================================================

export interface RecordCandidate {
  competition_event_id: string;
  athlete_id: string;
  athlete_name: string;
  time_ms: number;
  status: string;
  event_id?: string;
  recorded_at?: string;
}

export interface ExistingRecord {
  competition_event_id: string;
  time_ms: number;
}

export interface BrokenRecord {
  competition_event_id: string;
  athlete_id: string;
  athlete_name: string;
  time_ms: number;
  /** null bila belum pernah ada rekor untuk nomor lomba ini. */
  previous_time_ms: number | null;
  improvement_ms: number | null;
}

/**
 * Mendeteksi rekor baru.
 *
 * Hanya hasil berstatus 'finished' dengan waktu valid yang dihitung.
 * Waktu yang SAMA dengan rekor lama tidak memecahkan rekor — harus
 * lebih cepat.
 */
export function detectBrokenRecords(
  candidates: RecordCandidate[],
  existing: ExistingRecord[]
): BrokenRecord[] {
  const currentBest = new Map<string, number>();
  for (const r of existing) {
    const prev = currentBest.get(r.competition_event_id);
    if (prev == null || r.time_ms < prev) {
      currentBest.set(r.competition_event_id, r.time_ms);
    }
  }

  const valid = candidates.filter(
    (c) => c.status === 'finished' && c.time_ms != null && c.time_ms > 0
  );

  // Urutkan tercepat dulu agar rekor beruntun di nomor sama tercatat sekali
  const sorted = [...valid].sort((a, b) => a.time_ms - b.time_ms);

  const broken = new Map<string, BrokenRecord>();

  for (const c of sorted) {
    const best = currentBest.get(c.competition_event_id);
    if (best != null && c.time_ms >= best) continue;
    if (broken.has(c.competition_event_id)) continue;

    broken.set(c.competition_event_id, {
      competition_event_id: c.competition_event_id,
      athlete_id: c.athlete_id,
      athlete_name: c.athlete_name,
      time_ms: c.time_ms,
      previous_time_ms: best ?? null,
      improvement_ms: best != null ? best - c.time_ms : null,
    });
  }

  return [...broken.values()];
}
