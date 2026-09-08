# UX Research SCMS - Hasil Riset & Rekomendasi
**Tanggal:** 2026-09-08  
**Fokus:** Rute & alur project, kenyamanan pengguna dashboard viewer, konsistensi navigasi  
**Metodologi:** Inspeksi kode aktif + referensi pola UI/UX live scoreboard & dashboard event

---

## 1. Executive Summary
Project SCMS Rajendra Meet saat ini sudah memiliki fondasi yang solid untuk navigasi publik dan dashboard panitia. Fokus utama pengguna adalah menciptakan pengalaman yang "comfortable" bagi penonton/atlet di dashboard viewer dan halaman live/scoreboard, tanpa over-engineering.

---

## 2. Current State Analysis
### Yang sudah baik
- **Navigasi mobile menu konsisten** via `LandingShell`, `PublicShell`, dan `LandingNav`.
- **Login state adaptif**: sudah menampilkan `ProfileMenu` ketika user login, menyembunyikan Masuk/Daftar.
- **Logo plain tanpa rounded**, sesuai identitas Rajendra Project.
- **Light-only theme** diterapkan di seluruh shell.
- **Viewer dashboard** memiliki identitas aquatic yang jelas.

### Yang perlu diperbaiki
- **Header labeling inconsistens** antara publik shell, dashboard layout, dan viewer pages.
- **Live scoreboard belum menonjolkan event selector** sebagai kontrol utama sebelum board.
- **Kepadatan informasi** di viewer dashboard masih bisa diatur agar lebih mudah discan.
- **Typography & spacing** antar shell perlu diseragamkan agar terasa premium.

---

## 3. Reference Patterns
1. **USA Swimming Data Hub (2026 modernisasi)**  
   Navigasi yang jelas, ringkasan performa atlet, akses cepat ke rankings/records, dan Meet Dashboard experience.  
   *Pelajaran:* Berikan ringkasan visual yang kuat di dashboard viewer, akses cepat ke data penting.

2. **Swimnerd Live Scoreboard**  
   Mengutamakan kontrol laptop yang sederhana, tampilan data yang jelas, dan kolom yang mudah dibaca di berbagai perangkat.  
   *Pelajaran:* Prioritaskan kejelasan data live, hindari elemen visual yang tidak perlu, gunakan whitespace untuk memisahkan heat/event.

3. **MoldStud - Live Score UX**  
   Fokus pada prioritas informasi utama, konsistensi screen, dan navigasi yang intuitif.  
   *Pelajaran:* Setiap halaman harus menunjukkan konteks lokasi pengguna (misal breadcrumb atau header context).

---

## 4. Rekomendasi Desain
### A. Viewer Dashboard Comfort
- **Hero ringkas**: Event berikutnya + countdown + tombol "Lihat Detail".
- **Card atlet terdaftar**: nama, kontingen, nomor start, status pembayaran.
- **Medali kontingen**: progress bar kecil, ranking cepat.
- **Quick actions**: Daftar Lomba, Atlet Saya, Jadwal Hari Ini.

### B. Public Live/Scoreboard UX
- Jadikan **event selector** sebagai kontrol utama di bagian atas, bukan tersembunyi.
- Tampilkan **heat aktif** dengan status (upcoming/live/finished) + lane mapping.
- Tambahkan **refresh manual** dan auto-refresh indikator yang tenang.

### C. Mobile Menu Consistency
- Semua shell menggunakan `LandingDrawer` yang sama.
- Bottom sheet untuk mobile dengan grup "Menu" dan "Akun".
- Tombol menu selalu terlihat di mobile.

### D. Header Labeling
- Tambahkan breadcrumb kecil di setiap halaman: `Beranda / Halaman Saat Ini`.
- Viewer dashboard: `Dasbor Penonton / Nama Event`.
- Dashboard panitia: `Dasbor Panitia / Modul`.

### E. Typography & Spacing
- Gunakan `text-sm` untuk metadata, `text-base` untuk body, `text-2xl/3xl` untuk judul.
- Whitespace antar section: `space-y-6` untuk modul, `space-y-4` untuk card.
- Aqua accent hanya untuk CTA dan status aktif, bukan untuk semua elemen.

---

## 5. Prioritized Action List
1. **Live/Scoreboard**: Naikkan event selector menjadi kontrol utama sebelum board.
2. **Viewer Dashboard**: Tambah card event berikutnya + medali kontingen ringkas.
3. **Header Context**: Tambah breadcrumb kecil di `layout.tsx`, `public-shell.tsx`, `landing-shell.tsx`.
4. **Typography**: Standarkan heading sizes antar shell.
5. **Mobile Drawer**: Samakan pattern `LandingDrawer` di semua shell (sudah mulai diterapkan).

---

## 6. Catatan
- Semua perubahan akan tetap mengikuti prinsip light-only, no dark mode.
- Tidak ada over-engineering: fokus pada informasi yang benar-benar dibutuhkan pengguna.
- Build saat ini sudah passing.

---

*Laporan ini disiapkan untuk menjadi dasar implementasi UI/UX lanjutan.*
