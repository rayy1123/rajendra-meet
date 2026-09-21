/**
 * Kategori Usia (KU) & helper pendaftaran lomba.
 * Logika di-port dari swimclub-app (usia per 31 Desember tahun berjalan).
 */

export function ageInYears(birthDate: Date, referenceYear: number = new Date().getFullYear()): number {
  const y = referenceYear - birthDate.getFullYear();
  return new Date(referenceYear, 11, 31) < birthDate ? y - 1 : y;
}

export function calculateAgeCategory(
  birthDate: Date | string,
  referenceYear: number = new Date().getFullYear(),
): string {
  const bDate = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const effectiveAge = ageInYears(bDate, referenceYear);

  if (effectiveAge >= 19) return "KU Senior (19+ Th / Mahasiswa & Umum)";
  if (effectiveAge >= 16) return "KU I (16-18 Th / SMA 10-12)";
  if (effectiveAge >= 14) return "KU II (14-15 Th / SMP 8-9)";
  if (effectiveAge >= 12) return "KU III (12-13 Th / SD 6 - SMP 7)";
  if (effectiveAge >= 10) return "KU IV (10-11 Th / SD 4-5)";
  return "KU V (< 10 Th / SD 1-3 / PAUD)";
}

export function getKuCode(
  birthDate: Date | string,
  referenceYear: number = new Date().getFullYear(),
): string {
  const bDate = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const effectiveAge = ageInYears(bDate, referenceYear);

  if (effectiveAge >= 19) return "KU Senior";
  if (effectiveAge >= 16) return "KU I";
  if (effectiveAge >= 14) return "KU II";
  if (effectiveAge >= 12) return "KU III";
  if (effectiveAge >= 10) return "KU IV";
  return "KU V";
}

export const STROKES = ["Freestyle", "Breaststroke", "Backstroke", "Butterfly", "Individual Medley"] as const;

export const STROKE_LABELS: Record<string, string> = {
  Freestyle: "Gaya Bebas",
  Breaststroke: "Gaya Dada",
  Backstroke: "Gaya Punggung",
  Butterfly: "Gaya Kupu-kupu",
  "Individual Medley": "Gaya Ganti",
  Medley: "Gaya Ganti",
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type Gender = "male" | "female";

export interface EligibilityFilter {
  gender: Gender;
  age: number;
  minAge?: number | null;
  maxAge?: number | null;
  catGender?: Gender | null;
}

/** Nomor lomba eligible bila gender & rentang usia cocok. */
export function isCategoryEligible(f: EligibilityFilter): boolean {
  if (f.catGender && f.catGender !== f.gender) return false;
  if (f.minAge !== null && f.minAge !== undefined && f.age < f.minAge) return false;
  if (f.maxAge !== null && f.maxAge !== undefined && f.age > f.maxAge) return false;
  return true;
}
