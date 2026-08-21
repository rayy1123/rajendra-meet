import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  BookOpen,
  Layers,
  Trophy,
  CreditCard,
  ShieldCheck,
  Users,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  {
    icon: Users,
    title: '1. Kelola Atlet & Sekolah',
    body: [
      'Buka menu Atlet untuk menambah/mengedit peserta. KU (kelompok umur) dihitung otomatis dari tanggal lahir.',
      'Pastikan setiap atlet terikat ke Sekolah / Klub agar klasemen medali per sekolah muncul.',
      'Atlet didaftarkan ke nomor lomba lewat menu Pendaftaran (atau oleh peserta sendiri di /daftar-lomba).',
    ],
  },
  {
    icon: Layers,
    title: '2. Generate Heat & Lane',
    body: [
      'Buka Acara & Heat, pilih event dan nomor lomba, lalu klik Generate Acara Otomatis.',
      'Peserta tercepat ditempatkan di heat terakhir; lintasan menggunakan pola tengah-ke-luar (standar FINA).',
      'Cek pembagian lintasan di menu Heat & Lane — perbaiki manual bila perlu sebelum lomba dimulai.',
    ],
  },
  {
    icon: Trophy,
    title: '3. Input Hasil Lomba',
    body: [
      'Buka Input Hasil, pilih event & nomor lomba, lalu isi waktu tiap lintasan (format 28.45 atau 01:05.12).',
      'Status khusus: DNS (tidak start), DNF (tidak finish), DSQ (didiskualifikasi).',
      'Hasil tersimpan langsung dan tampil realtime di scoreboard publik maupun Live Scoreboard.',
      'Dead heat (waktu sama) berbagi peringkat; peringkat berikutnya melompat sesuai jumlah yang seri.',
    ],
  },
  {
    icon: CreditCard,
    title: '4. Verifikasi Pembayaran',
    body: [
      'Buka Verifikasi Pembayaran untuk melihat pendaftaran yang menunggu bukti bayar.',
      'Klik "Verifikasi" bila bukti valid, atau "Tolak" bila tidak sesuai — status otomatis terupdate.',
      'Hanya panitia dengan otoritas yang dapat memverifikasi; seluruh aksi tercatat di Log Audit.',
    ],
  },
  {
    icon: ShieldCheck,
    title: '5. Audit & Keamanan',
    body: [
      'Setiap aksi kritis (verifikasi, penolakan, perubahan pengaturan) dicatat di Log Audit.',
      'Gunakan Pengaturan hanya bila perlu mengubah aturan KU, poin, atau tie-break.',
      'Jangan bagikan akun Super Admin; buat akun panitia/operator terpisah untuk operasional harian.',
    ],
  },
  {
    icon: Printer,
    title: '6. Cetak & Ekspor',
    body: [
      'Sertifikat juara 1–3 dapat dicetak langsung per nomor lomba (tombol Cetak → simpan PDF).',
      'Buku Acara (daftar heat & lintasan) tersedia di halaman publik /program untuk dibagikan ke official.',
      'Cetak & Ekspor digunakan untuk mengunduh seluruh hasil dalam format spreadsheet.',
    ],
  },
];

export default function PanduanAdminPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Panduan' }]} className="mb-4" />
      <PageHeader
        title="Panduan Operasional Panitia"
        description="Panduan teknis untuk pengelola kejuaraan: atlet, heat, input hasil, verifikasi pembayaran, hingga audit. Halaman ini hanya untuk akun yang masuk."
      />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-[var(--m-ink)]">{s.title}</h2>
                  <ul className="space-y-1.5 text-sm text-[var(--m-muted)]">
                    {s.body.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--m-aqua)]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-[var(--m-aqua-soft)] p-8 text-center">
          <BookOpen className="h-8 w-8 text-[var(--m-aqua-ink)]" />
          <p className="max-w-md text-sm text-[var(--m-ink)]">
            Butuh panduan untuk pengunjung & pendaftar? Buka halaman Panduan publik di bawah ini.
          </p>
          <Link href="/guide" className="pub-btn-ghost">
            Lihat Panduan Publik
          </Link>
        </div>
      </div>
    </>
  );
}
