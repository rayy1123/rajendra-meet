import { PublicShell } from '@/components/layout/public-shell';
import {
  BookOpen,
  UserPlus,
  CalendarDays,
  IdCard,
  Radio,
  Award,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Panduan Peserta — Rajendra Swim System',
  description: 'Panduan tata cara pendaftaran akun, pemilihan nomor lomba, pembayaran, hingga pengecekan live scoreboard dan piagam penghargaan.',
};

const USER_GUIDE_SECTIONS = [
  {
    icon: UserPlus,
    title: '1. Pembuatan Akun & Profil Kontingen',
    body: [
      'Buka halaman Pendaftaran Akun (/register) untuk mendaftarkan diri sebagai Pelatih / Kontingen Klub, Sekolah, atau Perorangan (Mandiri).',
      'Lengkapi data Username (Nama Lengkap), email aktif, nomor WhatsApp, serta pilih klub atau kontingen sekolah asal.',
      'Jika nama klub Anda belum terdaftar di database, Anda dapat menambahkan klub baru secara langsung di formulir pendaftaran.',
      'Setelah akun dibuat, Anda dapat langsung masuk melalui halaman /login untuk mengakses dasbor peserta.',
    ],
  },
  {
    icon: CalendarDays,
    title: '2. Pendaftaran Nomor Perlombaan',
    body: [
      'Pilih kejuaraan renang yang sedang membuka pendaftaran pada menu Daftar Nomor Lomba (/daftar-lomba).',
      'Pilih atlet dari daftar atlet binaan Anda atau tambahkan atlet baru dengan mengisi tanggal lahir dan gender secara lengkap.',
      'Sistem secara cerdas akan menyaring nomor lomba yang sesuai dengan Kelompok Umur (KU) dan gender perenang Anda.',
      'Pilih nomor acara yang ingin diikuti (Gaya Bebas, Dada, Punggung, Kupu-kupu, Ganti) dan periksa estimasi rincian biaya pendaftaran.',
    ],
  },
  {
    icon: CreditCard,
    title: '3. Pembayaran & Konfirmasi Transfer',
    body: [
      'Setelah memilih nomor lomba, lakukan pembayaran biaya pendaftaran sesuai total nominal dan kode unik transfer yang tertera.',
      'Unggah foto/struk bukti transfer resmi pada kolom yang disediakan untuk diteruskan ke tim bendahara kejuaraan.',
      'Pantau status tagihan dan invoice resmi kejuaraan Anda pada menu Pendaftaran & Tagihan (/pendaftaran-saya).',
      'Setelah diverifikasi panitia, status pendaftaran Anda akan berubah menjadi "Lunas" dan siap diterbitkan ID Pass.',
    ],
  },
  {
    icon: IdCard,
    title: '4. Kartu Tanda Peserta (ID Pass & Nomor Dada)',
    body: [
      'Buka menu Kartu Peserta (/kartu-peserta) untuk mengunduh atau mencetak kartu ID resmi atlet binaan Anda.',
      'Kartu peserta memuat Nomor Dada Resmi (#Bib Number), kelompok usia (KU), serta jadwal seri heat dan lintasan masing-masing perenang.',
      'Atlet wajib mengenakan ID Pass saat lapor ke meja Call Room (Meja Panggil) minimal 15 menit sebelum nomor acara dimulai.',
    ],
  },
  {
    icon: Radio,
    title: '5. Live Scoreboard & Susunan Acara',
    body: [
      'Pantau jalannya perlombaan secara real-time dari kolam renang atau ponsel melalui menu Live Scoreboard (/scoreboard).',
      'Lihat jadwal susunan acara resmi dan daftar peserta per lintasan melalui menu Buku Acara (/program).',
      'Orang tua dan wali atlet dapat menggunakan fitur pencarian untuk menemukan lintasan lomba atlet binaannya.',
    ],
  },
  {
    icon: Award,
    title: '6. Hasil Lomba, Rekor & Sertifikat Juara',
    body: [
      'Hasil resmi catatan waktu dan peringkat lomba dapat dilihat langsung di menu Hasil Lomba (/rankings) dan Klasemen Medali (/medali).',
      'Daftar pemecahan rekor resmi kejuaraan dapat dipantau melalui menu Rajendra Record (/rajendra-record).',
      'Bagi para perenang juara, piagam dan sertifikat penghargaan resmi ber-QR Code dapat diunduh melalui portal peserta dan diverifikasi keabsahannya di /verifikasi.',
    ],
  },
];

export default function GuidePage() {
  return (
    <PublicShell
      title="Buku Panduan Peserta"
      subtitle="Tata cara lengkap pendaftaran atlet, pemilihan nomor lomba, pembayaran, hingga pemantauan live scoreboard dan unduh sertifikat."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Panduan' },
      ]}
    >
      <div className="pub-container space-y-6 pb-16">
        {/* Banner Selamat Datang */}
        <div className="rounded-3xl border border-[var(--m-border)] bg-gradient-to-r from-[#0f2b5c] via-[#0284c7] to-[#0369a1] p-6 sm:p-8 text-white shadow-sm">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-cyan-100 backdrop-blur-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" /> Panduan Resmi Peserta, Pelatih &amp; Wali
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Panduan Penggunaan Portal Kejuaraan
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed">
              Ikuti 6 langkah mudah di bawah ini untuk mendaftarkan atlet kontingen Anda, memantau nomor lintasan lomba, serta melihat hasil resmi di arena kolam renang.
            </p>
          </div>
        </div>

        {/* Section List Panduan */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {USER_GUIDE_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <section
                key={s.title}
                className="rounded-2xl border border-[var(--m-border)] bg-white p-6 shadow-xs hover:border-[var(--m-aqua)] transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] shadow-2xs">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-[var(--m-ink)] font-heading">
                      {s.title}
                    </h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {s.body.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--m-aqua)]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Call to action card */}
        <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-8 text-center space-y-4 shadow-xs">
          <BookOpen className="h-10 w-10 text-blue-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-blue-950">Siap Mendaftarkan Atlet Anda?</h3>
            <p className="max-w-md mx-auto text-xs text-slate-600">
              Buat akun kontingen klub atau perorangan sekarang dan ikuti kejuaraan renang berstandar resmi.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
            >
              Daftar Akun Peserta &rarr;
            </Link>
            <Link
              href="/scoreboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
            >
              Lihat Live Scoreboard
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
