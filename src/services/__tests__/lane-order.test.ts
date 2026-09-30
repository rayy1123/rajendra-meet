import { describe, it, expect } from 'vitest';
import { getLaneOrder } from '@/lib/utils/lane-order';

describe('Spearhead Seeding & Lane Distribution Algorithm (Standar FINA/Aquatics)', () => {
  it('menghasilkan urutan lintasan spearhead untuk kolam 8 lintasan [4, 5, 3, 6, 2, 7, 1, 8]', () => {
    const lanes8 = getLaneOrder(8);
    expect(lanes8).toEqual([4, 5, 3, 6, 2, 7, 1, 8]);
    expect(lanes8.length).toBe(8);
    // Lintasan tengah (4) adalah unggulan tercepat ke-1
    expect(lanes8[0]).toBe(4);
    // Lintasan 5 adalah unggulan tercepat ke-2
    expect(lanes8[1]).toBe(5);
  });

  it('menghasilkan urutan lintasan spearhead untuk kolam 6 lintasan [3, 4, 2, 5, 1, 6]', () => {
    const lanes6 = getLaneOrder(6);
    expect(lanes6).toEqual([3, 4, 2, 5, 1, 6]);
    expect(lanes6.length).toBe(6);
    expect(lanes6[0]).toBe(3);
  });

  it('menghasilkan urutan lintasan spearhead untuk kolam 10 lintasan', () => {
    const lanes10 = getLaneOrder(10);
    expect(lanes10.length).toBe(10);
    expect(lanes10[0]).toBe(5);
    expect(lanes10[1]).toBe(6);
    expect(lanes10[2]).toBe(4);
  });
});
