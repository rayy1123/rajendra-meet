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