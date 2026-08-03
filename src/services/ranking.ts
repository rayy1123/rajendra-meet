/**
 * Perangkingan otomatis.
 *
 * Ranking dihitung PER NOMOR LOMBA (competition_event) dan LINTAS HEAT.
 * Heat hanya membagi jalannya perlombaan, bukan penentu juara: dua peserta
 * di heat berbeda tetap dibandingkan selama berada pada nomor lomba yang sama.
 *
 * Peserta dengan status selain 'finished' (DNS/DNF/DQ/SCR) tidak mendapat
 * peringkat dan selalu ditempatkan di bawah.
 *
 * Waktu identik menghasilkan peringkat sama (dead heat); peringkat berikutnya
 * melompat sesuai jumlah peserta yang seri — standar kompetisi.
 */

export type ResultStatus = 'finished' | 'dns' | 'dnf' | 'dq' | 'scr';

export interface RankableResult {
  registration_id: string;
  /** null untuk status selain 'finished'. */
  time_ms: number | null;
  status: ResultStatus;
}

export interface RankedResult extends RankableResult {
  /** null bila peserta tidak finis (tidak diperingkat). */
  rank: number | null;
}

/** Urutan tampilan untuk peserta yang tidak finis. */
const STATUS_ORDER: Record<Exclude<ResultStatus, 'finished'>, number> = {
  dnf: 1,
  dq: 2,
  dns: 3,
  scr: 4,
};

/**
 * Memberi peringkat pada hasil satu nomor lomba.
 * Urutan keluaran: peserta finis (tercepat dulu), lalu yang tidak finis.
 */
export function rankResults(results: RankableResult[]): RankedResult[] {
  if (!results || results.length === 0) return [];

  const finished = results.filter(
    (r) => r.status === 'finished' && r.time_ms != null && r.time_ms > 0
  );
  const unfinished = results.filter(
    (r) => !(r.status === 'finished' && r.time_ms != null && r.time_ms > 0)
  );

  finished.sort((a, b) => (a.time_ms as number) - (b.time_ms as number));

  const ranked: RankedResult[] = [];
  let currentRank = 0;
  let previousTime: number | null = null;

  finished.forEach((r, index) => {
    const time = r.time_ms as number;
    if (previousTime !== null && time === previousTime) {
      // Dead heat: peringkat sama dengan sebelumnya
      ranked.push({ ...r, rank: currentRank });
    } else {
      currentRank = index + 1; // melompat sesuai jumlah yang seri
      previousTime = time;
      ranked.push({ ...r, rank: currentRank });
    }
  });

  unfinished.sort((a, b) => {
    const aOrder = STATUS_ORDER[a.status as Exclude<ResultStatus, 'finished'>] ?? 9;
    const bOrder = STATUS_ORDER[b.status as Exclude<ResultStatus, 'finished'>] ?? 9;
    return aOrder - bOrder;
  });

  for (const r of unfinished) {
    ranked.push({ ...r, rank: null });
  }

  return ranked;
}

export interface CategorizedResult extends RankableResult {
  competition_event_id: string;
}

export interface RankedCategory {
  competition_event_id: string;
  results: RankedResult[];
}

/**
 * Memberi peringkat untuk banyak nomor lomba sekaligus.
 * Setiap nomor lomba diperingkat secara independen.
 */
export function rankResultsByCategory(
  results: CategorizedResult[]
): RankedCategory[] {
  if (!results || results.length === 0) return [];

  const buckets = new Map<string, CategorizedResult[]>();
  for (const r of results) {
    const list = buckets.get(r.competition_event_id);
    if (list) list.push(r);
    else buckets.set(r.competition_event_id, [r]);
  }

  const out: RankedCategory[] = [];
  for (const [competitionEventId, list] of buckets) {
    out.push({
      competition_event_id: competitionEventId,
      results: rankResults(list),
    });
  }
  return out;
}

export type Medal = 'gold' | 'silver' | 'bronze' | null;

/** Medali diturunkan dari peringkat; dead heat di posisi 1 memberi dua emas. */
export function medalForRank(rank: number | null): Medal {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return null;
}
