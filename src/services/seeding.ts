/**
 * Pembagian heat dan lane.
 *
 * Aturan yang diterapkan:
 * 1. Peserta dikelompokkan per `competition_event_id`. Karena satu
 *    competition_event sudah mencakup gaya + jarak + gender + tingkat +
 *    kelas + kelompok umur, peserta dari kategori berbeda TIDAK PERNAH
 *    berada dalam heat yang sama.
 * 2. Peserta tercepat berlomba di HEAT TERAKHIR; heat pertama berisi
 *    peserta paling lambat. Heat yang tidak penuh adalah heat pertama.
 * 3. Di dalam satu heat, seed terbaik menempati lane tengah lalu menyebar
 *    ke tepi (standar perlombaan renang).
 * 4. Peserta tanpa seed time (NT / 0) dianggap paling lambat.
 *
 * Heat hanya mengatur jalannya perlombaan — penentuan juara dihitung
 * lintas heat oleh modul ranking, bukan di sini.
 */

export interface RegistrationSeed {
  registration_id: string;
  /** 0 berarti "No Time" (NT). */
  seed_time_ms: number;
}

export interface GeneratedLane {
  registration_id: string;
  lane_number: number;
}

export interface GeneratedHeat {
  heat_number: number;
  assignments: GeneratedLane[];
}

export interface CategorizedRegistration extends RegistrationSeed {
  competition_event_id: string;
}

export interface GeneratedHeatGroup {
  competition_event_id: string;
  heats: GeneratedHeat[];
}

/**
 * Urutan prioritas lane: seed terbaik di tengah, lalu menyebar ke tepi.
 * Untuk jumlah lane yang tidak baku, urutan dihitung secara umum.
 */
export function getLaneOrder(laneCount: number): number[] {
  switch (laneCount) {
    case 6:
      return [3, 4, 2, 5, 1, 6];
    case 8:
      return [4, 5, 3, 6, 2, 7, 1, 8];
    case 10:
      return [5, 6, 4, 7, 3, 8, 2, 9, 1, 10];
    default:
      return buildLaneOrder(laneCount);
  }
}

/** Pola umum tengah-ke-tepi untuk jumlah lane non-standar. */
function buildLaneOrder(laneCount: number): number[] {
  if (laneCount <= 0) return [];

  const order: number[] = [];
  const center = Math.ceil(laneCount / 2);
  order.push(center);

  for (let offset = 1; order.length < laneCount; offset++) {
    const right = center + offset;
    const left = center - offset;
    if (right <= laneCount) order.push(right);
    if (order.length < laneCount && left >= 1) order.push(left);
  }

  return order;
}

/** Urut dari tercepat ke terlambat; NT (0) selalu di belakang. */
function sortBySeed(registrations: RegistrationSeed[]): RegistrationSeed[] {
  return [...registrations].sort((a, b) => {
    const aNT = a.seed_time_ms <= 0;
    const bNT = b.seed_time_ms <= 0;
    if (aNT && bNT) return 0;
    if (aNT) return 1;
    if (bNT) return -1;
    return a.seed_time_ms - b.seed_time_ms;
  });
}

/**
 * Membagi peserta SATU nomor lomba ke dalam heat dan lane.
 * Pemanggil bertanggung jawab memastikan seluruh registrasi berasal dari
 * competition_event yang sama — gunakan generateHeatsByCategory() bila ragu.
 */
export function generateHeats(
  registrations: RegistrationSeed[],
  laneCount: number = 8
): GeneratedHeat[] {
  if (!registrations || registrations.length === 0) return [];
  if (laneCount <= 0) {
    throw new Error('laneCount harus lebih besar dari 0.');
  }

  const sorted = sortBySeed(registrations);
  const total = sorted.length;
  const totalHeats = Math.ceil(total / laneCount);
  const laneOrder = getLaneOrder(laneCount);

  // Heat 1 berisi peserta paling lambat, heat terakhir peserta tercepat.
  // Bila jumlah peserta tidak habis dibagi, heat pertama-lah yang tidak penuh.
  const slowestFirst = [...sorted].reverse();
  const firstHeatSize = total - (totalHeats - 1) * laneCount;

  const heats: GeneratedHeat[] = [];
  let cursor = 0;

  for (let heatIndex = 0; heatIndex < totalHeats; heatIndex++) {
    const size = heatIndex === 0 ? firstHeatSize : laneCount;
    const slice = slowestFirst.slice(cursor, cursor + size);
    cursor += size;

    // Di dalam heat, seed terbaik mendapat lane tengah.
    const fastestFirst = sortBySeed(slice);
    const assignments: GeneratedLane[] = fastestFirst.map((reg, idx) => ({
      registration_id: reg.registration_id,
      lane_number: laneOrder[idx],
    }));

    heats.push({
      heat_number: heatIndex + 1,
      assignments,
    });
  }

  return heats;
}

/**
 * Membagi heat untuk banyak nomor lomba sekaligus, menjamin peserta dari
 * kategori berbeda tidak pernah tercampur dalam satu heat.
 */
export function generateHeatsByCategory(
  registrations: CategorizedRegistration[],
  laneCount: number = 8
): GeneratedHeatGroup[] {
  if (!registrations || registrations.length === 0) return [];

  const buckets = new Map<string, CategorizedRegistration[]>();
  for (const reg of registrations) {
    const list = buckets.get(reg.competition_event_id);
    if (list) {
      list.push(reg);
    } else {
      buckets.set(reg.competition_event_id, [reg]);
    }
  }

  const groups: GeneratedHeatGroup[] = [];
  for (const [competitionEventId, list] of buckets) {
    groups.push({
      competition_event_id: competitionEventId,
      heats: generateHeats(list, laneCount),
    });
  }

  return groups;
}
