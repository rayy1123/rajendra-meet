export type LiveScoreboardMode = 'auto' | 'open' | 'closed';
export type ResultsVisibilityMode = 'auto' | 'open' | 'closed';

export interface EventLiveConfig {
  eventId: string;
  mode: LiveScoreboardMode;
  resultsMode?: ResultsVisibilityMode;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LiveActiveResult {
  isActive: boolean;
  mode: LiveScoreboardMode;
  reason: 'manual_open' | 'manual_closed' | 'not_started' | 'running' | 'finished';
  description: string;
}

export interface ResultsVisibilityResult {
  isVisible: boolean;
  mode: ResultsVisibilityMode;
  reason: 'manual_open' | 'manual_closed' | 'not_started' | 'running' | 'finished';
  description: string;
}

/**
 * Memeriksa apakah live scoreboard suatu event sedang aktif atau ditutup.
 * Mode:
 * - 'open': Dipaksa buka oleh panitia
 * - 'closed': Dipaksa tutup oleh panitia
 * - 'auto': Otomatis buka jika tanggal hari ini >= tanggal mulai kejuaraan
 */
export function checkEventLiveStatus(
  event: { start_date?: string | null; end_date?: string | null },
  config?: { mode?: LiveScoreboardMode | null } | null,
): LiveActiveResult {
  const mode: LiveScoreboardMode = config?.mode || 'auto';

  // 1. Jika panitia secara manual menutup
  if (mode === 'closed') {
    return {
      isActive: false,
      mode: 'closed',
      reason: 'manual_closed',
      description: 'Live scoreboard sengaja ditutup sementara oleh panitia pelaksana.',
    };
  }

  // 2. Jika panitia secara manual membuka
  if (mode === 'open') {
    return {
      isActive: true,
      mode: 'open',
      reason: 'manual_open',
      description: 'Live scoreboard sedang aktif dan dibuka untuk publik.',
    };
  }

  // 3. Mode 'auto' (Sesuai tanggal pelaksanaan kejuaraan)
  if (!event.start_date) {
    // Tanpa tanggal, default dibuka jika mode auto
    return {
      isActive: true,
      mode: 'auto',
      reason: 'running',
      description: 'Live scoreboard aktif.',
    };
  }

  // Dapatkan tanggal hari ini dalam format YYYY-MM-DD (WIB / zona lokal)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const startStr = event.start_date.split('T')[0];
  const endStr = (event.end_date || event.start_date).split('T')[0];

  if (todayStr < startStr) {
    return {
      isActive: false,
      mode: 'auto',
      reason: 'not_started',
      description: 'Kejuaraan belum berjalan. Papan skor akan otomatis dibuka saat kejuaraan resmi dimulai.',
    };
  }

  if (todayStr >= startStr && todayStr <= endStr) {
    return {
      isActive: true,
      mode: 'auto',
      reason: 'running',
      description: 'Kejuaraan sedang berlangsung hari ini.',
    };
  }

  // Setelah tanggal selesai
  return {
    isActive: true,
    mode: 'auto',
    reason: 'finished',
    description: 'Kejuaraan telah selesai. Hasil akhir tetap dapat dilihat.',
  };
}

/**
 * Memeriksa apakah Hasil Lomba / Perangkingan suatu event sedang dibuka atau ditutup untuk publik.
 * Mode:
 * - 'open': Hasil perlombaan resmi dibuka untuk publik (peserta & penonton).
 * - 'closed': Hasil perlombaan ditutup sementara oleh panitia (misal saat proses verifikasi juri / wasit).
 * - 'auto': Otomatis dibuka saat tanggal kejuaraan tiba atau telah selesai.
 */
export function checkEventResultsVisibility(
  event: { start_date?: string | null; end_date?: string | null },
  config?: { resultsMode?: ResultsVisibilityMode | null } | null,
): ResultsVisibilityResult {
  const mode: ResultsVisibilityMode = config?.resultsMode || 'auto';

  // 1. Jika panitia secara manual menutup publikasi hasil lomba
  if (mode === 'closed') {
    return {
      isVisible: false,
      mode: 'closed',
      reason: 'manual_closed',
      description: 'Hasil perlombaan sedang ditutup sementara oleh panitia pelaksana untuk verifikasi & rekapitulasi wasit.',
    };
  }

  // 2. Jika panitia secara manual membuka publikasi hasil lomba
  if (mode === 'open') {
    return {
      isVisible: true,
      mode: 'open',
      reason: 'manual_open',
      description: 'Hasil perlombaan resmi telah dibuka dan dipublikasikan untuk publik.',
    };
  }

  // 3. Mode 'auto' (Sesuai tanggal pelaksanaan kejuaraan)
  if (!event.start_date) {
    return {
      isVisible: true,
      mode: 'auto',
      reason: 'running',
      description: 'Hasil perlombaan aktif.',
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const startStr = event.start_date.split('T')[0];
  const endStr = (event.end_date || event.start_date).split('T')[0];

  if (todayStr < startStr) {
    return {
      isVisible: false,
      mode: 'auto',
      reason: 'not_started',
      description: 'Kejuaraan belum dimulai. Hasil resmi perlombaan akan dipublikasikan setelah nomor lomba berlangsung.',
    };
  }

  if (todayStr >= startStr && todayStr <= endStr) {
    return {
      isVisible: true,
      mode: 'auto',
      reason: 'running',
      description: 'Kejuaraan sedang berlangsung. Hasil nomor lomba diperbarui secara realtime.',
    };
  }

  return {
    isVisible: true,
    mode: 'auto',
    reason: 'finished',
    description: 'Kejuaraan telah selesai. Hasil akhir resmi telah diarsipkan.',
  };
}
