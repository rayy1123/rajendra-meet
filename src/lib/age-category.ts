/**
 * Kategori Usia (KU) & helper pendaftaran lomba.
 * Logika di-port dari swimclub-app (usia per 31 Desember tahun berjalan).
 */

export function ageInYears(birthDate: Date, referenceYear: number = new Date().getFullYear()): number {
  const y = referenceYear - birthDate.getFullYear();
  return new Date(referenceYear, 11, 31) < birthDate ? y - 1 : y;
}

export function calculateAgeCategory(
  birthDate: Date,
  referenceYear: number = new Date().getFullYear(),
): string {
  const effectiveAge = ageInYears(birthDate, referenceYear);

  if (effectiveAge <= 0) return "TB (Under 6)";
  if (effectiveAge <= 8) return "KU 1 (6-8)";
  if (effectiveAge <= 10) return "KU 2 (9-10)";
  if (effectiveAge <= 12) return "KU 3 (11-12)";
  if (effectiveAge <= 14) return "KU 4 (13-14)";
  if (effectiveAge <= 16) return "KU 5 (15-16)";
  return "Open (17+)";
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
