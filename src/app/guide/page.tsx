import { PublicShell } from '@/components/layout/public-shell';
import { BookOpen, UserPlus, LogIn, Trophy, Layers, Waves, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Panduan — SCMS Rajendra Meet',
};

const SECTIONS = [
  {
    icon: UserPlus,
    title: '1. Mendaftar & Masuk',
    body: [
      'Buka /register untuk membuat akun. Isi nama, email, dan password (minimal 6 karakter).',
      'Setelah mendaftar, Anda langsung dapat melihat scoreboard dan menginput data sendiri.',
      'Sudah punya akun? Cukup masuk di /login.',
    ],
  },
  {
    icon: Waves,
    title: '2. Kelompok Umur (KU) Otomatis',
    body: [
      'KU dihitung otomatis dari tanggal lahir (bulan & tahun), bukan diketik manual.',
      'Aturannya dapat diubah panitia lewat Pengaturan Sistem — misalnya KU 1 = kelahiran 2008 ke atas.',
      'Contoh: atlet lahir 11 Juni 2008 dengan batas KU 1 = 2008-12-31 akan masuk KU 1.',
      'Setelah mengubah batas, panitia menjalankan hitung ulang agar seluruh atlet tersusun ulang.',
    ],
  },
  {
    icon: Layers,
    title: '3. Pembagian Heat (Auto-Heat Generator)',
    body: [
      'Buka menu Heats, pilih event dan nomor lomba, lalu klik Generate Heat Otomatis.',
      'Peserta tercepat ditempatkan di heat terakhir; lintasan menggunakan pola tengah-ke-luar (standar FINA).',
      'Heat hanya membagi jalannya lomba. Peringkat dihitung lintas heat pada nomor lomba yang sama.',
    ],
  },
  {
    icon: Clock,
    title: '4. Input Hasil Lomba',
    body: [
      'Buka menu Results, pilih event & nomor lomba, lalu isi waktu tiap lintasan (format 28.45 atau 01:05.12).',
      'Untuk status khusus pilih DNS (tidak start), DNF (tidak finish), atau DSQ (didiskualifikasi).',
      'Hasil tersimpan langsung dan tampil realtime di halaman scoreboard publik.',
      'Dead heat (waktu sama) berbagi peringkat; peringkat berikutnya melompat sesuai jumlah yang seri.',
    ],
  },
  {
    icon: Trophy,
    title: '5. Scoreboard & Peringkat',
    body: [
      'Halaman /scoreboard menampilkan seluruh kejuaraan. Pilih satu kejuaraan, lalu pilih nomor lomba (acara).',
      'Peringkat dihitung otomatis lintas heat berdasarkan waktu tercepat.',
      'Halaman /public-live/[eventId] adalah tautan khusus yang bisa dibagikan ke penonton.',
    ],
  },
];

export default function GuidePage() {
  return (
    <PublicShell
      title="Buku Panduan"
      subtitle="Cara menggunakan SCMS Rajendra Meet: dari mendaftar, menginput data, hingga melihat scoreboard."
    >
      <div className="pub-container space-y-5 pb-16">
        <Link href="/scoreboard" className="pub-btn-ghost inline-flex">
          ← Kembali ke Scoreboard
        </Link>

        {SECTIONS.map((s) => (
          <section key={s.title} className="pub-card p-6">
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

        <div className="pub-card flex flex-col items-center gap-3 bg-[var(--m-aqua-soft)] p-8 text-center">
          <BookOpen className="h-8 w-8 text-[var(--m-aqua-ink)]" />
          <p className="max-w-md text-sm text-[var(--m-ink)]">
            Siap mencoba? Buat akun viewer atau langsung lihat hasil perlombaan yang sedang berlangsung.
          </p>
          <div className="flex gap-2">
            <Link href="/register" className="pub-btn-primary">
              Daftar Sekarang
            </Link>
            <Link href="/scoreboard" className="pub-btn-ghost">
              Lihat Scoreboard
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
