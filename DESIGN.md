# DESIGN SYSTEM: Rajendra SCMS High-End UI/UX
**Design System Version:** 2.0 (Modern Aquatic Glassmorphism)  
**Theme Policy:** Strict Light-Only (No Dark Mode Remnants)  
**Target Quality:** Elite Corporate & Sports Technology Standard

---

## 1. Design Philosophy & Aesthetic Core

Rajendra SCMS mengusung estetika **Modern Aquatic Glassmorphism**:
1. **Translucent & Layered Depth**: Permukaan antarmuka dibangun dengan panel kaca berlapis lembut (`.glass-panel`, `.glass-card`), memberikan rasa lapang dan modern menyerupai air jernih kolam olimpiade.
2. **High-Contrast Legibility**: Di tengah elemen kaca dan aksen air, keterbacaan teks adalah prioritas absolut. Warna teks menggunakan tint tinta gelap berbobot (`--m-ink`), bukan abu-abu pudar.
3. **Restrained Aqua Accents**: Warna biru toska/aqua (`--m-aqua`) diperlakukan sebagai aksen primer untuk fokus tindakan (CTA), lencana aktif, dan indikator progres, bukan membanjiri seluruh latar belakang.
4. **Professional & Noise-Free**: Bebas dari dekorasi berlebih (*no over-engineering*), animasi berisik, atau layout yang mengaburkan data kompetisi penting.

---

## 2. Color Palette & Token Specifications

Berikut adalah token CSS resmi yang didefinisikan dalam `src/app/globals.css`:

```css
:root {
  /* Aquatic Brand Accents */
  --m-aqua: #0284c7;            /* Sky/Cyan 600 - Primary Brand Accent */
  --m-aqua-ink: #0369a1;        /* Deep Aquatic Navy - Hover & Text Accent */
  --m-aqua-soft: #e0f2fe;       /* Sky 100 - Badges & Soft Highlight Background */
  --m-aqua-light: #f0f9ff;      /* Sky 50 - Card Highlight Glow */

  /* Neutral & Ink Foundation */
  --m-ink: #0f172a;             /* Slate 900 - High Contrast Body & Title */
  --m-muted: #64748b;           /* Slate 500 - Secondary Metadata & Labels */
  --m-border: #e2e8f0;          /* Slate 200 - Micro-border & Dividers */
  --m-surface: #ffffff;         /* Pure Surface */
  --m-surface-glass: rgba(255, 255, 255, 0.85); /* Semi-translucent Panel Glass */

  /* Functional Status Colors */
  --m-success: #10b981;         /* Emerald - Lunas / Selesai / Rekor */
  --m-warning: #f59e0b;         /* Amber - Menunggu / Pending */
  --m-danger: #ef4444;          /* Rose - Belum Bayar / Diskualifikasi (DQ) */
  --m-gold: #f59e0b;            /* Juara 1 / Emas */
  --m-silver: #94a3b8;          /* Juara 2 / Perak */
  --m-bronze: #d97706;          /* Juara 3 / Perunggu */

  /* Elevation Shadows */
  --shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
  --shadow-pop: 0 10px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.08);
}
```

---

## 3. Typography Hierarchy

Menggunakan font sistem sans-serif modern (Inter / Geist / Segoe UI):
- **Page Titles (H1)**: `text-2xl font-black text-[var(--m-ink)] tracking-tight` (desktop: `text-3xl`).
- **Section Headers (H2)**: `text-lg font-bold text-[var(--m-ink)]` (desktop: `text-xl`).
- **Card Titles (H3)**: `text-base font-bold text-[var(--m-ink)] leading-snug`.
- **Body Text**: `text-sm font-normal text-slate-700 leading-relaxed`.
- **Metadata / Subtitles / Badges**: `text-xs font-medium text-[var(--m-muted)]`.
- **Micro-labels / Timestamps**: `text-[11px] font-semibold tracking-wide uppercase`.
- **Numeric / Timing**: `tabular-nums font-mono font-bold` untuk stopwatch, seed time, poin, dan peringkat.

---

## 4. Component Standards

