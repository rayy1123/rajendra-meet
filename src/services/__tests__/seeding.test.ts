import { describe, it, expect } from 'vitest';
import {
  generateHeats,
  generateHeatsByCategory,
  getLaneOrder,
  type RegistrationSeed,
  type CategorizedRegistration,
} from '../seeding';

function seeds(times: number[]): RegistrationSeed[] {
  return times.map((t, i) => ({ registration_id: `r${i + 1}`, seed_time_ms: t }));
}

/** Cari lane seorang peserta di seluruh heat. */
function locate(heats: ReturnType<typeof generateHeats>, id: string) {
  for (const h of heats) {
    const a = h.assignments.find((x) => x.registration_id === id);
    if (a) return { heat: h.heat_number, lane: a.lane_number };
  }
  return null;
}

describe('getLaneOrder', () => {
  it('8 lane: tengah dulu lalu menyebar', () => {
    expect(getLaneOrder(8)).toEqual([4, 5, 3, 6, 2, 7, 1, 8]);
  });

  it('6 lane', () => {
    expect(getLaneOrder(6)).toEqual([3, 4, 2, 5, 1, 6]);
  });

  it('10 lane', () => {
    expect(getLaneOrder(10)).toEqual([5, 6, 4, 7, 3, 8, 2, 9, 1, 10]);
  });

  it('jumlah lane non-standar tetap menghasilkan permutasi lengkap', () => {
    const order = getLaneOrder(5);
    expect([...order].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(order[0]).toBe(3); // tengah
  });
});

describe('generateHeats', () => {
  it('mengembalikan array kosong bila tidak ada peserta', () => {
    expect(generateHeats([], 8)).toEqual([]);
  });

  it('satu peserta mendapat lane tengah di heat 1', () => {
    const heats = generateHeats(seeds([30000]), 8);
    expect(heats).toHaveLength(1);
    expect(heats[0].heat_number).toBe(1);
    expect(heats[0].assignments).toEqual([{ registration_id: 'r1', lane_number: 4 }]);
  });

  it('tepat satu heat penuh', () => {
    const heats = generateHeats(seeds([31, 32, 33, 34, 35, 36, 37, 38].map((s) => s * 1000)), 8);
    expect(heats).toHaveLength(1);
    expect(heats[0].assignments).toHaveLength(8);
    // tercepat (31s) di lane tengah
    expect(locate(heats, 'r1')).toEqual({ heat: 1, lane: 4 });
  });

  it('9 peserta / 8 lane menghasilkan 2 heat, heat 1 hanya berisi 1 orang terlambat', () => {
    const times = [31, 32, 33, 34, 35, 36, 37, 38, 39].map((s) => s * 1000);
    const heats = generateHeats(seeds(times), 8);

    expect(heats).toHaveLength(2);
    // Heat 1 = paling lambat, sisa peserta
    expect(heats[0].heat_number).toBe(1);
    expect(heats[0].assignments).toHaveLength(1);
    expect(heats[0].assignments[0].registration_id).toBe('r9'); // 39s, terlambat
    // Heat 2 = heat terakhir, berisi 8 tercepat
    expect(heats[1].assignments).toHaveLength(8);
  });

  it('peserta tercepat berada di heat TERAKHIR dan lane tengah', () => {
    const times = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40].map((s) => s * 1000);
    const heats = generateHeats(seeds(times), 8);
    const fastest = locate(heats, 'r1'); // 31s
    expect(fastest).toEqual({ heat: 2, lane: 4 });
  });

  it('peserta terlambat berada di heat pertama', () => {
    const times = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40].map((s) => s * 1000);
    const heats = generateHeats(seeds(times), 8);
    const slowest = locate(heats, 'r10'); // 40s
    expect(slowest?.heat).toBe(1);
  });

  it('peserta NT (seed 0) diperlakukan paling lambat', () => {
    const regs: RegistrationSeed[] = [
      { registration_id: 'nt', seed_time_ms: 0 },
      { registration_id: 'fast', seed_time_ms: 30000 },
      { registration_id: 'mid', seed_time_ms: 35000 },
    ];
    const heats = generateHeats(regs, 2);
    expect(heats).toHaveLength(2);
    // NT ada di heat 1 (paling lambat)
    expect(locate(heats, 'nt')?.heat).toBe(1);
    // tercepat di heat terakhir
    expect(locate(heats, 'fast')?.heat).toBe(2);
  });

  it('tidak ada lane duplikat dalam satu heat', () => {
    const times = Array.from({ length: 17 }, (_, i) => (30 + i) * 1000);
    const heats = generateHeats(seeds(times), 6);
    for (const h of heats) {
      const lanes = h.assignments.map((a) => a.lane_number);
      expect(new Set(lanes).size).toBe(lanes.length);
      lanes.forEach((l) => {
        expect(l).toBeGreaterThanOrEqual(1);
        expect(l).toBeLessThanOrEqual(6);
      });
    }
  });

  it('setiap peserta muncul tepat sekali', () => {
    const times = Array.from({ length: 23 }, (_, i) => (30 + i) * 1000);
    const heats = generateHeats(seeds(times), 8);
    const all = heats.flatMap((h) => h.assignments.map((a) => a.registration_id));
    expect(all).toHaveLength(23);
    expect(new Set(all).size).toBe(23);
  });

  it('nomor heat berurutan mulai dari 1', () => {
    const times = Array.from({ length: 20 }, (_, i) => (30 + i) * 1000);
    const heats = generateHeats(seeds(times), 6);
    expect(heats.map((h) => h.heat_number)).toEqual([1, 2, 3, 4]);
  });

  it('menolak laneCount tidak valid', () => {
    expect(() => generateHeats(seeds([30000]), 0)).toThrow();
  });
});

describe('generateHeatsByCategory', () => {
  it('peserta dari kategori berbeda tidak pernah satu heat', () => {
    const regs: CategorizedRegistration[] = [
      // 200m Dada SD Kelas 6 Putra
      { registration_id: 'sd1', competition_event_id: 'sd-6-boys', seed_time_ms: 40000 },
      { registration_id: 'sd2', competition_event_id: 'sd-6-boys', seed_time_ms: 41000 },
      // 200m Dada SMP Kelas 9 Putra
      { registration_id: 'smp1', competition_event_id: 'smp-9-boys', seed_time_ms: 38000 },
      { registration_id: 'smp2', competition_event_id: 'smp-9-boys', seed_time_ms: 39000 },
    ];

    const groups = generateHeatsByCategory(regs, 8);
    expect(groups).toHaveLength(2);

    for (const g of groups) {
      for (const h of g.heats) {
        const ids = h.assignments.map((a) => a.registration_id);
        const prefixes = new Set(ids.map((id) => id.replace(/\d+$/, '')));
        expect(prefixes.size).toBe(1); // tidak tercampur
      }
    }
  });

  it('tiap kategori punya penomoran heat sendiri mulai dari 1', () => {
    const regs: CategorizedRegistration[] = [
      { registration_id: 'a1', competition_event_id: 'A', seed_time_ms: 30000 },
      { registration_id: 'b1', competition_event_id: 'B', seed_time_ms: 30000 },
    ];
    const groups = generateHeatsByCategory(regs, 8);
    for (const g of groups) {
      expect(g.heats[0].heat_number).toBe(1);
    }
  });

  it('array kosong menghasilkan array kosong', () => {
    expect(generateHeatsByCategory([], 8)).toEqual([]);
  });
});
