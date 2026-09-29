import { describe, it, expect } from 'vitest';
import {
  parseEventKuTier,
  isEventEligibleForAthlete,
  getKuCode,
  isGenderMatch,
  formatKuDisplay,
  formatCompEventSubtitle,
} from '@/lib/age-category';

describe('Strict KU and Gender Eligibility Filtering', () => {
  const refYear = 2026;

  // 17 tahun pada 31 Des 2026 -> KU 1 (16-18 tahun)
  const athleteKu1Male = {
    full_name: 'Ahmad Fauzi',
    birth_date: '2009-05-15',
    gender: 'male',
  };

  const athleteKu1Female = {
    full_name: 'Siti Rahma',
    birth_date: '2009-08-20',
    gender: 'female',
  };

  // 14 tahun pada 31 Des 2026 -> KU 2 (14-15 tahun)
  const athleteKu2Male = {
    full_name: 'Budi Santoso',
    birth_date: '2012-03-10',
    gender: 'male',
  };

  // 12 tahun pada 31 Des 2026 -> KU 3 (12-13 tahun)
  const athleteKu3Female = {
    full_name: 'Dewi Lestari',
    birth_date: '2014-07-25',
    gender: 'female',
  };

  describe('getKuCode', () => {
    it('mengelompokkan atlet 17 tahun ke KU I', () => {
      expect(getKuCode('2009-05-15', refYear)).toBe('KU I');
    });

    it('mengelompokkan atlet 14 tahun ke KU II', () => {
      expect(getKuCode('2012-03-10', refYear)).toBe('KU II');
    });

    it('mengelompokkan atlet 12 tahun ke KU III', () => {
      expect(getKuCode('2014-07-25', refYear)).toBe('KU III');
    });

    it('mengelompokkan atlet 10 tahun ke KU IV', () => {
      expect(getKuCode('2016-01-10', refYear)).toBe('KU IV');
    });

    it('mengelompokkan atlet 8 tahun ke KU V', () => {
      expect(getKuCode('2018-09-09', refYear)).toBe('KU V');
    });

    it('mengelompokkan atlet 20 tahun ke KU Senior', () => {
      expect(getKuCode('2006-02-01', refYear)).toBe('KU Senior');
    });
  });

  describe('formatKuDisplay', () => {
    it('membersihkan duplikasi awalan KU', () => {
      expect(formatKuDisplay('KU KU Senior')).toBe('KU Senior');
      expect(formatKuDisplay('KU KU 5')).toBe('KU 5');
      expect(formatKuDisplay('KU Senior')).toBe('KU Senior');
      expect(formatKuDisplay('KU 5')).toBe('KU 5');
      expect(formatKuDisplay('Senior')).toBe('KU Senior');
      expect(formatKuDisplay('Umum')).toBe('KU Umum');
      expect(formatKuDisplay('KU Umum')).toBe('KU Umum');
      expect(formatKuDisplay('KU: KU Senior')).toBe('KU Senior');
      expect(formatKuDisplay(null)).toBe('KU Umum');
      expect(formatKuDisplay(undefined)).toBe('KU Umum');
    });
  });

  describe('formatCompEventSubtitle', () => {
    it('mencegah duplikasi KU pada penamaan nomor lomba (Image #28 fix)', () => {
      // Kasus persis di screenshot user: 25M Gaya Dada Putra KU I + grade_level KU I
      expect(formatCompEventSubtitle('25M Gaya Dada Putra KU I', 'KU I')).toBe('25M Gaya Dada Putra KU I');
      expect(formatCompEventSubtitle('50M Gaya Bebas KU 2 Putra', 'KU 2')).toBe('50M Gaya Bebas KU 2 Putra');
      expect(formatCompEventSubtitle('100M Gaya Bebas Putra Senior', 'Senior')).toBe('100M Gaya Bebas Putra Senior');
      expect(formatCompEventSubtitle('50M Gaya Dada Putra SMA', 'SMA')).toBe('50M Gaya Dada Putra SMA');

      // Jika grade level belum ada di nama, tampilkan pemisah rapi
      expect(formatCompEventSubtitle('50m Gaya Bebas', 'KU I')).toBe('50m Gaya Bebas · KU I');
      expect(formatCompEventSubtitle('25m Gaya Dada', 'SD 1-2')).toBe('25m Gaya Dada · SD 1-2');
      expect(formatCompEventSubtitle('50m Gaya Bebas', null)).toBe('50m Gaya Bebas');
    });
  });

  describe('parseEventKuTier', () => {
    it('membedakan KU I, KU II, KU III, KU IV, dan KU V tanpa kebocoran substring', () => {
      expect(parseEventKuTier({ name: '50m Gaya Bebas KU 1 Putra', age_group: 'KU 1' })).toBe('KU I');
      expect(parseEventKuTier({ name: '50m Gaya Bebas KU I Putra', age_group: 'KU I' })).toBe('KU I');
      expect(parseEventKuTier({ name: '50m Gaya Bebas SMA Putra', grade_level: 'SMA' })).toBe('KU I');

      expect(parseEventKuTier({ name: '50m Gaya Bebas KU 2 Putra', age_group: 'KU 2' })).toBe('KU II');
      expect(parseEventKuTier({ name: '50m Gaya Bebas KU II Putra', age_group: 'KU II' })).toBe('KU II');
      expect(parseEventKuTier({ name: '50m Gaya Bebas SMP Putra', grade_level: 'SMP' })).toBe('KU II');

      expect(parseEventKuTier({ name: '50m Gaya Bebas KU 3 Putri', age_group: 'KU 3' })).toBe('KU III');
      expect(parseEventKuTier({ name: '50m Gaya Bebas KU III Putri', age_group: 'KU III' })).toBe('KU III');

      expect(parseEventKuTier({ name: '50m Gaya Bebas KU 4 Putra', age_group: 'KU 4' })).toBe('KU IV');
      expect(parseEventKuTier({ name: '50m Gaya Bebas KU IV Putra', age_group: 'KU IV' })).toBe('KU IV');

      expect(parseEventKuTier({ name: '25m Gaya Dada KU 5 Putri', age_group: 'KU 5' })).toBe('KU V');
      expect(parseEventKuTier({ name: '25m Gaya Dada SD 1-3 Putri', grade_level: 'SD 1-3' })).toBe('KU V');

      expect(parseEventKuTier({ name: '100m Gaya Bebas Senior Putra', age_group: 'Senior' })).toBe('KU Senior');
    });
  });

  describe('isGenderMatch', () => {
    it('mencocokkan gender atlet dan nomor lomba secara presisi', () => {
      expect(isGenderMatch('male', 'male', '50m Bebas Putra')).toBe(true);
      expect(isGenderMatch('male', 'female', '50m Bebas Putri')).toBe(false);
      expect(isGenderMatch('female', 'female', '50m Bebas Putri')).toBe(true);
      expect(isGenderMatch('female', 'male', '50m Bebas Putra')).toBe(false);
      expect(isGenderMatch('male', 'mixed', '4x50m Estafet Campuran')).toBe(true);
      expect(isGenderMatch('female', 'mixed', '4x50m Estafet Campuran')).toBe(true);
    });
  });

  describe('isEventEligibleForAthlete - Enforce KU 1 Isolation', () => {
    const events = [
      { id: '1', name: '50m Bebas KU 1 Putra', stroke: 'Freestyle', gender: 'male', age_group: 'KU 1' },
      { id: '2', name: '100m Dada KU 1 Putra', stroke: 'Breaststroke', gender: 'male', age_group: 'KU I' },
      { id: '3', name: '50m Bebas SMA Putra', stroke: 'Freestyle', gender: 'male', grade_level: 'SMA' },
      { id: '4', name: '50m Bebas KU 1 Putri', stroke: 'Freestyle', gender: 'female', age_group: 'KU 1' },
      { id: '5', name: '50m Bebas KU 2 Putra', stroke: 'Freestyle', gender: 'male', age_group: 'KU 2' },
      { id: '6', name: '50m Bebas KU II Putra', stroke: 'Freestyle', gender: 'male', age_group: 'KU II' },
      { id: '7', name: '50m Bebas SMP Putra', stroke: 'Freestyle', gender: 'male', grade_level: 'SMP' },
      { id: '8', name: '50m Bebas KU 3 Putra', stroke: 'Freestyle', gender: 'male', age_group: 'KU 3' },
      { id: '9', name: '50m Bebas KU 4 Putra', stroke: 'Freestyle', gender: 'male', age_group: 'KU 4' },
      { id: '10', name: '25m Dada KU 5 Putra', stroke: 'Breaststroke', gender: 'male', age_group: 'KU 5' },
      { id: '11', name: '100m Bebas Senior Putra', stroke: 'Freestyle', gender: 'male', age_group: 'Senior' },
    ];

    it('HANYA menampilkan nomor kualifikasi KU 1 untuk atlet KU 1 dan mengeliminasi sisanya', () => {
      const eligible = events.filter((e) => isEventEligibleForAthlete(athleteKu1Male, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      // Hanya nomor 1, 2, 3 yang lolos (KU 1 Putra dan SMA Putra)
      expect(eligibleIds).toEqual(['1', '2', '3']);

      // Pastikan nomor KU lain (KU 2, 3, 4, 5, Senior) dan gender berbeda (Putri) tereliminasi total
      expect(eligibleIds).not.toContain('4'); // Putri
      expect(eligibleIds).not.toContain('5'); // KU 2
      expect(eligibleIds).not.toContain('6'); // KU II
      expect(eligibleIds).not.toContain('7'); // SMP
      expect(eligibleIds).not.toContain('8'); // KU 3
      expect(eligibleIds).not.toContain('9'); // KU 4
      expect(eligibleIds).not.toContain('10'); // KU 5
      expect(eligibleIds).not.toContain('11'); // Senior
    });

    it('HANYA menampilkan nomor KU 1 Putri untuk atlet KU 1 Putri', () => {
      const eligible = events.filter((e) => isEventEligibleForAthlete(athleteKu1Female, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      expect(eligibleIds).toEqual(['4']);
      expect(eligibleIds).not.toContain('1'); // Putra
      expect(eligibleIds).not.toContain('5'); // KU 2
    });

    it('HANYA menampilkan nomor KU 2 Putra untuk atlet KU 2 Putra', () => {
      const eligible = events.filter((e) => isEventEligibleForAthlete(athleteKu2Male, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      expect(eligibleIds).toEqual(['5', '6', '7']);
      expect(eligibleIds).not.toContain('1'); // KU 1 Putra
      expect(eligibleIds).not.toContain('2'); // KU 1 Putra
      expect(eligibleIds).not.toContain('3'); // SMA Putra
      expect(eligibleIds).not.toContain('8'); // KU 3
      expect(eligibleIds).not.toContain('9'); // KU 4
      expect(eligibleIds).not.toContain('10'); // KU 5
      expect(eligibleIds).not.toContain('11'); // Senior
    });

    it('HANYA menampilkan nomor KU 3 Putri untuk atlet KU 3 Putri', () => {
      const ku3Events = [
        ...events,
        { id: '12', name: '50m Bebas KU 3 Putri', stroke: 'Freestyle', gender: 'female', age_group: 'KU 3' },
        { id: '13', name: '50m Bebas SD 6 Putri', stroke: 'Freestyle', gender: 'female', grade_level: 'SD 6' },
      ];
      const eligible = ku3Events.filter((e) => isEventEligibleForAthlete(athleteKu3Female, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      expect(eligibleIds).toEqual(['12', '13']);
      expect(eligibleIds).not.toContain('1'); // KU 1
      expect(eligibleIds).not.toContain('4'); // KU 1 Putri
      expect(eligibleIds).not.toContain('5'); // KU 2
      expect(eligibleIds).not.toContain('8'); // KU 3 Putra (beda gender)
    });

    it('HANYA menampilkan nomor KU 4 Putra untuk atlet KU 4 Putra', () => {
      const athleteKu4Male = { full_name: 'Doni', birth_date: '2016-03-01', gender: 'male' };
      const ku4Events = [
        ...events,
        { id: '14', name: '50m Bebas SD 4-5 Putra', stroke: 'Freestyle', gender: 'male', grade_level: 'SD 4-5' },
      ];
      const eligible = ku4Events.filter((e) => isEventEligibleForAthlete(athleteKu4Male, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      expect(eligibleIds).toEqual(['9', '14']);
      expect(eligibleIds).not.toContain('1'); // KU 1
      expect(eligibleIds).not.toContain('5'); // KU 2
      expect(eligibleIds).not.toContain('8'); // KU 3
      expect(eligibleIds).not.toContain('10'); // KU 5
    });

    it('HANYA menampilkan nomor KU 5 Putra untuk atlet KU 5 Putra', () => {
      const athleteKu5Male = { full_name: 'Fikri', birth_date: '2018-05-10', gender: 'male' };
      const ku5Events = [
        ...events,
        { id: '15', name: '25m Kaki Bebas PAUD/TK Putra', stroke: 'Freestyle', gender: 'male', age_group: 'PAUD/TK' },
        { id: '16', name: '25m Dada SD 1-3 Putra', stroke: 'Breaststroke', gender: 'male', grade_level: 'SD 1-3' },
      ];
      const eligible = ku5Events.filter((e) => isEventEligibleForAthlete(athleteKu5Male, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      expect(eligibleIds).toEqual(['10', '15', '16']);
      expect(eligibleIds).not.toContain('1'); // KU 1
      expect(eligibleIds).not.toContain('5'); // KU 2
      expect(eligibleIds).not.toContain('8'); // KU 3
      expect(eligibleIds).not.toContain('9'); // KU 4
    });

    it('HANYA menampilkan nomor Senior Putra untuk atlet Senior Putra', () => {
      const athleteSeniorMale = { full_name: 'Hendra', birth_date: '2004-01-01', gender: 'male' };
      const eligible = events.filter((e) => isEventEligibleForAthlete(athleteSeniorMale, e, refYear));
      const eligibleIds = eligible.map((e) => e.id);

      expect(eligibleIds).toEqual(['11']);
      expect(eligibleIds).not.toContain('1'); // KU 1
      expect(eligibleIds).not.toContain('5'); // KU 2
      expect(eligibleIds).not.toContain('8'); // KU 3
      expect(eligibleIds).not.toContain('9'); // KU 4
      expect(eligibleIds).not.toContain('10'); // KU 5
    });
  });
});
