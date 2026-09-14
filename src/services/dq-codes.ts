/**
 * Kamus Resmi Kode Diskualifikasi (Disqualification / DQ Codes)
 * Standar World Aquatics / PB Akuatik Indonesia (PRSI)
 *
 * Digunakan oleh Referee, Starter, dan Stroke/Turn Judges
 * untuk mencatat alasan diskualifikasi yang sah sesuai buku peraturan FINA.
 */

export interface DqCodeDefinition {
  code: string;       // Contoh: 'SW 4.4'
  ruleName: string;   // Nama aturan ringkas
  descId: string;     // Penjelasan dalam Bahasa Indonesia
  descEn: string;     // Penjelasan dalam Bahasa Inggris
  category: 'START' | 'FREE' | 'BACK' | 'BREAST' | 'FLY' | 'IM' | 'RELAY' | 'GENERAL';
}

export const OFFICIAL_DQ_CODES: DqCodeDefinition[] = [
  // 1. START RULES
  {
    code: 'SW 4.4',
    ruleName: 'False Start',
    descId: 'Mendahului aba-aba start / bergerak sebelum sinyal start berbunyi',
    descEn: 'Starting before the starting signal has been given',
    category: 'START',
  },

  // 2. GAYA PUNGGUNG (BACKSTROKE)
  {
    code: 'SW 6.2',
    ruleName: 'Backstroke Body Position',
    descId: 'Tubuh tidak dalam posisi telentang selama perlombaan (kecuali saat pembalikan)',
    descEn: 'Past vertical towards breast other than executing a continuous turning action',
    category: 'BACK',
  },
  {
    code: 'SW 6.3',
    ruleName: '15m Underwater Backstroke',
    descId: 'Kepala belum memecah permukaan air sebelum batas 15 meter setelah start atau pembalikan',
    descEn: 'Head did not break surface of water at or before 15m mark',
    category: 'BACK',
  },
  {
    code: 'SW 6.4',
    ruleName: 'Backstroke Turn',
    descId: 'Gerakan pembalikan tidak berkesinambungan atau tidak menyentuh dinding',
    descEn: 'Not continuous turning action or did not touch wall with body during turn',
    category: 'BACK',
  },
  {
    code: 'SW 6.5',
    ruleName: 'Backstroke Finish',
    descId: 'Tubuh tidak dalam posisi telentang saat menyentuh dinding finish',
    descEn: 'Body not on back upon finish touch',
    category: 'BACK',
  },

  // 3. GAYA DADA (BREASTSTROKE)
  {
    code: 'SW 7.1',
    ruleName: 'Breaststroke Kick after Start/Turn',
    descId: 'Lebih dari satu kayuhan lengan penuh ke bawah atau lebih dari satu tendangan lumba-lumba',
    descEn: 'More than one butterfly kick or arm pull beyond the hipline after start/turn',
    category: 'BREAST',
  },
  {
    code: 'SW 7.2',
    ruleName: 'Breaststroke Stroke Cycle',
    descId: 'Siklus kayuhan tidak satu kayuhan lengan dan satu tendangan kaki',
    descEn: 'Stroke cycle not one arm stroke and one leg kick in that order',
    category: 'BREAST',
  },
  {
    code: 'SW 7.4',
    ruleName: 'Illegal Breaststroke Kick',
    descId: 'Tendangan kaki gunting, flutter (gaya bebas), atau lumba-lumba ke bawah yang tidak sah',
    descEn: 'Alternating movements or downward butterfly kick not allowed',
    category: 'BREAST',
  },
  {
    code: 'SW 7.6',
    ruleName: 'Breaststroke Turn/Finish Touch',
    descId: 'Sentuhan tangan pada pembalikan atau finish tidak bersamaan dengan kedua tangan',
    descEn: 'Did not touch with both hands simultaneously and separated at turn or finish',
    category: 'BREAST',
  },

  // 4. GAYA KUPU-KUPU (BUTTERFLY)
  {
    code: 'SW 8.2',
    ruleName: 'Butterfly Arm Recovery',
    descId: 'Kedua lengan tidak diayunkan ke depan secara serempak di atas permukaan air',
    descEn: 'Arms not brought forward together over the water simultaneously',
    category: 'FLY',
  },
  {
    code: 'SW 8.3',
    ruleName: 'Butterfly Leg Movement',
    descId: 'Gerakan kaki bergantian / tidak bersamaan (gerakan gaya dada/bebas)',
    descEn: 'Alternating movement of the feet or breaststroke kicking movement',
    category: 'FLY',
  },
  {
    code: 'SW 8.4',
    ruleName: 'Butterfly Turn/Finish Touch',
    descId: 'Sentuhan pada pembalikan/finish tidak bersamaan dengan kedua belah tangan',
    descEn: 'Did not touch with both hands simultaneously at turn or finish',
    category: 'FLY',
  },
  {
    code: 'SW 8.5',
    ruleName: '15m Underwater Butterfly',
    descId: 'Kepala belum memecah permukaan air pada batas 15 meter setelah start atau pembalikan',
    descEn: 'Head did not break surface at 15m mark following start or turn',
    category: 'FLY',
  },

  // 5. GAYA GANTI (INDIVIDUAL MEDLEY)
  {
    code: 'SW 9.1',
    ruleName: 'Medley Stroke Order',
    descId: 'Urutan gaya salah (Kupu-kupu, Punggung, Dada, Bebas)',
    descEn: 'Incorrect order of strokes for Individual Medley (Fly, Back, Breast, Free)',
    category: 'IM',
  },
  {
    code: 'SW 9.3',
    ruleName: 'Medley Freestyle Leg',
    descId: 'Berenang dengan gaya selain gaya dada, punggung, atau kupu-kupu pada segmen gaya bebas',
    descEn: 'Stroke other than front crawl used in freestyle leg of medley',
    category: 'IM',
  },

  // 6. GENERAL RACE RULES
  {
    code: 'SW 10.2',
    ruleName: 'Distance Completion',
    descId: 'Tidak menyelesaikan jarak tempuh perlombaan secara penuh',
    descEn: 'Did not cover the whole distance of the race',
    category: 'GENERAL',
  },
  {
    code: 'SW 10.5',
    ruleName: 'Walking or Standing on Bottom',
    descId: 'Berjalan atau melangkah di dasar kolam untuk memajukan diri',
    descEn: 'Walking on or pushing off the bottom of the pool to propel forward',
    category: 'GENERAL',
  },
  {
    code: 'SW 10.6',
    ruleName: 'Pulling Lane Rope',
    descId: 'Menarik tali lintasan (lane rope) untuk membantu laju renang',
    descEn: 'Pulling on the lane rope to assist speed or progress',
    category: 'GENERAL',
  },
  {
    code: 'SW 10.7',
    ruleName: 'Obstruction',
    descId: 'Menyeberang ke lintasan lain atau menghalangi/mengganggu perenang lain',
    descEn: 'Entering another lane or obstructing another competitor',
    category: 'GENERAL',
  },
  {
    code: 'SW 10.8',
    ruleName: 'Illegal Device / Tape',
    descId: 'Menggunakan peralatan pendorong tidak sah (sirip, hand paddles, atau tape kinesio berlebih)',
    descEn: 'Using pacing device, swimwear violation, or unauthorized tape',
    category: 'GENERAL',
  },
  {
    code: 'SW 10.12',
    ruleName: 'Early Relay Takeoff',
    descId: 'Kaki perenang berikutnya telah lepas landas sebelum perenang sebelumnya menyentuh dinding',
    descEn: 'Feet lost touch with block before preceding swimmer touched the wall',
    category: 'RELAY',
  },
];

/**
 * Mencari definisi DQ berdasarkan kode (misal: 'SW 4.4')
 */
export function getDqCodeDefinition(code: string | null | undefined): DqCodeDefinition | null {
  if (!code) return null;
  const cleanCode = code.toUpperCase().trim();
  return OFFICIAL_DQ_CODES.find((c) => c.code === cleanCode) || null;
}

/**
 * Format string tampilan DQ lengkap untuk lembar hasil resmi
 * Contoh: "DQ (SW 4.4 - False Start)"
 */
export function formatOfficialDqText(code: string | null | undefined): string {
  if (!code) return 'DQ';
  const def = getDqCodeDefinition(code);
  if (!def) return `DQ (${code})`;
  return `DQ (${def.code} - ${def.ruleName})`;
}
