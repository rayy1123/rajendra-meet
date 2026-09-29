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

/**
 * Format tampilan label Kelompok Umur (KU) bebas dari duplikasi seperti "KU KU Senior", "KU KU 5", "KU: KU".
 * Contoh:
 *   "KU KU Senior" -> "KU Senior"
 *   "KU KU 5"      -> "KU 5"
 *   "KU Senior"    -> "KU Senior"
 *   "KU 5"         -> "KU 5"
 *   "Senior"       -> "KU Senior"
 *   "5"            -> "KU 5"
 *   "Umum"         -> "KU Umum"
 *   "KU Umum"      -> "KU Umum"
 */
export function formatKuDisplay(val: string | undefined | null): string {
  if (!val) return "KU Umum";
  const clean = val.trim();
  // Hilangkan duplikasi awalan "KU", "KU:", "KU KU" secara menyeluruh
  const stripped = clean.replace(/^(ku[\s:]*)+/i, "").trim();
  if (!stripped || stripped.toLowerCase() === "umum") return "KU Umum";
  return `KU ${stripped}`;
}

/**
 * Format teks nomor lomba dengan subkategori tanpa duplikasi nama kategori/KU.
 * Mencegah output seperti "25M Gaya Dada Putra KU I · KU I" atau "50m Gaya Bebas KU 2 - KU 2".
 */
export function formatCompEventSubtitle(
  name: string | undefined | null,
  gradeLevel?: string | null,
  ageGroup?: string | null
): string {
  const cleanName = (name || "").trim();
  const extra = (gradeLevel || ageGroup || "").trim();
  if (!extra) return cleanName;

  const nameLower = cleanName.toLowerCase();
  const extraLower = extra.toLowerCase();

  // Jika nama sudah memuat teks ekstra secara utuh (misal "KU I" sudah ada di nama)
  if (nameLower.includes(extraLower)) {
    return cleanName;
  }

  // Jika ekstra adalah KU (misal "KU 1", "KU I") dan nama sudah memuat KU tersebut
  const cleanExtraKu = extraLower.replace(/^ku\s*/, "").trim();
  if (
    cleanExtraKu &&
    (nameLower.includes(`ku ${cleanExtraKu}`) ||
      nameLower.includes(`ku${cleanExtraKu}`) ||
      nameLower.includes(`kategori ${cleanExtraKu}`))
  ) {
    return cleanName;
  }

  return `${cleanName} · ${extra}`;
}

export type Gender = "male" | "female" | "mixed";

export interface EligibilityFilter {
  gender: "male" | "female";
  age: number;
  minAge?: number | null;
  maxAge?: number | null;
  catGender?: "male" | "female" | null;
}

/** Nomor lomba eligible bila gender & rentang usia cocok. */
export function isCategoryEligible(f: EligibilityFilter): boolean {
  if (f.catGender && f.catGender !== f.gender) return false;
  if (f.minAge !== null && f.minAge !== undefined && f.age < f.minAge) return false;
  if (f.maxAge !== null && f.maxAge !== undefined && f.age > f.maxAge) return false;
  return true;
}

export function normalizeGender(g: string | undefined | null): "male" | "female" | "mixed" {
  if (!g) return "male";
  const s = String(g).toLowerCase().trim();
  if (s.includes("fem") || s.includes("putri") || s.includes("perempuan") || s === "f" || s === "pi") return "female";
  if (s.includes("mix") || s.includes("campuran") || s === "all" || s === "semua") return "mixed";
  return "male";
}

export function isGenderMatch(
  athleteGender?: string | null,
  eventGender?: string | null,
  eventName?: string | null
): boolean {
  const aGen = normalizeGender(athleteGender);
  let eGen = normalizeGender(eventGender);

  const nameLower = (eventName || "").toLowerCase();
  if (nameLower.includes("putri") || nameLower.includes("female") || /\bpi\b/.test(nameLower)) {
    eGen = "female";
  } else if (nameLower.includes("putra") || nameLower.includes("male") || /\bpa\b/.test(nameLower)) {
    eGen = "male";
  } else if (nameLower.includes("campuran") || nameLower.includes("mix")) {
    eGen = "mixed";
  }

  if (eGen === "mixed") return true;
  return aGen === eGen;
}

