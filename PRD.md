# PRD: Rajendra Swimming Championship Management System (SCMS)
**Product Version:** 2.0 (High-End Edition)  
**System Architecture:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL)  
**Core Purpose:** Platform manajemen kejuaraan renang komprehensif berstandar akuatik nasional (Aquatic Indonesia/World Aquatics), live broadcast arena scoreboard, dan sistem tata kelola keuangan multi-event.

---

## 1. Product Vision & Value Proposition

Rajendra SCMS dirancang untuk mentransformasi kejuaraan renang konvensional menjadi ekosistem digital **kelas atas (*High-End*)**, menghadirkan pengalaman pengguna (*UI/UX*) paling elegan, cepat, dan intuitif bagi seluruh pemangku kepentingan:
- **Panitia / Meet Director**: Kendali penuh administrasi kejuaraan dari pendaftaran, seeding nomor lomba, cetak buku acara, hingga rekonsiliasi kas dalam satu dasbor terpadu.
- **Operator Lomba / Juri**: Input catatan waktu presisi milidetik, live status lane, dan penentuan juara otomatis.
- **Klub / Kontingen / Pelatih**: Pendaftaran atlet massal via Excel, nomor dada/atlet otomatis, dan tagihan invoice resmi transparan.
- **Penonton / Wali Atlet**: Live scoreboard sub-detik real-time di layar arena & perangkat seluler tanpa perlu me-refresh halaman.

---

## 2. User Roles & Personas

| Role | Tanggung Jawab Utama | Rute Akses Kunci |
| :--- | :--- | :--- |
| **Super Admin / Panitia** | Manajemen kejuaraan, nomor lomba, seeding, buku acara, approval pembayaran, keuangan, kustomisasi logo & sponsor | `/dashboard`, `/events`, `/nomor-lomba`, `/heats`, `/buku-acara`, `/tagihan`, `/report` |
| **Operator Waktu & Juri** | Input hasil catatan waktu, verifikasi diskualifikasi (DQ), monitoring live scoreboard | `/results`, `/scoreboard`, `/heats` |
| **Klub / Pelatih** | Manajemen data atlet klub, pendaftaran nomor lomba per atlet, riwayat tagihan & invoice per event | `/atlet-saya`, `/daftar-lomba`, `/tagihan`, `/kartu-peserta` |
| **Publik / Penonton** | Melihat info jadwal kejuaraan, galeri, susunan acara, live timing board, rekap medali | `/`, `/perlombaan`, `/public-live/[id]`, `/rankings`, `/medali` |

---

## 3. Epics & Functional Specifications

### Epic 1: Elite Visual Identity & Glassmorphism Design System
- **Tujuan**: Memastikan antarmuka konsisten berkelas tinggi, modern, ringan (*light-only*), elegan dengan tema *Modern Aquatic Glassmorphism*.
- **Spesifikasi**:
  - Panel kaca semi-transparan (`.glass-panel`, `.glass-card`) dengan batas ultra-halus (`border-[var(--m-border)]` / `border-white/20`).
  - Hierarki tipografi tegas (Inter/Geist) dengan kontras tinggi (`text-[var(--m-ink)]`, `text-[var(--m-muted)]`).
  - Loading screen & inline button loading menggunakan logo resmi `BrandedLoading` / `BrandedSpinner` (`/brand/logo.png`), tanpa blur dan tanpa teks berulang.
  - State kosong (*Empty State*) ramah pengguna dengan ikon tematik, judul jelas, dan tombol CTA.
  - Kompatibilitas responsif stabil 100% dari smartphone (360px) hingga layar monitor 4K.

### Epic 2: Realtime Live Arena Scoreboard & Public Display
- **Tujuan**: Menampilkan jalannya lomba secara langsung dengan latensi minimal (<1 detik).
- **Spesifikasi**:
  - Event selector utama di posisi strategis atas board.
  - Tampilan heat aktif, nomor lintasan, nama perenang, nama klub/sekolah, catatan waktu live, dan status perenang (Upcoming, Racing, Finished, DQ).
  - Mode layar penuh (*TV Arena Broadcast Mode*) dengan kontras tinggi yang mudah dibaca dari kejauhan kolam renang.
  - Fallback polling adaptif + Supabase Realtime synchronization.

