import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 1. Utility untuk menggabungkan class Tailwind CSS (Shadcn UI Standard)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 2. Konversi Milidetik ke Format Waktu Renang Standar (e.g. 65120 ms -> "01:05.12" atau 28450 ms -> "28.45")
 */
export function formatMsToTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms <= 0) {
    return 'NT'; // No Time
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.round((ms % 1000) / 10);

  const pad = (num: number, size: number = 2) => String(num).padStart(size, '0');

  // Jika pembulatan perseratus mencapai 100, tambahkan 1 detik
  if (hundredths === 100) {
    return formatMsToTime(ms + 10);
  }

  if (minutes > 0) {
    return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
  }
  return `${pad(seconds)}.${pad(hundredths)}`;
}

/**
 * 2b. Konversi Milidetik ke Format Final Time 3-Digit Grup (MM.SS.MS: "00.20.21" atau "01.05.12")
 */
export function formatMsToFinalTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms <= 0) {
    return '';
  }

  const totalHundredths = Math.round(ms / 10);
  const minutes = Math.floor(totalHundredths / 6000);
  const remainingHundredths = totalHundredths % 6000;
  const seconds = Math.floor(remainingHundredths / 100);
  const hundredths = remainingHundredths % 100;

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(minutes)}.${pad(seconds)}.${pad(hundredths)}`;
}

/**
 * 2c. Parsing & Auto-Format Input Waktu Renang Operator
 * Mendukung input fleksibel:
 *   - "002021" -> "00.20.21", 20210 ms
 *   - "2021"   -> "00.20.21", 20210 ms
 *   - "10512"  -> "01.05.12", 65120 ms
 *   - "20.21"  -> "00.20.21", 20210 ms
 *   - "01:05.12" -> "01.05.12", 65120 ms
 */
export function parseSwimTimeInput(raw: string | null | undefined): {
  formatted: string;
  timeMs: number | null;
} {
  if (!raw || typeof raw !== 'string') {
    return { formatted: '', timeMs: null };
  }

  const clean = raw.trim().toUpperCase();
  if (clean === '' || ['NT', 'DNS', 'DSQ', 'DNF', 'SCR'].includes(clean)) {
    return { formatted: clean, timeMs: null };
  }

  const digitsOnly = clean.replace(/\D/g, '');
  let min = 0;
  let sec = 0;
  let ms = 0;

  // Cek pemisah titik, titik dua, atau koma (e.g. "00.20.21" atau "01:05.12")
  const parts = clean.split(/[:.,]/).filter(Boolean);

  if (parts.length === 3) {
    min = parseInt(parts[0], 10) || 0;
    sec = parseInt(parts[1], 10) || 0;
    ms = parseInt(parts[2].padEnd(2, '0').slice(0, 2), 10) || 0;
  } else if (parts.length === 2) {
    sec = parseInt(parts[0], 10) || 0;
    ms = parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) || 0;
  } else if (digitsOnly.length > 0) {
    // Input angka beruntun e.g. "002021", "2021", "10512"
    const len = digitsOnly.length;
    if (len >= 6) {
      min = parseInt(digitsOnly.slice(0, len - 4), 10) || 0;
      sec = parseInt(digitsOnly.slice(len - 4, len - 2), 10) || 0;
      ms = parseInt(digitsOnly.slice(len - 2, len), 10) || 0;
    } else if (len === 5) {
      min = parseInt(digitsOnly.slice(0, 1), 10) || 0;
      sec = parseInt(digitsOnly.slice(1, 3), 10) || 0;
      ms = parseInt(digitsOnly.slice(3, 5), 10) || 0;
    } else if (len === 4) {
      min = 0;
      sec = parseInt(digitsOnly.slice(0, 2), 10) || 0;
      ms = parseInt(digitsOnly.slice(2, 4), 10) || 0;
    } else if (len === 3) {
      min = 0;
      sec = parseInt(digitsOnly.slice(0, 1), 10) || 0;
      ms = parseInt(digitsOnly.slice(1, 3), 10) || 0;
    } else {
      min = 0;
      sec = parseInt(digitsOnly, 10) || 0;
      ms = 0;
    }
  } else {
    return { formatted: '', timeMs: null };
  }

  // Normalisasi detik ke menit jika detik >= 60
  if (sec >= 60) {
    min += Math.floor(sec / 60);
    sec = sec % 60;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${pad(min)}.${pad(sec)}.${pad(ms)}`;
  const totalMs = (min * 60 + sec) * 1000 + ms * 10;

  return { formatted, timeMs: totalMs > 0 ? totalMs : null };
}

/**
 * 3. Konversi String Waktu Input Operator ke Milidetik (e.g. "00.20.21", "01:05.12", "002021" -> ms)
 */
export function formatTimeToMs(timeStr: string): number | null {
  const parsed = parseSwimTimeInput(timeStr);
  return parsed.timeMs;
}

/**
 * 4. Format Label Nomor Acara Perlombaan (e.g. "50m Gaya Bebas Putra KU 2012-2013")
 */
export interface CompEventLabelInput {
  name?: string | null;
  order_no?: number | null;
  gender?: string | null;
  stroke?: string | null;
  distance_meters?: number | null;
  age_group?: string | null;
}

export function formatCompEventLabel(
  ce: CompEventLabelInput,
  includeOrderPrefix: boolean = true
): string {
  if (ce.name && ce.name.trim().length > 0) {
    return includeOrderPrefix && ce.order_no ? `#${ce.order_no} ${ce.name}` : ce.name;
  }

  const parts: string[] = [];
  if (ce.distance_meters) parts.push(`${ce.distance_meters}m`);
  if (ce.stroke) parts.push(ce.stroke);
  if (ce.gender) {
    const g = ce.gender.toLowerCase();
    parts.push(g === 'male' || g === 'putra' ? 'Putra' : g === 'female' || g === 'putri' ? 'Putri' : ce.gender);
  }
  if (ce.age_group) parts.push(ce.age_group);

  const title = parts.join(' ') || 'Nomor Lomba';
  return includeOrderPrefix && ce.order_no ? `#${ce.order_no} ${title}` : title;
}

/**
 * 5. Format Angka ke Rupiah Indonesia (e.g. 150000 -> "Rp 150.000")
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * 6. Generator Nomor Atlet Otomatis (e.g. "ATL-2026-001")
 */
export function generateAthleteNumber(existingAthletes: { athlete_number?: string | null }[] = []): string {
  const currentYear = new Date().getFullYear();
  const existingNumbers = new Set(
    existingAthletes
      .map((a) => (a.athlete_number || '').trim().toUpperCase())
      .filter(Boolean)
  );

  let maxSeq = 0;
  for (const num of existingNumbers) {
    const match = num.match(/(\d+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxSeq && val < 999999) {
        maxSeq = val;
      }
    }
  }

  let nextSeq = Math.max(existingAthletes.length + 1, maxSeq + 1);
  let candidate = `ATL-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

  while (existingNumbers.has(candidate)) {
    nextSeq++;
    candidate = `ATL-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
  }

  return candidate;
}