export function parseEventKuTier(event: {
  name?: string | null;
  age_group?: string | null;
  grade_level?: string | null;
  class_name?: string | null;
}): "KU Senior" | "KU I" | "KU II" | "KU III" | "KU IV" | "KU V" | "OPEN" | "UNKNOWN" {
  const combined = [
    event.age_group || "",
    event.grade_level || "",
    event.class_name || "",
    event.name || "",
  ]
    .join(" ")
    .toLowerCase();

  // 1. KU Senior / Umum / Mahasiswa / 19+
  if (/\b(ku\s*senior|senior|mahasiswa|19\+)\b/.test(combined)) {
    return "KU Senior";
  }

  // 2. KU 3 / III (SD 6, SD 5-6, SMP 7) - check III before II and I
  if (
    /\b(ku\s*iii|ku\s*3|kategori\s*(?:umur|usia)\s*3|sd\s*(?:kelas\s*)?6|sd\s*(?:kelas\s*)?5\s*-\s*6|smp\s*(?:kelas\s*)?7)\b/.test(
      combined
    )
  ) {
    return "KU III";
  }

  // 3. KU 4 / IV (SD 4-5, SD 4, SD 5, SD 3-4) - check IV before V and I
  if (
    /\b(ku\s*iv|ku\s*4|kategori\s*(?:umur|usia)\s*4|sd\s*(?:kelas\s*)?[45]|sd\s*(?:kelas\s*)?4\s*-\s*5|sd\s*(?:kelas\s*)?3\s*-\s*4)\b/.test(
      combined
    )
  ) {
    return "KU IV";
  }

  // 4. KU 2 / II (SMP 8-9, SMP) - check II before I
  if (
    /\b(ku\s*ii|ku\s*2|kategori\s*(?:umur|usia)\s*2|smp\s*(?:kelas\s*)?[89]|smp\s*(?:kelas\s*)?8\s*-\s*9)\b/.test(
      combined
    ) ||
    (/\bsmp\b/.test(combined) && !/\bsmp\s*7\b/.test(combined))
  ) {
    return "KU II";
  }

  // 5. KU 5 / V (SD 1-3, SD 1-2, SD 1, SD 2, SD 3, PAUD, TK)
  if (
    /\b(ku\s*v|ku\s*5|kategori\s*(?:umur|usia)\s*5|paud|tk|sd\s*(?:kelas\s*)?[123]|sd\s*(?:kelas\s*)?1\s*-\s*3|sd\s*(?:kelas\s*)?1\s*-\s*2)\b/.test(
      combined
    )
  ) {
    return "KU V";
  }

  // 6. KU 1 / I (SMA, SMK, Aliyah, 16-18)
  if (
    /\b(ku\s*i|ku\s*1|kategori\s*(?:umur|usia)\s*1|sma|smk|aliyah|16\s*-\s*18)\b/.test(
      combined
    )
  ) {
    return "KU I";
  }

  // 7. General Open
  if (/\b(terbuka|open|semua\s*umur)\b/.test(combined)) {
    return "OPEN";
  }

  return "UNKNOWN";
}

