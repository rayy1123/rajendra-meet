import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 1. Utility untuk menggabungkan class Tailwind CSS (Shadcn UI Standard)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 2. Konversi Milidetik ke Format Waktu Renang (e.g. 65120 ms -> "01:05.12" atau 28450 ms -> "28.45")
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
 * 3. Konversi String Waktu Input Operator ke Milidetik (e.g. "01:05.12", "28.45", atau "28,45" -> ms)
 */
export function formatTimeToMs(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  // Ganti koma ke titik, hilangkan spasi, dan bersihkan string
  const cleanStr = timeStr.trim().replace(',', '.').toUpperCase();

  if (cleanStr === '' || cleanStr === 'NT' || cleanStr === 'DNS' || cleanStr === 'DSQ' || cleanStr === 'DNF') {
    return null;
  }

  let minutes = 0;
  let seconds = 0;
  let hundredths = 0;

  try {
    if (cleanStr.includes(':')) {
      const [minPart, secPart] = cleanStr.split(':');
      minutes = parseInt(minPart, 10) || 0;

      if (secPart.includes('.')) {
        const [s, h] = secPart.split('.');
        seconds = parseInt(s, 10) || 0;
        hundredths = parseInt(h.padEnd(2, '0').slice(0, 2), 10) || 0;
      } else {
        seconds = parseInt(secPart, 10) || 0;
      }
    } else if (cleanStr.includes('.')) {
      const [s, h] = cleanStr.split('.');
      seconds = parseInt(s, 10) || 0;
      hundredths = parseInt(h.padEnd(2, '0').slice(0, 2), 10) || 0;
    } else {
      seconds = parseInt(cleanStr, 10) || 0;
    }

    const totalMs = (minutes * 60 + seconds) * 1000 + hundredths * 10;
    return isNaN(totalMs) || totalMs <= 0 ? null : totalMs;
  } catch {
    return null;
  }
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