import { UserRole } from '@/types/database';

export interface AccountItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  classified_title: string;
  authorities: string[];
  phone?: string | null;
  school_id?: string | null;
  school_name?: string | null;
  status: 'active' | 'suspended' | 'pending';
  last_login?: string | null;
  created_at: string;
  generated_password?: string;
}

export const AUTHORITY_DEFINITIONS = [
  { id: 'results_input', label: 'Input Hasil & Waktu Lomba', group: 'Lomba', description: 'Catat waktu & status DQ per seri' },
  { id: 'scoreboard_live', label: 'Scoreboard & Arena Display', group: 'Lomba', description: 'Live screen & TV broadcast' },
  { id: 'heats_seeding', label: 'Seeding Heats & Seri', group: 'Teknis', description: 'Spearhead & circular seeding' },
  { id: 'nomor_lomba', label: 'Nomor Lomba & Kategori', group: 'Teknis', description: 'Atur nomor acara & kelompok umur' },
  { id: 'buku_acara', label: 'Buku Acara & Start List', group: 'Teknis', description: 'Kompilasi Start List PDF A4' },
  { id: 'juknis_manage', label: 'Juknis Handbook', group: 'Teknis', description: 'Technical handbook & regulasi' },
  { id: 'checklist_teknis', label: 'Checklist Teknis (TD)', group: 'Teknis', description: 'Rekognisi kolam & logistik wasit' },
  { id: 'verifikasi_bayar', label: 'Verifikasi Pembayaran', group: 'Keuangan', description: 'Approval bukti transfer kontingen' },
  { id: 'tagihan_expenses', label: 'Tagihan & Pengeluaran', group: 'Keuangan', description: 'Rekap kas & laporan keuangan' },
  { id: 'sertifikat_manage', label: 'Sertifikat & Piagam', group: 'Prestasi', description: 'Desain piagam juara & 3 logo header' },
  { id: 'registrasi_atlet', label: 'Pendaftaran Atlet & Klub', group: 'Peserta', description: 'Entri massal atlet & nomor dada' },
  { id: 'master_akun', label: 'Master Akun & Otoritas', group: 'Sistem', description: 'Kelola akun panitia & hak akses' },
] as const;

export type AuthorityId = typeof AUTHORITY_DEFINITIONS[number]['id'];