export function resolveAthleteKuTier(
  athlete: {
    birth_date?: string | Date | null;
    age_group?: string | null;
    grade_level?: string | null;
    class_name?: string | null;
  },
  referenceYear: number = new Date().getFullYear()
): "KU Senior" | "KU I" | "KU II" | "KU III" | "KU IV" | "KU V" | "UNKNOWN" {
  if (athlete.birth_date) {
    const code = getKuCode(athlete.birth_date, referenceYear);
    if (
      code === "KU Senior" ||
      code === "KU I" ||
      code === "KU II" ||
      code === "KU III" ||
      code === "KU IV" ||
      code === "KU V"
    ) {
      return code;
    }
  }

  const combined = [
    athlete.age_group || "",
    athlete.grade_level || "",
    athlete.class_name || "",
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(ku\s*senior|senior|mahasiswa|19\+)\b/.test(combined)) return "KU Senior";
  if (
    /\b(ku\s*iii|ku\s*3|kategori\s*(?:umur|usia)\s*3|sd\s*(?:kelas\s*)?6|sd\s*(?:kelas\s*)?5\s*-\s*6|smp\s*(?:kelas\s*)?7)\b/.test(
      combined
    )
  )
    return "KU III";
  if (
    /\b(ku\s*iv|ku\s*4|kategori\s*(?:umur|usia)\s*4|sd\s*(?:kelas\s*)?[45]|sd\s*(?:kelas\s*)?4\s*-\s*5|sd\s*(?:kelas\s*)?3\s*-\s*4)\b/.test(
      combined
    )
  )
    return "KU IV";
  if (
    /\b(ku\s*ii|ku\s*2|kategori\s*(?:umur|usia)\s*2|smp\s*(?:kelas\s*)?[89]|smp\s*(?:kelas\s*)?8\s*-\s*9)\b/.test(
      combined
    ) ||
    (/\bsmp\b/.test(combined) && !/\bsmp\s*7\b/.test(combined))
  )
    return "KU II";
  if (
    /\b(ku\s*v|ku\s*5|kategori\s*(?:umur|usia)\s*5|paud|tk|sd\s*(?:kelas\s*)?[123]|sd\s*(?:kelas\s*)?1\s*-\s*3|sd\s*(?:kelas\s*)?1\s*-\s*2)\b/.test(
      combined
    )
  )
    return "KU V";
  if (
    /\b(ku\s*i|ku\s*1|kategori\s*(?:umur|usia)\s*1|sma|smk|aliyah|16\s*-\s*18)\b/.test(
      combined
    )
  )
    return "KU I";

  return "UNKNOWN";
}

export function normalizeKuCode(str: string | undefined | null): string {
  if (!str) return "";
  const s = str.trim().toLowerCase();
  if (s.includes("senior") || s.includes("mahasiswa")) return "KU Senior";
  if (s.includes("iii") || s === "ku 3" || s === "ku3" || s.includes("umur 3") || s.includes("usia 3") || s.includes("sd 6") || s.includes("smp 7")) return "KU III";
  if (s.includes("iv") || s === "ku 4" || s === "ku4" || s.includes("umur 4") || s.includes("usia 4") || s.includes("sd 4") || s.includes("sd 5")) return "KU IV";
  if (s.includes("ii") || s === "ku 2" || s === "ku2" || s.includes("umur 2") || s.includes("usia 2") || s.includes("smp")) return "KU II";
  if (s.includes("v") || s === "ku 5" || s === "ku5" || s.includes("umur 5") || s.includes("usia 5") || s.includes("sd 1") || s.includes("sd 2") || s.includes("sd 3") || s.includes("paud") || s.includes("tk")) return "KU V";
  if (s.includes("i") || s === "ku 1" || s === "ku1" || s.includes("sma") || s.includes("smk") || s.includes("umur 1") || s.includes("usia 1")) return "KU I";
  return str.trim();
}

export function isEventEligibleForAthlete(
  athlete: {
    birth_date?: string | Date | null;
    gender?: string | null;
    age_group?: string | null;
    grade_level?: string | null;
    class_name?: string | null;
  },
  event: {
    id?: string;
    name?: string | null;
    stroke?: string | null;
    gender?: string | null;
    age_group?: string | null;
    grade_level?: string | null;
    class_name?: string | null;
  },
  referenceYear: number = new Date().getFullYear()
): boolean {
  // 1. Gender check
  if (!isGenderMatch(athlete.gender, event.gender, event.name)) {
    return false;
  }

  // 2. Athlete KU determination (berlaku ketat untuk semua kategori umur)
  const athleteKu = resolveAthleteKuTier(athlete, referenceYear);
  if (athleteKu === "UNKNOWN") return false;

  // 3. Event KU determination
  const eventKu = parseEventKuTier(event);

  // Aturan mutlak: jika atlet berkualifikasi Kategori Umur X, HANYA tampilkan nomor lomba
  // yang berkualifikasi Kategori Umur X saja, seluruh nomor lomba KU lain dihilangkan total.
  if (athleteKu === "KU Senior") {
    return eventKu === "KU Senior" || eventKu === "OPEN";
  }

  if (athleteKu === "KU I") {
    return eventKu === "KU I";
  }

  if (athleteKu === "KU II") {
    return eventKu === "KU II";
  }

  if (athleteKu === "KU III") {
    return eventKu === "KU III";
  }

  if (athleteKu === "KU IV") {
    return eventKu === "KU IV";
  }

  if (athleteKu === "KU V") {
    return eventKu === "KU V";
  }

  return false;
}
