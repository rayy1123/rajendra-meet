/**
 * Resolusi Kelompok Umur (KU) dari tanggal lahir.
 *
 * Padanan sisi klien dari fungsi Postgres `public.resolve_age_group`.
 * Keduanya HARUS menghasilkan jawaban yang sama — kalau logika di sini
 * berubah, ubah juga supabase/migrations/0002_age_groups.sql.
 *
 * Aturan disimpan sebagai rentang tanggal lahir inklusif, sehingga panitia
 * bebas mengubah batasan tanpa mengubah kode. Contoh
 * "KU 1 = kelahiran 2008 ke atas (lebih tua atau sama)":
 *   { code: 'KU 1', birthDateFrom: null, birthDateTo: '2008-12-31' }
 * Atlet lahir 11 Juni 2008 masuk KU 1 karena 2008-06-11 <= 2008-12-31.
 */

export type Gender = 'male' | 'female';

export interface AgeGroupRule {
  code: string;
  /** Batas bawah tanggal lahir (inklusif). null = tanpa batas bawah (paling tua). */
  birthDateFrom: string | null;
  /** Batas atas tanggal lahir (inklusif). null = tanpa batas atas (paling muda). */
  birthDateTo: string | null;
  /** null = berlaku untuk semua gender. */
  gender?: Gender | null;
  /** Urutan pengecekan; angka kecil dicek lebih dulu. */
  sortOrder: number;
  isActive?: boolean;
}

/** Bandingkan dua tanggal ISO (YYYY-MM-DD) secara leksikografis — valid untuk format ini. */
function isoLte(a: string, b: string): boolean {
  return a <= b;
}

function normalizeIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
}

/**
 * Mengembalikan kode KU untuk satu tanggal lahir, atau null jika tidak ada
 * aturan yang cocok.
 *
 * Prioritas: aturan gender-spesifik menang atas gender-netral, lalu sortOrder
 * terkecil, lalu urutan kemunculan.
 */
export function resolveAgeGroup(
  birthDate: string | Date,
  gender: Gender,
  rules: AgeGroupRule[]
): string | null {
  const birth = normalizeIsoDate(birthDate);

  const candidates = rules
    .filter((r) => r.isActive !== false)
    .filter((r) => r.gender == null || r.gender === gender)
    .filter((r) => {
      const afterFrom = r.birthDateFrom == null || isoLte(r.birthDateFrom, birth);
      const beforeTo = r.birthDateTo == null || isoLte(birth, r.birthDateTo);
      return afterFrom && beforeTo;
    });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aSpecific = a.gender != null ? 0 : 1;
    const bSpecific = b.gender != null ? 0 : 1;
    if (aSpecific !== bSpecific) return aSpecific - bSpecific;
    return a.sortOrder - b.sortOrder;
  });

  return candidates[0].code;
}

/**
 * Memvalidasi sekumpulan aturan KU sebelum disimpan.
 * Mengembalikan daftar pesan masalah; kosong berarti aturan sehat.
 */
export function validateAgeGroupRules(rules: AgeGroupRule[]): string[] {
  const problems: string[] = [];
  const active = rules.filter((r) => r.isActive !== false);

  const seen = new Set<string>();
  for (const r of active) {
    if (!r.code.trim()) {
      problems.push('Ada aturan tanpa kode KU.');
      continue;
    }

    const key = `${r.code}::${r.gender ?? 'all'}`;
    if (seen.has(key)) {
      problems.push(`Kode KU duplikat: ${r.code}.`);
    }
    seen.add(key);

    if (r.birthDateFrom == null && r.birthDateTo == null) {
      problems.push(`${r.code}: harus punya minimal satu batas tanggal lahir.`);
    }

    if (r.birthDateFrom != null && r.birthDateTo != null && !isoLte(r.birthDateFrom, r.birthDateTo)) {
      problems.push(`${r.code}: batas bawah lebih besar dari batas atas.`);
    }
  }

  // Deteksi tumpang tindih antar aturan pada gender yang sama
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.gender != null && b.gender != null && a.gender !== b.gender) continue;

      const aFrom = a.birthDateFrom ?? '0000-01-01';
      const aTo = a.birthDateTo ?? '9999-12-31';
      const bFrom = b.birthDateFrom ?? '0000-01-01';
      const bTo = b.birthDateTo ?? '9999-12-31';

      if (isoLte(aFrom, bTo) && isoLte(bFrom, aTo)) {
        problems.push(
          `${a.code} dan ${b.code} saling tumpang tindih; yang sortOrder-nya lebih kecil akan menang.`
        );
      }
    }
  }

  return problems;
}
