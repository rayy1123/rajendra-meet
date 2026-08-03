# SCMS — Swimming Competition Management System

Aplikasi web manajemen kejuaraan renang: event, registrasi peserta, pembagian
heat, input hasil, perangkingan otomatis, hingga publikasi hasil realtime.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase

---

## Cara Login

**Login TIDAK memakai `php artisan`.** Aplikasi Laravel lama sudah tidak dipakai;
autentikasi sekarang memakai **Supabase Auth** lewat halaman `/login`.

1. Jalankan `npm run dev`
2. Buka http://localhost:3000/login
3. Masuk dengan akun admin:

   | Email | Password |
   |---|---|
   | `admin@rajendra.id` | `Rajendra#2026` |

> **Ganti password ini setelah login pertama** (menu Pengaturan Sistem, atau
> Supabase Dashboard → Authentication → Users).

### Menambah pengguna baru

Lewat Supabase Dashboard → Authentication → Add user. Setelah user dibuat,
atur perannya di tabel `profiles`:

```sql
update public.profiles set role = 'event_admin' where id = '<user-uuid>';
```

Peran yang tersedia: `super_admin`, `event_admin`, `operator`, `viewer`.

---

## Perintah

```bash
npm run dev        # server pengembangan (webpack)
npm run build      # build produksi (webpack)
npm run test       # unit test (vitest)
npm run lint       # eslint
```

### Kenapa webpack, bukan Turbopack?

Turbopack gagal membuat *junction point* ke `exceljs → unzipper → fstream → rimraf`
di Windows tanpa hak akses symlink, sehingga halaman `/export` error 500 dan
`next build` gagal total. Script `dev:turbo` dan `build:turbo` tetap disediakan
untuk mencoba lagi setelah masalah tersebut teratasi (aktifkan Windows Developer
Mode atau jalankan sebagai Administrator).

---

## Database

Skema dan seluruh perubahannya ada di `supabase/migrations/`, dijalankan berurutan:

| Migrasi | Isi |
|---|---|
| `0000` | Rename tabel Laravel lama menjadi `legacy_*` (tidak menghapus data) |
| `0001` | Skema SCMS: 17 tabel, enum, trigger auto-profile, realtime |
| `0002` | Fungsi resolusi Kelompok Umur |
| `0003` | Row Level Security seluruh tabel |
| `0005` | Konversi data legacy ke skema SCMS |
| `0006` | Seed default: aturan KU dan tabel poin |
| `0007` | Kunci tabel `legacy_*` dan tabel Laravel (default-deny) |
| `0008` | Akun admin pertama |
| `0011` | Perbaikan kolom token `auth.users` |

Menerapkan migrasi:

```bash
npx supabase db push
```

### Kelompok Umur (KU) — dapat diatur panitia

KU **tidak di-hardcode**. Aturannya ada di tabel `age_group_rules`, memakai
rentang tanggal lahir inklusif sehingga bulan dan tahun ikut diperhitungkan:

```
KU 1 = kelahiran 2008 ke atas  →  birth_date_from = NULL, birth_date_to = '2008-12-31'
```

Atlet lahir 11 Juni 2008 → masuk KU 1. Bila panitia menggeser batas, cukup ubah
tanggalnya lalu hitung ulang seluruh atlet:

```sql
select public.reapply_age_groups('<event-id>');
```

`birth_date_from = NULL` berarti tanpa batas bawah (KU tertua), `birth_date_to = NULL`
tanpa batas atas (KU termuda). Kolom `gender` opsional bila KU putra dan putri
perlu batas berbeda. Aturan disimpan per event.

Tabel poin (`point_rules`) juga dapat diubah panitia dengan cara yang sama.

---

## Keamanan

Aplikasi hanya memakai **anon key**, jadi seluruh otorisasi bergantung pada
**Row Level Security** di Postgres — bukan pada UI. Data pertandingan dapat
dibaca publik; semua operasi tulis memerlukan login dengan peran yang sesuai.

Tabel `legacy_*` dan tabel bawaan Laravel (`users`, `sessions`, dll.) dikunci
default-deny: hanya `service_role` yang dapat mengaksesnya.

---

## Struktur

```
src/
  app/
    (dashboard)/        halaman dashboard (butuh login)
    login/              halaman masuk
    public-live/        hasil live, dapat diakses publik
  components/
    layout/             sidebar & shell dashboard
    modules/            komponen fitur
    ui/                 shadcn/ui
  services/             logika inti (murni, ber-unit test)
  lib/supabase/         klien Supabase (browser & server)
  proxy.ts              middleware autentikasi
supabase/migrations/    skema database
```

### Logika inti

Seluruh aturan pertandingan ditulis sebagai *pure function* ber-test di
`src/services/` agar dapat diverifikasi tanpa database:

- `age-group.ts` — resolusi KU dari tanggal lahir
- `seeding.ts` — pembagian heat & lintasan (tercepat di heat terakhir, lane tengah)
- `ranking.ts` — perangkingan lintas heat, dead heat, DNS/DNF/DQ/SCR
- `points.ts` — poin & klasemen overall/grade/class/series
- `records.ts` — Best Swimmer dan Rajendra Record

```bash
npm run test
```
