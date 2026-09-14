/**
 * World Aquatics (FINA) Point Scoring System
 *
 * Standar resmi World Aquatics untuk mengukur mutu performa perenang
 * secara objektif lintas gaya, jarak, usia, dan gender.
 *
 * Rumus Resmi World Aquatics:
 *   P = floor( 1000 * ( B / T )^3 )
 *
 *   B = Base Time (Rekor Dunia resmi dalam detik)
 *   T = Waktu perenang dalam detik
 *
 * Nilai 1000 poin setara dengan Rekor Dunia resmi saat tabel diterbitkan.
 */

export type CourseType = 'LCM' | 'SCM'; // Long Course (50m) vs Short Course (25m)
export type GenderType = 'male' | 'female';

export interface BaseTimeTable {
  [strokeKey: string]: {
    male: number;   // base time dalam detik
    female: number; // base time dalam detik
  };
}

/**
 * Tabel Base Time Resmi World Aquatics (Periode 2024 - 2025)
 * Sumber: World Aquatics Swimming Points Base Times
 */
export const WORLD_AQUATICS_BASE_TIMES_LCM: BaseTimeTable = {
  // Gaya Bebas (Freestyle)
  '50_free': { male: 20.91, female: 23.61 },
  '100_free': { male: 46.80, female: 51.71 },
  '200_free': { male: 102.00, female: 112.98 },
  '400_free': { male: 220.07, female: 235.38 },
  '800_free': { male: 452.12, female: 484.79 },
  '1500_free': { male: 870.67, female: 920.48 },

  // Gaya Punggung (Backstroke)
  '50_back': { male: 23.55, female: 26.86 },
  '100_back': { male: 51.60, female: 57.13 },
  '200_back': { male: 111.92, female: 123.14 },

  // Gaya Dada (Breaststroke)
  '50_breast': { male: 25.95, female: 29.16 },
  '100_breast': { male: 56.88, female: 64.13 },
  '200_breast': { male: 125.48, female: 137.55 },

  // Gaya Kupu-kupu (Butterfly)
  '50_fly': { male: 22.27, female: 24.43 },
  '100_fly': { male: 49.45, female: 55.18 },
  '200_fly': { male: 110.34, female: 121.81 },

  // Gaya Ganti Perorangan (Individual Medley)
  '200_im': { male: 114.00, female: 126.12 },
  '400_im': { male: 242.50, female: 264.33 },
};

export const WORLD_AQUATICS_BASE_TIMES_SCM: BaseTimeTable = {
  // Gaya Bebas
  '50_free': { male: 20.16, female: 22.93 },
  '100_free': { male: 44.84, female: 50.25 },
  '200_free': { male: 99.37, female: 110.43 },
  '400_free': { male: 212.25, female: 231.30 },
  '800_free': { male: 440.46, female: 477.99 },
  '1500_free': { male: 846.88, female: 918.01 },

  // Gaya Punggung
  '50_back': { male: 22.11, female: 25.25 },
  '100_back': { male: 48.33, female: 54.27 },
  '200_back': { male: 105.63, female: 118.94 },

  // Gaya Dada
  '50_breast': { male: 24.95, female: 28.37 },
  '100_breast': { male: 55.28, female: 62.36 },
  '200_breast': { male: 120.16, female: 134.57 },

  // Gaya Kupu-kupu
  '50_fly': { male: 21.67, female: 24.38 },
  '100_fly': { male: 47.78, female: 54.05 },
  '200_fly': { male: 106.85, female: 119.61 },

  // Gaya Ganti Perorangan
  '100_im': { male: 49.28, female: 56.51 },
  '200_im': { male: 108.88, female: 121.86 },
  '400_im': { male: 234.81, female: 258.72 },
};

/**
 * Normalisasi nama gaya renang ke stroke key
 */
export function normalizeStrokeToKey(
  stroke?: string | null,
  distanceMeters?: number | null
): string | null {
  if (!stroke || !distanceMeters) return null;
  const s = stroke.toLowerCase().trim();
  let strokeName = '';

  if (s.includes('bebas') || s.includes('free') || s === 'fr') {
    strokeName = 'free';
  } else if (s.includes('dada') || s.includes('breast') || s === 'br') {
    strokeName = 'breast';
  } else if (s.includes('punggung') || s.includes('back') || s === 'bk') {
    strokeName = 'back';
  } else if (s.includes('kupu') || s.includes('fly') || s.includes('butterfly')) {
    strokeName = 'fly';
  } else if (s.includes('ganti') || s.includes('medley') || s.includes('im')) {
    strokeName = 'im';
  }

  if (!strokeName) return null;
  return `${distanceMeters}_${strokeName}`;
}

/**
 * Menghitung World Aquatics (FINA) Points
 *
 * @param gender 'male' | 'female' (atau 'putra' / 'putri')
 * @param stroke Nama gaya (contoh: 'Gaya Bebas', 'Freestyle', 'Dada', dll.)
 * @param distanceMeters Jarak dalam meter (50, 100, 200, 400, 800, 1500)
 * @param timeMs Waktu tempuh atlet dalam milidetik
 * @param course 'LCM' (50m) atau 'SCM' (25m), default: 'LCM'
 * @returns Nilai poin World Aquatics (integer, misal: 685) atau 0 bila tidak valid
 */
export function calculateFinaPoints(
  gender?: string | null,
  stroke?: string | null,
  distanceMeters?: number | null,
  timeMs?: number | null,
  course: CourseType = 'LCM'
): number {
  if (!gender || !stroke || !distanceMeters || !timeMs || timeMs <= 0) {
    return 0;
  }

  const normalizedGender: GenderType =
    gender.toLowerCase().includes('putri') || gender.toLowerCase() === 'female' || gender.toLowerCase() === 'pi'
      ? 'female'
      : 'male';

  const strokeKey = normalizeStrokeToKey(stroke, distanceMeters);
  if (!strokeKey) return 0;

  const table = course === 'SCM' ? WORLD_AQUATICS_BASE_TIMES_SCM : WORLD_AQUATICS_BASE_TIMES_LCM;
  const baseEntry = table[strokeKey];
  if (!baseEntry) return 0;

  const baseTimeSeconds = baseEntry[normalizedGender];
  const swimmerTimeSeconds = timeMs / 1000;

  if (swimmerTimeSeconds <= 0) return 0;

  // Rumus FINA: P = floor(1000 * (B / T)^3)
  const ratio = baseTimeSeconds / swimmerTimeSeconds;
  const points = Math.floor(1000 * Math.pow(ratio, 3));

  return Math.max(0, points);
}

/**
 * Format tampilan FINA points (misal: "685 pts")
 */
export function formatFinaPoints(points?: number | null): string {
  if (!points || points <= 0) return '—';
  return `${points.toLocaleString('id-ID')} pts`;
}
