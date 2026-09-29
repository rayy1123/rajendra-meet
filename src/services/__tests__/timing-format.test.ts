import { describe, it, expect } from 'vitest';
import {
  formatMsToTime,
  formatMsToFinalTime,
  formatTimeToMs,
  parseSwimTimeInput,
} from '@/lib/utils';

describe('Format Waktu Renang 3 Digit Grup (MM.SS.MS: 00.20.21)', () => {
  it('mengonversi milidetik ke format 3-digit grup (MM.SS.MS)', () => {
    // 20.21 detik = 20210 ms -> "00.20.21"
    expect(formatMsToFinalTime(20210)).toBe('00.20.21');

    // 1 menit 5.12 detik = 65120 ms -> "01.05.12"
    expect(formatMsToFinalTime(65120)).toBe('01.05.12');

    // 28.45 detik = 28450 ms -> "00.28.45"
    expect(formatMsToFinalTime(28450)).toBe('00.28.45');

    // Waktu kosong atau invalid
    expect(formatMsToFinalTime(0)).toBe('');
    expect(formatMsToFinalTime(null)).toBe('');
    expect(formatMsToFinalTime(undefined)).toBe('');
  });

  it('otomatis memformat pengetikan angka 6 digit (contoh "002021" -> "00.20.21")', () => {
    const res = parseSwimTimeInput('002021');
    expect(res.formatted).toBe('00.20.21');
    expect(res.timeMs).toBe(20210);
  });

  it('otomatis memformat pengetikan angka 4 digit (contoh "2021" -> "00.20.21")', () => {
    const res = parseSwimTimeInput('2021');
    expect(res.formatted).toBe('00.20.21');
    expect(res.timeMs).toBe(20210);
  });

  it('otomatis memformat pengetikan 5 digit (contoh "10512" -> "01.05.12")', () => {
    const res = parseSwimTimeInput('10512');
    expect(res.formatted).toBe('01.05.12');
    expect(res.timeMs).toBe(65120);
  });

  it('memproses format dengan titik atau titik dua ("00.20.21", "01:05.12")', () => {
    expect(formatTimeToMs('00.20.21')).toBe(20210);
    expect(formatTimeToMs('002021')).toBe(20210);
    expect(formatTimeToMs('01:05.12')).toBe(65120);
    expect(formatTimeToMs('01.05.12')).toBe(65120);
    expect(formatTimeToMs('28.45')).toBe(28450);
  });

  it('tetap menjaga kompatibilitas formatMsToTime lama', () => {
    expect(formatMsToTime(65120)).toBe('01:05.12');
    expect(formatMsToTime(28450)).toBe('28.45');
    expect(formatMsToTime(null)).toBe('NT');
  });

  it('menangani input kosong saat operator ingin mengosongkan / mereset waktu', () => {
    expect(parseSwimTimeInput('')).toEqual({ formatted: '', timeMs: null });
    expect(parseSwimTimeInput('   ')).toEqual({ formatted: '', timeMs: null });
    expect(parseSwimTimeInput('-')).toEqual({ formatted: '', timeMs: null });
    expect(parseSwimTimeInput('00.00.00')).toEqual({ formatted: '00.00.00', timeMs: null });
    expect(formatTimeToMs('')).toBeNull();
    expect(formatTimeToMs('00.00.00')).toBeNull();
  });
});