### Epic 3: Meet Management, Heats, Seeding, & Buku Acara
- **Tujuan**: Otomasi teknis kejuaraan renang berstandar resmi.
- **Spesifikasi**:
  - **Manajemen Nomor Lomba (`/nomor-lomba`)**: Input nomor lomba multi-kategori (Gaya Bebas, Dada, Punggung, Kupu-kupu, Ganti; Jarak 25m s/d 1500m; Kelompok Umur & Kategori Kelas).
  - **Seeding Algoritma**: Dukungan seeding berstandar resmi (Heat reguler & Circular Seeding untuk babak final).
  - **Buku Acara Lomba (`/buku-acara`)**: Layout siap cetak A4 yang rapi, mencantumkan lintasan, nama atlet, tahun lahir, nama klub, dan seed time.

### Epic 4: Pendaftaran, Atlet, & Nomor Dada Otomatis
- **Tujuan**: Mempermudah pendaftaran atlet dan meminimalisir kesalahan data manual.
- **Spesifikasi**:
  - Penomoran atlet/nomor dada otomatis berdasarkan urutan pendaftaran/event.
  - Import massal peserta via template Excel (.xlsx).
  - Kartu peserta digital & cetak (`/kartu-peserta`) dengan barcode/QR code dan jadwal nomor lomba masing-masing atlet.
  - Manajemen atlet sekolah dan klub (`/athletes`, `/schools`).

### Epic 5: Manajemen Keuangan, Tagihan Klub, & Invoicing
- **Tujuan**: Transparansi finansial menyeluruh dan efisiensi penagihan klub.
- **Spesifikasi**:
  - **Invoice Resmi Multi-event (`/invoice/[id]`)**: Template invoice berstandar korporat Rajendra Meet dengan rincian biaya per nomor, kode unik transfer, rekening tujuan, dan tanda tangan digital.
  - **Rekap Tagihan Klub (`/tagihan`)**: Tampilan per-klub dengan indikator status pembayaran (Belum Bayar, Menunggu Verifikasi, Lunas) serta opsi cetak rekapitulasi.
  - **Laporan Keuangan Kasir & Pengeluaran (`/report`, `/expenses`)**: Kartu laba bersih, grafik mutasi transaksi, filter periode, dan ekspor instan ke format Excel/CSV.

### Epic 6: Multi-Event Branding, Logo Editor, & Piagam
- **Tujuan**: Memberikan fleksibilitas identitas visual di setiap event kejuaraan.
- **Spesifikasi**:
  - Pengaturan dan pengunggahan logo resmi kejuaraan di `/events`, `/events/[id]`, dan `/perlombaan` via `EventLogoDialog`.
  - Sinkronisasi instan logo ke database Supabase dan store lokal.
  - Penempatan logo otomatis pada header invoice, piagam penghargaan, sertifikat juara (`/sertifikat`), dan live scoreboard.
  - Kelola konten poster, sponsor, dan showcase beranda di `/kelola-beranda`.

---

## 4. Acceptance Criteria & Quality Gates

Setiap pengerjaan pengembangan otomatis oleh agen wajib memenuhi standar berikut:
1. **Zero Build Error**: Wajib lolos `npm run build` dengan kode keluar 0 (*clean compilation*).
2. **100% Test Passing**: Seluruh unit test vitest (124+ pengujian) wajib lulus tanpa kegagalan (`npm run test`).
3. **No Dark Mode Remnants**: Tidak boleh ada styling `dark:` atau background gelap yang bertabrakan dengan desain *light-only glassmorphism*.
4. **Print Layout Safety**: Seluruh halaman berorientasi cetak (Invoice, Buku Acara, Rekap Klub, Laporan Kas) harus terbebas dari elemen navigasi (sidebar/header) saat dicetak (`@media print`).
5. **Responsive Integrity**: Antarmuka desktop dan mobile harus proporsional dan tidak boleh mengalami *layout shift* atau *overflow horizontal*.

---

## 5. Autonomous Agent Execution Matrix

Bagi agen otomatis yang menjalankan pengembangan di Orca:
1. **Langkah 1**: Baca `PRD.md` dan `DESIGN.md` untuk memahami spesifikasi fitur dan standar visual.
2. **Langkah 2**: Periksa status pengujian (`npm test`) dan build (`npm run build`).
3. **Langkah 3**: Kerjakan perbaikan atau penambahan fitur sesuai modul terkait di `src/...`.
4. **Langkah 4**: Verifikasi ulang hasil kompilasi dan test.
5. **Langkah 5**: Berikan rangkuman komprehensif pada catatan walkthrough.
