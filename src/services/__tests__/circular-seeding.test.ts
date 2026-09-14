import { describe, it, expect } from 'vitest';
import { generateHeats, type RegistrationSeed } from '../seeding';

describe('World Aquatics Circular Seeding (Rule SW 3.1.1)', () => {
  it('should seed 3 heats in circular pattern for prelims', () => {
    // 24 perenang untuk 3 heat dengan kolam 8 lintasan
    const swimmers: RegistrationSeed[] = Array.from({ length: 24 }, (_, i) => ({
      registration_id: `swimmer-${i + 1}`,
      seed_time_ms: 25000 + i * 500, // Seed 1 = 25.00s, Seed 2 = 25.50s, Seed 3 = 26.00s
    }));

    const heats = generateHeats(swimmers, { laneCount: 8, method: 'circular' });

    expect(heats.length).toBe(3);

    // Menurut Rule SW 3.1.1:
    // Seed 1 (swimmer-1) -> Heat 3 (Heat Terakhir), Lane 4 (Lane terbaik)
    // Seed 2 (swimmer-2) -> Heat 2 (Heat ke-2 terakhir), Lane 4
    // Seed 3 (swimmer-3) -> Heat 1 (Heat ke-3 terakhir), Lane 4
    const heat3 = heats.find((h) => h.heat_number === 3);
    const heat2 = heats.find((h) => h.heat_number === 2);
    const heat1 = heats.find((h) => h.heat_number === 1);

    const heat3Lane4 = heat3?.assignments.find((a) => a.lane_number === 4);
    const heat2Lane4 = heat2?.assignments.find((a) => a.lane_number === 4);
    const heat1Lane4 = heat1?.assignments.find((a) => a.lane_number === 4);

    expect(heat3Lane4?.registration_id).toBe('swimmer-1');
    expect(heat2Lane4?.registration_id).toBe('swimmer-2');
    expect(heat1Lane4?.registration_id).toBe('swimmer-3');

    // Putaran kedua:
    // Seed 4 (swimmer-4) -> Heat 3, Lane 5 (Lane prioritas ke-2)
    // Seed 5 (swimmer-5) -> Heat 2, Lane 5
    // Seed 6 (swimmer-6) -> Heat 1, Lane 5
    const heat3Lane5 = heat3?.assignments.find((a) => a.lane_number === 5);
    const heat2Lane5 = heat2?.assignments.find((a) => a.lane_number === 5);
    const heat1Lane5 = heat1?.assignments.find((a) => a.lane_number === 5);

    expect(heat3Lane5?.registration_id).toBe('swimmer-4');
    expect(heat2Lane5?.registration_id).toBe('swimmer-5');
    expect(heat1Lane5?.registration_id).toBe('swimmer-6');
  });

  it('should maintain standard spearhead seeding for timed finals', () => {
    const swimmers: RegistrationSeed[] = Array.from({ length: 16 }, (_, i) => ({
      registration_id: `swimmer-${i + 1}`,
      seed_time_ms: 25000 + i * 500,
    }));

    const heats = generateHeats(swimmers, { laneCount: 8, method: 'spearhead' });

    expect(heats.length).toBe(2);

    // Di spearhead, heat terakhir (heat 2) berisi 8 perenang tercepat (swimmer-1 s/d swimmer-8)
    const heat2 = heats.find((h) => h.heat_number === 2);
    const heat2SwimmerIds = heat2?.assignments.map((a) => a.registration_id);

    expect(heat2SwimmerIds).toContain('swimmer-1');
    expect(heat2SwimmerIds).toContain('swimmer-2');
    expect(heat2SwimmerIds).toContain('swimmer-3');
    expect(heat2SwimmerIds).toContain('swimmer-8');
    expect(heat2SwimmerIds).not.toContain('swimmer-9');
  });
});
