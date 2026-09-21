'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  ListOrdered,
  Users,
  Layers,
  Trophy,
  CreditCard,
  Receipt,
  TrendingDown,
  BarChart3,
  Image,
  Printer,
  Award,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookmarkCheck,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  Radio
} from 'lucide-react';

interface ActionStep {
  step: number;
  title: string;
  href: string;
  badge: string;
  description: string;
  actionItems: string[];
}

interface GuideCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  steps: ActionStep[];
}

const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: 'persiapan',
    label: '1. Persiapan & Nomor Lomba',
    icon: CalendarDays,
    color: 'from-blue-600 to-indigo-600',
    steps: [
      {
        step: 1,
        title: 'Buat & Atur Kejuaraan Baru',
        href: '/events/new',
        badge: 'Langkah Awal',
        description: 'Mendaftarkan event kejuaraan baru, menentukan tanggal pelaksanaan, kolam, dan konfigurasi biaya.',
        actionItems: [
          'Buka menu Kejuaraan / Events -> Tambah Kejuaraan.',
          'Isi Nama Event, Tanggal Pelaksanaan, dan Lokasi Kolam Renang.',
          'Atur Jumlah Lintasan (6, 8, atau 10 lintasan).',
          'Tentukan Biaya Pendaftaran per nomor lomba dan Rekening Bank Panitia.',
          'Upload logo kejuaraan dan klik Simpan.',
        ],
      },
      {
        step: 2,
        title: 'Manajemen Nomor Lomba (Acara)',
        href: '/nomor-lomba',
        badge: 'Paling Krusial',
        description: 'Menyusun seluruh nomor perlombaan renang berdasarkan gaya, jarak, gender, dan kelompok usia/kelas.',
        actionItems: [
          'Buka menu Acara & Hasil Lomba -> Nomor Lomba.',
          'Pilih kejuaraan aktif pada dropdown pemilih event.',
          'Klik tombol "Create +" untuk menambah nomor lomba satu per satu.',
          'Atau klik "Import" untuk mengunggah daftar nomor lomba sekaligus dari file Excel.',
          'Pastikan kode nomor (e.g. HSS101), gaya renang, jarak, gender, dan kuota sudah tepat.',
        ],
      },
      {
        step: 3,
        title: 'Master Sekolah, Klub & Kontingen',
        href: '/schools',
        badge: 'Data Kontingen',
        description: 'Mendaftarkan klub renang, sekolah, atau kontingen yang akan berpartisipasi.',
        actionItems: [
          'Buka menu Kejuaraan & Dokumen -> Sekolah & Klub.',
          'Tambahkan nama klub/cabang (contoh: Cabang Bulungan, Cabang Beji, Harahap SC).',
          'Isi kota/kabupaten dan nama pelatih/official penanggung jawab.',
        ],
      },
      {
        step: 4,
        title: 'Pendaftaran Peserta & Import Excel',
        href: '/perlombaan',
        badge: 'Registrasi Atlet',
        description: 'Mendaftarkan atlet peserta ke kejuaraan secara manual atau impor berkas Excel massal.',
        actionItems: [
          'Buka menu Kejuaraan & Dokumen -> Daftar Perlombaan.',
          'Pada kartu kejuaraan, klik "Daftar Manual" untuk input atlet perorangan.',
          'Atau klik "Import Excel" untuk upload ratusan atlet sekaligus dari berkas Excel pendaftaran klub.',
          'Pantau keterisian kuota atlet pada kartu event (contoh: 33 / 999 peserta).',
        ],
      },
    ],
  },
  {
    id: 'lomba',
    label: '2. Pelaksanaan Lomba & Hasil',
    icon: Trophy,
    color: 'from-amber-500 to-orange-600',
    steps: [
      {
        step: 5,
        title: 'Buku Acara & Juknis Handbook',
        href: '/buku-acara',
        badge: 'Dokumen Acara',
        description: 'Menghasilkan buku acara resmi, start list per heat, dan juknis kompetisi.',
        actionItems: [
          'Buka menu Buku Acara untuk melihat susunan nomor acara dari nomor 1 sampai akhir.',
          'Cetak Buku Acara untuk dibagikan kepada wasit, juri, dan pelatih saat Technical Meeting.',
          'Buka menu Juknis Handbook untuk memeriksa regulasi teknis kejuaraan.',
        ],
      },
      {
        step: 6,
        title: 'Seeding Seri (Heat) & Lintasan (Lane)',
        href: '/heats',
        badge: 'Sistem Seeding',
        description: 'Membagi perenang ke dalam heat dan lintasan otomatis sesuai standar World Aquatics.',
        actionItems: [
          'Buka menu Acara & Hasil Lomba -> Heat & Lintasan.',
          'Sistem otomatis membagi peserta: seed tercepat di heat terakhir dan menempati lane tengah.',
          'Cetak Form Pengambil Waktu (Timer Sheet) untuk juri lintasan di kolam.',
        ],
      },
      {
        step: 7,
        title: 'Input Hasil Waktu & Diskualifikasi',
        href: '/results',
        badge: 'Operator Meja',
        description: 'Mencatat waktu tempuh perenang saat lomba berlangsung dan status diskualifikasi.',
        actionItems: [
          'Buka menu Input Hasil Lomba.',
          'Pilih nomor acara yang sedang bertanding di kolam.',
          'Ketikkan catatan waktu perenang (contoh: 28.45 atau 01:05.12).',
          'Bila perenang tidak hadir atau melanggar, pilih status DNS / DNF / DQ.',
          'Hasil otomatis tersinkronisasi ke Live Scoreboard publik dalam hitungan detik.',
        ],
      },
      {
        step: 8,
        title: 'Kontrol Visibilitas Live Scoreboard',
        href: '/events',
        badge: 'Bisa Ditutup',
        description: 'Mengatur agar scoreboard publik hanya bisa dilihat saat kejuaraan sudah berjalan.',
        actionItems: [
          'Buka menu Kejuaraan / Events -> Pilih Event yang diinginkan.',
          'Temukan toggle "Status Live Scoreboard".',
          'Pilih "Tutup Live Scoreboard" jika lomba belum dimulai agar tidak dapat diakses umum.',
          'Pilih "Buka Live Scoreboard" ketika perlombaan resmi dimulai.',
        ],
      },
      {
        step: 9,
        title: 'Perangkingan, Medali & Sertifikat',
        href: '/rankings',
        badge: 'Hasil Akhir',
        description: 'Melihat peringkat juara, klasemen perolehan medali klub, dan mencetak sertifikat penghargaan.',
        actionItems: [
          'Buka menu Perangkingan untuk melihat juara 1, 2, dan 3 per nomor lomba.',
          'Buka Klasemen Medali (/medals) untuk rekapitulasi emas, perak, dan perunggu tiap kontingen.',
          'Buka menu Penghargaan (/awards) untuk melihat perenang terbaik (Best Swimmer).',
          'Buka Sertifikat Juara (/sertifikat) untuk mencetak piagam juara secara massal.',
        ],
      },
    ],
  },
  {
    id: 'keuangan',
    label: '3. Keuangan & Tagihan Klub',
    icon: Receipt,
    color: 'from-emerald-500 to-teal-600',
    steps: [
      {
        step: 10,
        title: 'Rekap Tagihan Klub per Event',
        href: '/tagihan',
        badge: 'Invoice Klub',
        description: 'Memantau seluruh invoice tagihan per klub renang, sisa piutang, dan mencetak rekap tagihan.',
        actionItems: [
          'Buka menu Keuangan & Sistem -> Tagihan Klub.',
          'Filter berdasarkan kejuaraan dan nama klub.',
          'Periksa nomor invoice (INV/CLUB/24/XXXX), qty nomor lomba, total biaya, dan sisa yang belum dibayar.',
          'Klik tombol "Cetak Rekap Tagihan" untuk print rekapitulasi resmi tagihan seluruh klub.',
        ],
      },
      {
        step: 11,
        title: 'Verifikasi Pembayaran Pendaftaran',
        href: '/verifikasi-pembayaran',
        badge: 'Cek Mutasi',
        description: 'Memeriksa bukti transfer pembayaran dari klub atau orang tua peserta.',
        actionItems: [
          'Buka menu Verifikasi Pembayaran.',
          'Periksa nominal transfer dan kecocokan kode unik 3-digit transaksi.',
          'Lihat foto bukti transfer bank.',
          'Klik "Setujui (Verify)" untuk mengonfirmasi bahwa pendaftaran atlet telah sah dan lunas.',
        ],
      },
      {
        step: 12,
        title: 'Catat Pengeluaran Operasional (Expenses)',
        href: '/expenses',
        badge: 'Biaya Acara',
        description: 'Mencatat seluruh biaya pengeluaran kejuaraan renang agar buku kas transparan.',
        actionItems: [
          'Buka menu Keuangan & Sistem -> Pengeluaran (Expenses).',
          'Klik tombol biru "+ Create Expenses".',
          'Pilih Event terkait, Kategori (Honor Juri, Sewa Kolam, Medali/Piala, Konsumsi, Banner, dsb).',
          'Ketikkan nominal rupiah, tanggal, serta deskripsi rincian biaya.',
          'Klik Simpan Pengeluaran.',
        ],
      },
      {
        step: 13,
        title: 'Laporan Keuangan & Ekspor Excel (Report)',
        href: '/report',
        badge: 'Laporan Kas',
        description: 'Melihat perbandingan pemasukan vs pengeluaran, saldo laba bersih, dan ekspor laporan.',
        actionItems: [
          'Buka menu Keuangan & Sistem -> Laporan Keuangan (Report).',
          'Pilih periode: Harian, Bulanan, Tahunan, atau Semua.',
          'Periksa kartu Pemasukan (Hijau), Pengeluaran (Merah), dan Laba Bersih.',
          'Klik "Export to Excel" untuk mengunduh laporan format spreadsheet .xls.',
          'Klik "Print" untuk mencetak laporan kas siap serah terima kepanitiaan.',
        ],
      },
    ],
  },
  {
    id: 'cms',
    label: '4. Tampilan Web & CMS Beranda',
    icon: Image,
    color: 'from-purple-600 to-pink-600',
    steps: [
      {
        step: 14,
        title: 'Kelola Beranda & Poster HD',
        href: '/kelola-beranda',
        badge: 'Landing Page',
        description: 'Memperbarui poster kejuaraan di halaman depan dengan resolusi HD tajam tanpa pecah.',
        actionItems: [
          'Buka menu Kejuaraan & Dokumen -> Kelola Beranda CMS.',
          'Pada tab "Poster", unggah poster flyer kejuaraan resolusi tinggi.',
          'Sistem otomatis menyimpan gambar tanpa kompresi rusak sehingga teks nomor admin & tanggal tetap tajam.',
          'Klik Simpan untuk mempublikasikan langsung ke pengunjung web.',
        ],
      },
      {
        step: 15,
        title: 'Kelola Profil Tentang Kami & 5 Pilar',
        href: '/kelola-beranda',
        badge: 'Branding Rajendra',
        description: 'Mengatur deskripsi Rajendra Swimming Organizer dan 5 pilar keunggulan.',
        actionItems: [
          'Buka menu Kelola Beranda CMS -> Tab "Tentang Kami" & "Pilar".',
          'Sesuaikan foto panitia tim di kolam renang dan teks deskripsi.',
          'Periksa tampilan halaman depan (/) untuk melihat perubahan seketika.',
        ],
      },
    ],
  },
];

export function AdminActionGuide() {
  const [activeCategory, setActiveCategory] = useState('persiapan');
  const [search, setSearch] = useState('');

  const currentCat = GUIDE_CATEGORIES.find((c) => c.id === activeCategory) || GUIDE_CATEGORIES[0];

  const filteredSteps = currentCat.steps.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.actionItems.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header Banner Panduan */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1">
              <Sparkles className="h-3 w-3" /> Panduan Aksi & Operasional Sistem
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Panduan Lengkap Seluruh Aksi Panitia
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Alur kerja terpadu dari pembuatan kejuaraan, nomor lomba, seeding, live score, tagihan klub, hingga laporan keuangan.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aksi panitia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {GUIDE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearch('');
              }}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm font-bold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white bg-gradient-to-br ${cat.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {filteredSteps.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
            Tidak ada aksi yang sesuai dengan pencarian Anda.
          </div>
        ) : (
          filteredSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-black">
                      {step.step}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {step.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Step checklist items */}
                <div className="space-y-1.5 pt-1">
                  {step.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Link Button */}
              <div className="pt-2 border-t border-slate-200/60">
                <Link
                  href={step.href}
                  className="inline-flex items-center justify-between w-full rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition-all group"
                >
                  <span>Buka Halaman: {step.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
