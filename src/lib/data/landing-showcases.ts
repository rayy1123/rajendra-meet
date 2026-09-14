export interface ShowcaseItem {
  id: string;
  type: 'poster' | 'stat' | 'gallery' | 'service' | 'pillar' | 'about' | 'client';
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  value?: string | null;
  orderNo: number;
  isActive: boolean;
}

export const DEFAULT_STATS: ShowcaseItem[] = [
  { id: 'stat-1', type: 'stat', title: 'Peserta', value: '250+', orderNo: 1, isActive: true },
  { id: 'stat-2', type: 'stat', title: 'Team', value: '150+', orderNo: 2, isActive: true },
  { id: 'stat-3', type: 'stat', title: 'Event', value: '100+', orderNo: 3, isActive: true },
];

export const DEFAULT_POSTERS: ShowcaseItem[] = [
  {
    id: 'poster-1',
    type: 'poster',
    title: 'HT HSS S4',
    subtitle: 'Home Tournament Series IV - Harahap Swimming School',
    imageUrl: '/brand/poster-hthss.png',
    linkUrl: '/daftar-lomba',
    orderNo: 1,
    isActive: true,
  },
];

export const DEFAULT_GALLERY: ShowcaseItem[] = [
  { id: 'gal-1', type: 'gallery', title: 'Kolam renang outdoor', imageUrl: '/slider/hero-1.jpg', orderNo: 1, isActive: true },
  { id: 'gal-2', type: 'gallery', title: 'Latihan atlet renang', imageUrl: '/slider/hero-2.jpg', orderNo: 2, isActive: true },
  { id: 'gal-3', type: 'gallery', title: 'Finish sentuh dinding & timer', imageUrl: '/slider/hero-3.jpg', orderNo: 3, isActive: true },
  { id: 'gal-4', type: 'gallery', title: 'Anak-anak berenang ceria', imageUrl: '/slider/hero-4.jpg', orderNo: 4, isActive: true },
];

export const DEFAULT_SERVICES: ShowcaseItem[] = [
  {
    id: 'srv-1',
    type: 'service',
    title: 'IT Event Renang',
    subtitle: 'Jasa manajemen sistem teknologi informasi untuk event renang Anda',
    value: 'Rp 5.000 / nomor peserta',
    imageUrl: 'Tenaga IT; Tenaga Admin Pendaftaran; Tenaga Admin Penginputan Hasil; Print Out Buku Acara; Print Out Form Timer; PDF Rekap Keuangan; PDF Hasil Register',
    linkUrl: 'Jika event diluar Jabodetabek dikenakan biaya Akomodasi dan Transportasi; Penyelenggara wajib menyediakan konsumsi untuk tim berupa 2x Snack dan 2x Makan per hari; Biaya wajib dibayarkan paling lambat 1 pekan sebelum pelaksanaan; Maksimal jam kerja adalah s/d Jam 17.00 per hari',
    orderNo: 1,
    isActive: true,
  },
  {
    id: 'srv-2',
    type: 'service',
    title: 'Paket Gelombang 6 Lintasan',
    subtitle: 'Penyelenggaraan komprehensif untuk arena kolam 6 lintasan',
    value: 'Rp 3.500.000 / sesi',
    imageUrl: 'Tim IT & Operator Lengkap; Sistem Penyusunan Heat Otomatis; Live Scoreboard Real-Time; Formulir Timer & Start List Lengkap; Rekapitulasi Medali & Poin Juara',
    linkUrl: 'Termasuk pendampingan teknis saat technical meeting; Konsumsi dan akomodasi tim di luar Jabodetabek ditanggung panitia; Konfirmasi minimal 1 pekan sebelum acara',
    orderNo: 2,
    isActive: true,
  },
  {
    id: 'srv-3',
    type: 'service',
    title: 'Paket Gelombang 8 Lintasan',
    subtitle: 'Paket standar kejuaraan resmi untuk kolam 8 lintasan',
    value: 'Rp 4.500.000 / sesi',
    imageUrl: 'Tim IT & Operator Berlisensi; Manajemen 8 Lintasan Penuh; Live Scoreboard & Cetak Piagam/Sertifikat; Starter & Technical Support; Ekspor Hasil Lengkap',
    linkUrl: 'Pemesanan slot tanggal paling lambat 2 minggu sebelum event; Pembayaran DP 50% saat konfirmasi jadwal; Konsumsi panitia disediakan penyelenggara',
    orderNo: 3,
    isActive: true,
  },
  {
    id: 'srv-4',
    type: 'service',
    title: 'Paket Gelombang 12 Lintasan',
    subtitle: 'Paket skala besar / kejuaraan terbuka tingkat regional & nasional',
    value: 'Rp 6.000.000 / sesi',
    imageUrl: 'Full Dedicated IT & Operator; Multi-Display Scoreboard System; Buku Acara & Juknis Cetak & Digital; Rekap Rekor Baru (Rajendra Record); Sertifikat QR Code Resmi',
    linkUrl: 'Survey kelayakan fasilitas kolam 1 pekan sebelum hari-H; Kontrak resmi penyelenggaraan MICE olahraga; Pelunasan H-3 pelaksanaan',
    orderNo: 4,
    isActive: true,
  },
];

