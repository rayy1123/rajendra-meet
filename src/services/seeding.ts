export interface RegistrationSeed {
  registration_id: string;
  seed_time_ms: number; // 0 jika "No Time" / NT
}

export interface GeneratedLane {
  registration_id: string;
  lane_number: number;
}

export interface GeneratedHeat {
  heat_number: number;
  assignments: GeneratedLane[];
}

/**
 * Mendapatkan urutan prioritas lane dari tengah ke pinggir
 */
export function getLaneOrder(laneCount: number): number[] {
  switch (laneCount) {
    case 6:
      return [3, 4, 2, 5, 1, 6];
    case 10:
      return [5, 6, 4, 7, 3, 8, 2, 9, 1, 10];
    case 8:
    default:
      return [4, 5, 3, 6, 2, 7, 1, 8];
  }
}

/**
 * Membagi peserta ke dalam Heat dan Lane
 * Peserta tercepat berada di Heat terakhir dan Lane tengah
 */
export function generateHeats(
  registrations: RegistrationSeed[],
  laneCount: number = 8
): GeneratedHeat[] {
  if (!registrations || registrations.length === 0) return [];

  // 1. Urutkan atlet: yang punya seed time tercepat di atas, yang NT (0) paling bawah
  const sorted = [...registrations].sort((a, b) => {
    if (a.seed_time_ms === 0) return 1;
    if (b.seed_time_ms === 0) return -1;
    return a.seed_time_ms - b.seed_time_ms;
  });

  const totalAthletes = sorted.length;
  const totalHeats = Math.ceil(totalAthletes / laneCount);
  const laneOrder = getLaneOrder(laneCount);

  // 2. Bagi dari heat paling lambat (Heat 1) ke heat paling cepat (Heat Terakhir)
  const heats: GeneratedHeat[] = [];
  
  for (let h = 0; h < totalHeats; h++) {
    // Ambil potongan atlet untuk heat ini
    const startIdx = h * laneCount;
    const endIdx = Math.min(startIdx + laneCount, totalAthletes);
    const heatAthletes = sorted.slice(startIdx, endIdx);

    // Tetapkan lane berdasarkan urutan prioritas lane
    const assignments: GeneratedLane[] = heatAthletes.map((reg, idx) => ({
      registration_id: reg.registration_id,
      lane_number: laneOrder[idx],
    }));

    heats.push({
      heat_number: h + 1,
      assignments,
    });
  }

  return heats;
}