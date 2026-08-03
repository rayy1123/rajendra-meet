import { describe, it, expect } from 'vitest';
import {
  resolveAgeGroup,
  validateAgeGroupRules,
  type AgeGroupRule,
} from '../age-group';

/**
 * Skenario dari panitia:
 * "KU 1 kualifikasinya kelahiran 2008 ke atas, maka Andi yang lahir
 *  11 Juni 2008 masuk KU 1."
 */
const rules: AgeGroupRule[] = [
  { code: 'KU 1', birthDateFrom: null, birthDateTo: '2008-12-31', sortOrder: 1 },
  { code: 'KU 2', birthDateFrom: '2009-01-01', birthDateTo: '2010-12-31', sortOrder: 2 },
  { code: 'KU 3', birthDateFrom: '2011-01-01', birthDateTo: '2012-12-31', sortOrder: 3 },
  { code: 'KU 4', birthDateFrom: '2013-01-01', birthDateTo: null, sortOrder: 4 },
];

describe('resolveAgeGroup', () => {
  it('menempatkan Andi (11 Juni 2008) di KU 1', () => {
    expect(resolveAgeGroup('2008-06-11', 'male', rules)).toBe('KU 1');
  });

  it('menghormati batas bulan, bukan hanya tahun', () => {
    expect(resolveAgeGroup('2008-12-31', 'male', rules)).toBe('KU 1');
    expect(resolveAgeGroup('2009-01-01', 'male', rules)).toBe('KU 2');
  });

  it('atlet yang jauh lebih tua tetap masuk KU 1 (tanpa batas bawah)', () => {
    expect(resolveAgeGroup('1999-03-20', 'female', rules)).toBe('KU 1');
  });

  it('atlet termuda masuk KU terakhir (tanpa batas atas)', () => {
    expect(resolveAgeGroup('2018-08-02', 'male', rules)).toBe('KU 4');
  });

  it('menerima objek Date', () => {
    expect(resolveAgeGroup(new Date('2010-05-05T00:00:00Z'), 'male', rules)).toBe('KU 2');
  });

  it('mengembalikan null jika tidak ada aturan yang cocok', () => {
    const gap: AgeGroupRule[] = [
      { code: 'KU A', birthDateFrom: '2010-01-01', birthDateTo: '2010-12-31', sortOrder: 1 },
    ];
    expect(resolveAgeGroup('2005-01-01', 'male', gap)).toBeNull();
  });

  it('mengabaikan aturan non-aktif', () => {
    const withInactive: AgeGroupRule[] = [
      { code: 'KU LAMA', birthDateFrom: null, birthDateTo: '2008-12-31', sortOrder: 0, isActive: false },
      ...rules,
    ];
    expect(resolveAgeGroup('2008-06-11', 'male', withInactive)).toBe('KU 1');
  });

  it('aturan khusus gender menang atas aturan netral', () => {
    const withGender: AgeGroupRule[] = [
      ...rules,
      {
        code: 'KU 1 PUTRI',
        birthDateFrom: null,
        birthDateTo: '2008-12-31',
        gender: 'female',
        sortOrder: 99,
      },
    ];
    expect(resolveAgeGroup('2008-06-11', 'female', withGender)).toBe('KU 1 PUTRI');
    expect(resolveAgeGroup('2008-06-11', 'male', withGender)).toBe('KU 1');
  });

  it('saat tumpang tindih, sortOrder terkecil menang', () => {
    const overlapping: AgeGroupRule[] = [
      { code: 'LUAS', birthDateFrom: '2000-01-01', birthDateTo: '2015-12-31', sortOrder: 5 },
      { code: 'SEMPIT', birthDateFrom: '2008-01-01', birthDateTo: '2008-12-31', sortOrder: 1 },
    ];
    expect(resolveAgeGroup('2008-06-11', 'male', overlapping)).toBe('SEMPIT');
  });

  it('aturan yang diubah panitia langsung mengubah hasil', () => {
    // Panitia menggeser batas KU 1 menjadi kelahiran 2007 ke atas
    const revised: AgeGroupRule[] = [
      { code: 'KU 1', birthDateFrom: null, birthDateTo: '2007-12-31', sortOrder: 1 },
      { code: 'KU 2', birthDateFrom: '2008-01-01', birthDateTo: '2009-12-31', sortOrder: 2 },
    ];
    expect(resolveAgeGroup('2008-06-11', 'male', revised)).toBe('KU 2');
  });
});

describe('validateAgeGroupRules', () => {
  it('menerima aturan yang sehat', () => {
    expect(validateAgeGroupRules(rules)).toEqual([]);
  });

  it('menolak aturan tanpa batas sama sekali', () => {
    const bad: AgeGroupRule[] = [
      { code: 'KU X', birthDateFrom: null, birthDateTo: null, sortOrder: 1 },
    ];
    expect(validateAgeGroupRules(bad).join(' ')).toContain('minimal satu batas');
  });

  it('menolak rentang terbalik', () => {
    const bad: AgeGroupRule[] = [
      { code: 'KU Y', birthDateFrom: '2012-01-01', birthDateTo: '2010-12-31', sortOrder: 1 },
    ];
    expect(validateAgeGroupRules(bad).join(' ')).toContain('batas bawah lebih besar');
  });

  it('mendeteksi kode duplikat', () => {
    const bad: AgeGroupRule[] = [
      { code: 'KU 1', birthDateFrom: null, birthDateTo: '2008-12-31', sortOrder: 1 },
      { code: 'KU 1', birthDateFrom: '2009-01-01', birthDateTo: '2010-12-31', sortOrder: 2 },
    ];
    expect(validateAgeGroupRules(bad).join(' ')).toContain('duplikat');
  });

  it('memperingatkan tumpang tindih', () => {
    const overlapping: AgeGroupRule[] = [
      { code: 'A', birthDateFrom: '2008-01-01', birthDateTo: '2010-12-31', sortOrder: 1 },
      { code: 'B', birthDateFrom: '2010-01-01', birthDateTo: '2012-12-31', sortOrder: 2 },
    ];
    expect(validateAgeGroupRules(overlapping).join(' ')).toContain('tumpang tindih');
  });
});
