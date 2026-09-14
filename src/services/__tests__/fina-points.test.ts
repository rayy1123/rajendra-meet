import { describe, it, expect } from 'vitest';
import { calculateFinaPoints, normalizeStrokeToKey } from '../fina-points';

describe('World Aquatics (FINA) Points Calculation', () => {
  it('should normalize stroke and distance correctly', () => {
    expect(normalizeStrokeToKey('50m Gaya Bebas', 50)).toBe('50_free');
    expect(normalizeStrokeToKey('Gaya Dada 100m', 100)).toBe('100_breast');
    expect(normalizeStrokeToKey('200m Gaya Punggung', 200)).toBe('200_back');
    expect(normalizeStrokeToKey('50m Kupu-kupu', 50)).toBe('50_fly');
    expect(normalizeStrokeToKey('200m Gaya Ganti', 200)).toBe('200_im');
  });

  it('should calculate FINA points close to 1000 for world record times', () => {
    // 50m Free Male Base Time is 20.91s (20910 ms)
    // At exactly base time, points should equal 1000
    const points = calculateFinaPoints('male', 'Gaya Bebas', 50, 20910, 'LCM');
    expect(points).toBe(1000);
  });

  it('should calculate accurate points for competitive swimmer times', () => {
    // 50m Free Male: 24.50s (24500 ms)
    // Formula: 1000 * (20.91 / 24.50)^3 = 1000 * (0.853469)^3 = 621
    const points = calculateFinaPoints('male', 'Gaya Bebas', 50, 24500, 'LCM');
    expect(points).toBeGreaterThan(600);
    expect(points).toBeLessThan(650);
  });

  it('should return 0 for invalid or empty parameters', () => {
    expect(calculateFinaPoints(null, 'Gaya Bebas', 50, 25000)).toBe(0);
    expect(calculateFinaPoints('male', null, 50, 25000)).toBe(0);
    expect(calculateFinaPoints('male', 'Gaya Bebas', 50, 0)).toBe(0);
    expect(calculateFinaPoints('male', 'Gaya Bebas', 50, -100)).toBe(0);
  });
});
