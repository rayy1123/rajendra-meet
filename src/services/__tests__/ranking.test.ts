import { describe, it, expect } from 'vitest';
import {
  rankResults,
  rankResultsByCategory,
  medalForRank,
  type RankableResult,
  type CategorizedResult,
} from '../ranking';

function fin(id: string, ms: number): RankableResult {
  return { registration_id: id, time_ms: ms, status: 'finished' };
}

function rankOf(ranked: ReturnType<typeof rankResults>, id: string) {
  const found = ranked.find((r) => r.registration_id === id);
  return found ? found.rank : undefined;
}

describe('rankResults', () => {
  it('array kosong', () => {
    expect(rankResults([])).toEqual([]);
  });

  it('mengurutkan dari waktu tercepat', () => {
    const ranked = rankResults([fin('c', 33000), fin('a', 31000), fin('b', 32000)]);
    expect(ranked.map((r) => r.registration_id)).toEqual(['a', 'b', 'c']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('membandingkan peserta lintas heat pada nomor lomba yang sama', () => {
    // Peserta heat 1 justru lebih cepat daripada peserta heat 2
    const ranked = rankResults([
      fin('heat2-lane4', 35000),
      fin('heat1-lane4', 34000),
    ]);
    expect(rankOf(ranked, 'heat1-lane4')).toBe(1);
    expect(rankOf(ranked, 'heat2-lane4')).toBe(2);
  });

  it('dead heat: waktu sama mendapat peringkat sama', () => {
    const ranked = rankResults([fin('a', 31000), fin('b', 31000), fin('c', 32000)]);
    expect(rankOf(ranked, 'a')).toBe(1);
    expect(rankOf(ranked, 'b')).toBe(1);
  });

  it('dead heat: peringkat berikutnya melompat', () => {
    const ranked = rankResults([fin('a', 31000), fin('b', 31000), fin('c', 32000)]);
    // dua orang di posisi 1, berikutnya posisi 3 (bukan 2)
    expect(rankOf(ranked, 'c')).toBe(3);
  });

  it('dead heat tiga orang melompat ke peringkat 4', () => {
    const ranked = rankResults([
      fin('a', 30000), fin('b', 30000), fin('c', 30000), fin('d', 31000),
    ]);
    expect([rankOf(ranked, 'a'), rankOf(ranked, 'b'), rankOf(ranked, 'c')]).toEqual([1, 1, 1]);
    expect(rankOf(ranked, 'd')).toBe(4);
  });

  it('DNS/DNF/DQ/SCR tidak diperingkat dan berada di bawah', () => {
    const results: RankableResult[] = [
      { registration_id: 'dq', time_ms: null, status: 'dq' },
      fin('fast', 31000),
      { registration_id: 'dns', time_ms: null, status: 'dns' },
    ];
    const ranked = rankResults(results);
    expect(ranked[0].registration_id).toBe('fast');
    expect(ranked[0].rank).toBe(1);
    expect(rankOf(ranked, 'dq')).toBeNull();
    expect(rankOf(ranked, 'dns')).toBeNull();
  });

  it('semua peserta DQ menghasilkan nol peringkat', () => {
    const ranked = rankResults([
      { registration_id: 'a', time_ms: null, status: 'dq' },
      { registration_id: 'b', time_ms: null, status: 'dq' },
    ]);
    expect(ranked.every((r) => r.rank === null)).toBe(true);
  });

  it('status finished tanpa waktu tidak diperingkat', () => {
    const ranked = rankResults([
      { registration_id: 'bad', time_ms: null, status: 'finished' },
      fin('ok', 31000),
    ]);
    expect(rankOf(ranked, 'ok')).toBe(1);
    expect(rankOf(ranked, 'bad')).toBeNull();
  });

  it('tidak mengubah array masukan', () => {
    const input = [fin('b', 32000), fin('a', 31000)];
    const copy = JSON.parse(JSON.stringify(input));
    rankResults(input);
    expect(input).toEqual(copy);
  });

  it('setiap peserta muncul tepat sekali di keluaran', () => {
    const input: RankableResult[] = [
      fin('a', 31000),
      { registration_id: 'b', time_ms: null, status: 'dnf' },
      fin('c', 32000),
    ];
    const ranked = rankResults(input);
    expect(ranked).toHaveLength(3);
    expect(new Set(ranked.map((r) => r.registration_id)).size).toBe(3);
  });
});

describe('rankResultsByCategory', () => {
  it('setiap nomor lomba diperingkat independen', () => {
    const results: CategorizedResult[] = [
      { registration_id: 'sd-a', competition_event_id: 'SD', time_ms: 45000, status: 'finished' },
      { registration_id: 'sd-b', competition_event_id: 'SD', time_ms: 46000, status: 'finished' },
      // peserta SMP lebih cepat, tapi tidak mempengaruhi peringkat SD
      { registration_id: 'smp-a', competition_event_id: 'SMP', time_ms: 30000, status: 'finished' },
    ];
    const groups = rankResultsByCategory(results);
    const sd = groups.find((g) => g.competition_event_id === 'SD')!;
    const smp = groups.find((g) => g.competition_event_id === 'SMP')!;

    expect(sd.results.find((r) => r.registration_id === 'sd-a')?.rank).toBe(1);
    expect(smp.results.find((r) => r.registration_id === 'smp-a')?.rank).toBe(1);
  });

  it('array kosong', () => {
    expect(rankResultsByCategory([])).toEqual([]);
  });
});

describe('medalForRank', () => {
  it('memetakan peringkat ke medali', () => {
    expect(medalForRank(1)).toBe('gold');
    expect(medalForRank(2)).toBe('silver');
    expect(medalForRank(3)).toBe('bronze');
    expect(medalForRank(4)).toBeNull();
    expect(medalForRank(null)).toBeNull();
  });

  it('dead heat di posisi 1 menghasilkan dua emas', () => {
    const ranked = rankResults([fin('a', 30000), fin('b', 30000), fin('c', 31000)]);
    const medals = ranked.map((r) => medalForRank(r.rank));
    expect(medals.filter((m) => m === 'gold')).toHaveLength(2);
    // peringkat 3 -> perunggu, tidak ada perak
    expect(medals).toContain('bronze');
    expect(medals).not.toContain('silver');
  });
});