### A. Glass Panels & Cards
```tsx
// Container panel utama
<div className="glass-panel elevated p-6 rounded-2xl space-y-4">
  {/* Content */}
</div>

// Interactive Card
<div className="rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-sm hover:shadow-pop hover:-translate-y-0.5 transition-ui">
  {/* Card Body */}
</div>
```

### B. Loading Screens & Micro-Spinners
- **Route / Page Loading**: Wajib menggunakan `<BrandedLoading text="..." />` yang menampilkan logo tajam `/brand/logo.png`. Dilarang menggunakan backdrop-blur yang mengaburkan logo.
- **Button / Inline Loading**: Wajib menggunakan `<BrandedSpinner className="h-4 w-4" />`. Dilarang menampilkan teks *"Memuat..."* berulang-ulang di dalam tombol saat proses penyimpanan.

### C. State Kosong (Empty States)
Semua tabel atau daftar data tanpa entri wajib menampilkan komponen `<EmptyState>` dari `@/components/ui/empty-state`:
```tsx
<EmptyState
  icon={<Waves className="h-8 w-8 text-primary" />}
  title="Belum Ada Nomor Lomba"
  description="Nomor lomba untuk sesi ini belum ditambahkan oleh panitia."
  action={
    <Button onClick={handleAdd}>Tambah Nomor Lomba</Button>
  }
/>
```

### D. Input Form & Fields
Gunakan kelas `pub-field` yang sudah dioptimalkan:
- `rounded-xl border border-[var(--m-border)] bg-white px-3.5 py-2 text-sm text-[var(--m-ink)] focus:border-[var(--m-aqua)] focus:ring-2 focus:ring-[var(--m-aqua-soft)] transition-all outline-none`
- Label di atas field: `text-xs font-semibold text-[var(--m-ink)] mb-1.5 block`
- Helper text / error: `text-xs text-[var(--m-muted)] mt-1` (atau merah untuk error).

### E. Tables & Data Grids
- Selalu bungkus dalam container berkas `overflow-x-auto rounded-xl border border-[var(--m-border)] bg-white`.
- Header tabel: `bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4 border-b border-slate-200`.
- Baris tabel: `text-sm text-[var(--m-ink)] hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0`.
- Kolom angka/waktu/biaya harus rata kanan (`text-right tabular-nums`).

---

## 5. Responsive & Layout Rules

1. **Mobile First Stability**:
   - Touch targets minimal 44x44 px untuk semua tombol di layar seluler.
   - Gunakan layout grid adaptif: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
   - Hindari teks overflow dengan `truncate` atau `break-words`.
2. **Navigation Shell Consistency**:
   - Seluruh drawer seluler menggunakan `LandingDrawer` terpadu dengan grouping *Menu* dan *Akun*.
   - Breadcrumb wajib terpasang di atas judul modul (`Dasbor / Kejuaraan / Detail`).
3. **Print Layout Rules**:
   - Selalu pasang `@media print` terisolasi.
   - Sembunyikan sidebar, header navigasi, floating buttons, dan pagination saat dicetak (`print:hidden`).
   - Warna latar belakang cetak dipaksa putih murni (`bg-white`) dan batas teks hitam pekat untuk menghemat tinta printer kasir/panitia.

---

## 6. Strict Do's and Don'ts

| DO | DON'T |
| :--- | :--- |
| Pertahankan tema *Light-only* yang bersih dan cerah. | Jangan tambahkan kelas `dark:` atau toggle dark mode yang rusak. |
| Gunakan logo resmi `/brand/logo.png` untuk identitas dan loading. | Jangan gunakan logo SVG mentah yang buram atau placeholder aneh. |
| Gunakan komponen toast elegan untuk konfirmasi aksi. | Jangan gunakan `window.alert()` atau modal konfirmasi bawaan browser. |
| Pastikan semua form tombol memiliki status disable saat submit. | Jangan biarkan form dapat diklik berkali-kali (*double submit*). |
| Jalankan `npm run test` dan `npm run build` sebelum menyelesaikan tugas. | Jangan serahkan kode dengan error linting, type mismatch, atau broken routes. |