export const DEFAULT_PILLARS: ShowcaseItem[] = [
  {
    id: 'pil-1',
    type: 'pillar',
    title: 'Tim Profesional & Berdedikasi',
    subtitle: 'Users',
    value: 'Dipromotori oleh individu-individu yang berpengalaman di industri event organizer dan olahraga, tim kami menangani setiap aspek acara Anda mulai dari perencanaan konsep, desain branding kompetisi, hingga eksekusi hari-H dengan standar operasional yang tinggi.',
    orderNo: 1,
    isActive: true,
  },
  {
    id: 'pil-2',
    type: 'pillar',
    title: 'Technical Official Berlisensi',
    subtitle: 'Award',
    value: 'Kredibilitas kompetisi adalah prioritas mutlak. Kami secara eksklusif bekerja sama dengan jajaran technical official yang memiliki lisensi resmi, memastikan setiap perlombaan berjalan adil dan sesuai dengan regulasi standar kejuaraan renang.',
    orderNo: 2,
    isActive: true,
  },
  {
    id: 'pil-3',
    type: 'pillar',
    title: 'Ekosistem Semi Digital yang Efisien',
    subtitle: 'MonitorSmartphone',
    value: 'Tinggalkan cara manual yang rumit. Kami mengimplementasikan sistem manajemen event semi-digital yang terintegrasi. Proses pendaftaran, rekapitulasi, database peserta yang otomatis, penyusunan start list, hingga distribusi hasil perlombaan diproses secara cepat, rapi, dan mudah diakses.',
    orderNo: 3,
    isActive: true,
  },
  {
    id: 'pil-4',
    type: 'pillar',
    title: 'Fleksibel & Menyesuaikan Kebutuhan',
    subtitle: 'Sliders',
    value: 'Tidak ada satu formula untuk semua acara. Kami merancang solusi yang sepenuhnya disesuaikan dengan skala dan tujuan Anda. Baik itu home tournament internal klub, festival renang kelompok umur, maupun sirkuit kompetisi bergengsi, kami menyelaraskan konsep acara dengan visi Anda.',
    orderNo: 4,
    isActive: true,
  },
  {
    id: 'pil-5',
    type: 'pillar',
    title: 'Jangkauan Layanan Seluruh Indonesia',
    subtitle: 'MapPin',
    value: 'Jarak bukan halangan untuk menciptakan kompetisi yang berkualitas. Basis operasional kami siap dimobilisasi untuk melayani dan menyelenggarakan kejuaraan renang di berbagai kolam renang dan fasilitas akuatik di seluruh penjuru Nusantara.',
    orderNo: 5,
    isActive: true,
  },
];

export const DEFAULT_ABOUT: ShowcaseItem = {
  id: 'about-1',
  type: 'about',
  title: 'Tentang Kami',
  subtitle: 'Hadir sejak tahun 2023, Rajendra Swimming Organizer adalah mitra strategis dan terpercaya dalam penyelenggaraan acara olahraga renang di Indonesia. Kami berdedikasi untuk mengangkat standar setiap kompetisi.',
  value: 'Dengan perpaduan antara manajemen event yang solid, pemahaman teknologi, dan kecintaan pada olahraga renang, kami memastikan setiap event berjalan lancar, akurat, dan berkesan bagi atlet, official, maupun penonton.',
  imageUrl: '/slider/about-1.jpg',
  orderNo: 1,
  isActive: true,
};

export const DEFAULT_CLIENTS: ShowcaseItem[] = [
  { id: 'cli-1', type: 'client', title: 'Rafka Printing', imageUrl: '/brand/clients/rafka-printing.png', orderNo: 1, isActive: true },
  { id: 'cli-2', type: 'client', title: 'Alumni Diktukba Polri 2003', imageUrl: '/brand/clients/polri-2003.png', orderNo: 2, isActive: true },
  { id: 'cli-3', type: 'client', title: 'Yayasan Insan Prestasi Indonesia', imageUrl: '/brand/clients/insan-prestasi.png', orderNo: 3, isActive: true },
  { id: 'cli-4', type: 'client', title: 'Harahap Swimming Club', imageUrl: '/brand/clients/harahap-club.png', orderNo: 4, isActive: true },
];

export const SHOWCASES_STORAGE_KEY = 'scms_landing_showcases';

/** Map DB row (snake_case) → ShowcaseItem (camelCase) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRow(row: any): ShowcaseItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? '',
    subtitle: row.subtitle ?? null,
    imageUrl: row.image_url ?? null,
    linkUrl: row.link_url ?? null,
    value: row.value ?? null,
    orderNo: row.order_no ?? 1,
    isActive: row.is_active ?? true,
  };
}

export function getCachedShowcases(type: ShowcaseItem['type']): ShowcaseItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(`${SHOWCASES_STORAGE_KEY}_${type}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

export function saveCachedShowcases(type: ShowcaseItem['type'], items: ShowcaseItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${SHOWCASES_STORAGE_KEY}_${type}`, JSON.stringify(items));
  } catch {}
}

export function getDefaultsByType(type: ShowcaseItem['type']): ShowcaseItem[] {
  switch (type) {
    case 'stat': return DEFAULT_STATS;
    case 'gallery': return DEFAULT_GALLERY;
    case 'poster': return DEFAULT_POSTERS;
    case 'service': return DEFAULT_SERVICES;
    case 'pillar': return DEFAULT_PILLARS;
    case 'about': return [DEFAULT_ABOUT];
    case 'client': return DEFAULT_CLIENTS;
  }
}
