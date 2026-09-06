# Komponen Loading & Spinner

- `BrandedLoading` pakai `public/brand/logo.png` untuk route loading screen.
- `BrandedSpinner` pakai `public/brand/logo.png` untuk inline loading kecil.
- Jangan gunakan logo lain untuk loading; jika perlu teks, minimal seperti `…`.

## Migrasi cepat

```tsx
// sebelum
<span className="spinner" />
<p>Memuat...</p>

// sesudah
import { BrandedLoading } from '@/components/branded-loading';
import { BrandedSpinner } from '@/components/branded-spinner';

<BrandedSpinner className="h-4 w-4" />
<BrandedLoading text="Menyimpan..." />
```
- File: `src/components/branded-loading.tsx`
- Contoh pakai:
  - `src/app/loading.tsx`
  - `src/app/dashboard-viewer/loading.tsx`
  - `src/app/(dashboard)/loading.tsx`

Aturan:
- Jangan tambahkan teks "Memuat..." lagi.
- Jangan gunakan `backdrop-blur` di loading screen route.
- Logo tetap tajam, tanpa blur.

### BrandedSpinner
- Pakai untuk loading state di dalam form/button.
- File: `src/components/branded-loading.tsx`
- Contoh pakai:
  - `src/components/modules/registration-wizard.tsx`
  - `src/components/modules/result-input-operator.tsx`
  - `src/components/modules/athlete-manager.tsx`

Aturan:
- Saat loading, tombol hanya menampilkan `BrandedSpinner`, bukan teks loading berulang.
- Ukuran default: `h-6 w-auto`; untuk compact button pakai `h-4 w-4`.

### NavigationLoading
- Pakai untuk transisi route.
- File: `src/components/navigation-loading.tsx`
- Aturan:
  - Overlay transisi ~420ms
  - Tanpa blur, tanpa logo besar; cukup `BrandedSpinner`

## Pola visual
- Theme: light-only
- Card default: `rounded-2xl border border-[var(--m-border)] bg-[var(--m-surface)] shadow-[var(--shadow-card)]`
- Field default pakai class `pub-field` dari `globals.css`
- Hindari class `dark:` karena dark mode sudah dihapus

## Contoh migrate loading form
- Ganti:
  - `{saving ? 'Menyimpan...' : 'Simpan'}`
- Jadi:
  - `{saving ? <BrandedSpinner className="h-4 w-4" /> : null}`
  - `Simpan`
