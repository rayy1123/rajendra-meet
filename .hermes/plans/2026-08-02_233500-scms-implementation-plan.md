# SCMS (Swimming Competition Management System) — Implementation Plan

> **For Hermes:** Implement task-by-task. Verify each task before moving on. Commit after each task.

**Goal:** Membangun SCMS lengkap — multi-event, registrasi, heat otomatis, input hasil, ranking & awards otomatis, live result realtime, laporan PDF/Excel, dan halaman publik.

**Architecture:** Next.js 16 App Router (RSC-first) + Supabase (Postgres, Auth, Realtime, Storage). Business logic murni (seeding, ranking, poin, tie-break) diisolasi di `src/services/` sebagai fungsi pure yang bisa diuji tanpa DB. Akses data lewat `src/lib/repositories/`. Mutasi lewat Server Actions. RLS Postgres sebagai penegak otorisasi utama; UI hanya menyembunyikan, tidak mengamankan.

**Tech Stack:** Next.js 16.2.12 (App Router, React Compiler), React 19.2.4, TypeScript strict, Tailwind v4, shadcn/ui (radix-nova), Supabase (@supabase/ssr), xlsx/ExcelJS, jsPDF + autotable, sonner, next-themes, Vitest.

**Catatan koreksi terhadap brief:** brief menyebut Next.js 15, repo aktual memakai Next.js 16.2.12 — plan ini mengikuti repo (Next 16: middleware bernama `proxy.ts`, async `cookies()`, async `params`). Baca `node_modules/next/dist/docs/` sebelum menulis kode route/API.

---

## Fase 0 — Stabilisasi (WAJIB LEBIH DULU)

### Task 0.1: Perbaiki syntax error yang membuat build gagal
**Objective:** `npx tsc --noEmit` bersih.
**Files:** Modify: `src/app/page.tsx`
- Baris 1–21 kosong dan baris 22 berbunyi `0import Image from "next/image";` → TS1351.
- Ganti seluruh isi file menjadi redirect ke halaman utama aplikasi:
  ```tsx
  import { redirect } from 'next/navigation';
  export default function Home() { redirect('/events'); }
  ```
**Verify:** `npx tsc --noEmit` → no output. `npm run build` → sukses.
**Commit:** `fix: repair corrupted root page.tsx and redirect to /events`

### Task 0.2: Selaraskan rute publik di proxy
**Objective:** Halaman live publik bisa diakses tanpa login.
**Files:** Modify: `src/proxy.ts:45`
- `pathname.startsWith('/scoreboard')` tidak cocok dengan route nyata `/public-live/[eventId]`.
- Ganti dengan daftar prefix publik: `/login`, `/public`, `/public-live`.
**Verify:** jalankan `npm run dev`, buka `/public-live/<id>` tanpa sesi → tidak redirect ke /login.
**Commit:** `fix: align public route matcher in proxy with actual public routes`

### Task 0.3: Rapikan metadata & pindahkan types
**Objective:** identitas app benar, alias `@/*` mencakup types.
**Files:** Modify `src/app/layout.tsx` (metadata title "SCMS — Swimming Competition Management System"); pindahkan `types/database.ts` → `src/types/database.ts`; update seluruh import-nya.
**Verify:** `npx tsc --noEmit` bersih.
**Commit:** `chore: move types under src and set app metadata`

### Task 0.4: Setup test runner
**Objective:** ada jalur verifikasi otomatis untuk logika inti.
**Files:** Create `vitest.config.ts`, `src/services/__tests__/.gitkeep`; Modify `package.json` (`"test": "vitest run"`, devDeps `vitest`).
**Verify:** `npm run test` → "No test files found" (exit 0 dengan `--passWithNoTests`).
**Commit:** `chore: add vitest`

### Task 0.5: Ganti dependensi berisiko
**Objective:** hapus `xlsx@0.18.5` (CVE prototype pollution/ReDoS belum ditambal di npm).
**Files:** Modify `package.json` — pakai `exceljs` (juga dibutuhkan untuk template Excel berlogo/berwarna, yang tidak bisa dilakukan `xlsx` gratis); refactor `src/services/excel-parser.ts` dan `src/lib/utils/export.ts`.
**Verify:** `npm run build` sukses, import Excel contoh tetap terparse.
**Commit:** `chore: replace xlsx with exceljs`

---

## Fase 1 — Database & Otorisasi

### Task 1.1: Skema SQL lengkap
**Files:** Create `supabase/migrations/0001_init.sql`
Tabel (semua `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`):
- `profiles` (id → auth.users, full_name, role enum: super_admin|event_admin|operator|viewer)
- `events` (+ `series_id`, `pool_count`, `lane_count`, `logo_url`, `organizer`, `location`, `start_date`, `end_date`, `pool_type`, `pool_length_meters`)
- `series` (name, year)
- `event_admins` (event_id, user_id) — cakupan Event Admin per event
- `schools` (name, city, province, coach_name)
- `athletes` (athlete_number unik per event, full_name, gender, birth_date, grade_level, class_name, age_group, school_id, photo_url)
- `competition_events` (event_id, name, stroke, distance_meters, gender, grade_level, class_name, age_group, session_no, order_no)
- `registrations` (event_id, athlete_id, competition_event_id, seed_time_ms) — UNIQUE(athlete_id, competition_event_id)
- `heats` (competition_event_id, heat_number) — UNIQUE(competition_event_id, heat_number)
- `heat_assignments` (heat_id, registration_id, lane_number) — UNIQUE(heat_id, lane_number)
- `results` (heat_assignment_id UNIQUE, time_ms nullable, status enum, updated_at)
- `point_rules` (event_id, rank, points) — UNIQUE(event_id, rank)
- `tie_break_rules` (event_id, ordered jsonb)
- `rajendra_records` (competition_event_id, athlete_id, school_id, time_ms, event_year, is_active) — index parsial UNIQUE pada `is_active = true`
- `audit_logs` (user_id, action, entity, entity_id, payload jsonb, created_at)
- `settings` (event_id, key, value jsonb)
Index: FK semua, plus `results(status)`, `registrations(competition_event_id)`.
**Verify:** `supabase db reset` (atau jalankan SQL di dashboard) tanpa error.
**Commit:** `feat(db): initial schema`

### Task 1.2: RLS policies
**Files:** Create `supabase/migrations/0002_rls.sql`
- Enable RLS di semua tabel.
- Helper `public.user_role()` dan `public.is_event_admin(event_id)` (SECURITY DEFINER, stable).
- SELECT publik (anon) hanya untuk: events, competition_events, heats, heat_assignments, results, athletes, schools, rajendra_records — sisanya authenticated.
- INSERT/UPDATE: operator boleh results/heats/registrations; DELETE data penting hanya event_admin/super_admin; profiles/settings/point_rules hanya super_admin.
**Pitfall:** anon key dipakai di seluruh app — tanpa policy ini semua data terbuka/tertutup total.
**Verify:** query dari klien anon hanya mengembalikan tabel publik.
**Commit:** `feat(db): row level security`

### Task 1.3: Generate types & repository layer
**Files:** `src/types/database.ts` (regenerate via `supabase gen types typescript`), Create `src/lib/repositories/{events,athletes,schools,competitions,registrations,heats,results,records,rankings}.ts`.
Setiap repo: fungsi async menerima client Supabase, mengembalikan tipe domain, melempar error jelas.
**Verify:** `npx tsc --noEmit`.
**Commit:** `feat: typed repository layer`

---

## Fase 2 — Shell Aplikasi & Auth

### Task 2.1: Layout dashboard
**Files:** Create `src/app/(dashboard)/layout.tsx` yang membungkus `src/components/layout/layout.tsx` (sidebar + header). Hapus pemasangan layout manual di tiap page.
**Verify:** semua route dashboard memakai sidebar yang sama.

### Task 2.2: Dark mode, toast, error/loading states
**Files:** `src/app/layout.tsx` (ThemeProvider next-themes + `<Toaster />`), Create `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/(dashboard)/loading.tsx`, `src/components/ui/{empty-state,skeleton-table,confirm-dialog}.tsx`.

### Task 2.3: Auth & role
**Files:** Create `src/lib/auth/session.ts` (`getSessionUser()` → user + role + event scope), `src/lib/auth/guards.ts` (`requireRole([...])`). Terapkan di setiap Server Action.
**Verify:** login sebagai operator → tombol delete tidak muncul DAN server action menolak.
**Commit:** `feat: app shell, theming, role guards`

### Task 2.4: Komponen DataTable reusable
**Files:** Create `src/components/ui/data-table.tsx` — search, filter kolom, sorting, pagination server-side. Dipakai oleh semua modul master data.

---

## Fase 3 — Master Data

### Task 3.1–3.3: CRUD Schools, Athletes, Competition Events
Untuk tiap entitas: page (RSC + DataTable) → dialog form → Server Action (create/update/delete) → revalidatePath → toast.
**Files:** `src/app/(dashboard)/{schools,athletes,competitions}/page.tsx` + `actions.ts` + `src/components/modules/<entity>-table.tsx`.
- Athlete number auto-generate: `src/services/athlete-number.ts` — format `{eventCode}-{seq:4}`, unit test untuk urutan & tabrakan.
- Filter wajib: nama, sekolah, gender, grade, class, age group.
**Verify:** unit test `athlete-number` hijau; CRUD manual di UI.

### Task 3.4: Registrations
**Files:** `src/app/(dashboard)/registrations/page.tsx` + actions. Satu atlet → banyak nomor lomba, dengan seed time opsional. Cegah duplikat (constraint DB + pesan ramah).

---

## Fase 4 — Logika Inti (pure functions, TDD)

Semua di `src/services/`, tanpa dependensi Supabase. Ini bagian paling rawan bug — tulis test lebih dulu.

### Task 4.1: `seeding.ts` — pembagian heat & lane
**Aturan:**
- Kelompokkan registrasi berdasarkan kunci: `competition_event_id` (yang sudah mencakup gender+grade+class+age_group). Peserta beda kategori TIDAK PERNAH satu heat.
- Jumlah heat = ceil(n / laneCount). Sisa peserta ditempatkan di heat pertama (peserta tercepat di heat terakhir — konvensi circle seeding).
- Urutan lane standar: 8 lane → 4,5,3,6,2,7,1,8; 6 lane → 3,4,2,5,1,6; 10 lane → 5,6,4,7,3,8,2,9,1,10. Seed terbaik di lane tengah.
- Peserta tanpa seed time diperlakukan sebagai paling lambat, ditempatkan di heat awal.
**Test:** `src/services/__tests__/seeding.test.ts` — 0 peserta, 1 peserta, tepat 1 heat penuh, 9 peserta/8 lane, dua kategori tidak tercampur, urutan lane untuk 6/8/10.
**Commit:** `feat(services): heat seeding with standard lane assignment`

### Task 4.2: `ranking.ts` — ranking otomatis
- Ranking dihitung per `competition_event_id` lintas heat, berdasarkan `time_ms` menaik.
- Status DNS/DNF/DQ/SCR tidak diberi ranking, selalu di bawah.
- Waktu identik → peringkat sama (dead heat), peringkat berikutnya melompat.
**Test:** lintas heat, dead heat, semua DQ, campuran status.

### Task 4.3: `points.ts` + `championship.ts`
- Poin dari `point_rules` per event (default 1→10, 2→8, 3→6, 4→5, 5→4, 6→3, 7→2, 8→1), dapat diubah di Settings.
- Agregasi: Overall Champion (per sekolah), Grade Champion, Class Champion, Series Champion (akumulasi lintas event dalam satu series).
**Test:** perubahan tabel poin mengubah klasemen; dead heat membagi poin sesuai aturan konfigurasi.

### Task 4.4: `best-swimmer.ts`
- Dihitung PER KATEGORI KELAS + GENDER (mis. "Best Swimmer SD Kelas 6 Putra"), bukan keseluruhan event.
- Urutan tie-break: total poin → emas → perak → perunggu → aturan tambahan dari `tie_break_rules`.
**Test:** dua atlet poin sama beda emas; tie sampai perunggu.

### Task 4.5: `records.ts` — Rajendra Record
- Bandingkan hasil `finished` terhadap record aktif per (competition_event kategori).
- Jika lebih cepat: set record lama `is_active=false` (tetap tersimpan sebagai history), insert record baru aktif, tandai hasil dengan flag `new_record`.
**Test:** pecah rekor, tidak pecah, rekor pertama (belum ada baseline).

---

## Fase 5 — Heat, Result, Live

### Task 5.1: Heat Management UI
**Files:** `src/app/(dashboard)/heats/page.tsx`, `actions.ts` (Server Action `generateHeats(competitionEventId)` memanggil `seeding.ts` lalu menulis heats + heat_assignments dalam satu RPC transaksional `supabase/migrations/0003_fn_generate_heats.sql`).
**Pitfall:** generate ulang harus menghapus heat lama yang belum punya hasil, dan MENOLAK jika sudah ada hasil terinput.

### Task 5.2: Start List
**Files:** `src/app/(dashboard)/heats/start-list/page.tsx` — kolom Heat, Lane, Athlete, School, Event; siap cetak.

### Task 5.3: Result Input
**Files:** `src/components/modules/result-input-operator.tsx` (sudah ada — sambungkan ke action). Alur: pilih event → heat → input waktu per lane → save batch. Input `mm:ss.SS` dikonversi via `formatTimeToMs`. Status: finished/DNS/DNF/DQ/SCR. Setelah save → jalankan pengecekan record (Task 4.5) → toast "New Rajendra Record!" bila pecah.

### Task 5.4: Live Result realtime
**Files:** `src/app/public-live/[eventId]/page.tsx` + `src/components/modules/live-scoreboard-view.tsx`.
- Subscribe `postgres_changes` pada tabel `results` difilter per event, update tanpa refresh.
- `params` di Next 16 adalah Promise — `const { eventId } = await params`.
**Pitfall:** Realtime harus diaktifkan untuk tabel `results` (`alter publication supabase_realtime add table results`), dan RLS SELECT anon harus mengizinkan — kalau tidak, event tidak pernah sampai ke klien.
**Verify:** dua browser; simpan hasil di satu, tampil di lainnya < 2 detik.

---

## Fase 6 — Import Excel & Buku Acara

### Task 6.1: Download Template Excel
**Files:** `src/services/excel-template.ts` (ExcelJS) — 4 sheet: Event Information, Competition Schedule, Competition Events, Participants. Dengan logo, header/footer, border, warna, print area.
**Verify:** file terunduh, dibuka di Excel tanpa warning.

### Task 6.2: Parser & import transaksional
**Files:** `src/services/excel-parser.ts` (validasi per baris, kembalikan `{rows, errors[]}`), Server Action import memanggil RPC `import_event(payload jsonb)` agar seluruh insert (event, competition_events, athletes, registrations) atomik.
**Test:** fixture xlsx valid, fixture dengan gender salah/tanggal invalid → error terlaporkan per baris, tidak ada data parsial masuk.

### Task 6.3: Buku Acara & Reports
**Files:** `src/services/report/` — generator PDF (jsPDF+autotable) dan Excel untuk: Cover, Info Event, Jadwal, Daftar Nomor Lomba, Start List, Heat List, Result Sheet, Final Ranking, Awards. Plus export CSV.
**Files UI:** `src/app/(dashboard)/reports/page.tsx`.

---

## Fase 7 — Awards, Settings, Audit, Public

### Task 7.1: Awards page
`src/app/(dashboard)/awards/page.tsx` — tab: Overall, Grade, Class, Series, Best Swimmer, Rajendra Record. Data dari services Fase 4.

### Task 7.2: Rajendra Record page
`src/app/(dashboard)/rajendra-record/page.tsx` — record aktif + history, badge "New Rajendra Record".

### Task 7.3: Settings
`src/app/(dashboard)/settings/page.tsx` — jumlah lane, tabel poin (editable), aturan tie-break, konfigurasi event, upload logo (Supabase Storage), warna tema, tombol Backup Database (export SQL/JSON).

### Task 7.4: Audit Log
Trigger Postgres pada insert/update/delete tabel penting → `audit_logs`; plus pencatatan eksplisit untuk login, generate heat, import Excel. Halaman `src/app/(dashboard)/audit/page.tsx` khusus super_admin.

### Task 7.5: Public pages
`src/app/public/[eventId]/{schedule,start-list,live,rankings,awards,records}/page.tsx` — read-only, realtime, tanpa login, terdaftar di prefix publik proxy (Task 0.2).

---

## Fase 8 — Polish & Deploy

- Loading skeleton, empty state, error state di seluruh tabel.
- Responsif: sidebar collapse di mobile (Sheet), tabel scroll horizontal.
- `npm run lint` dan `npm run build` bersih.
- Env di Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- README: setup, migrasi, seed, deploy.

---

## Files Likely to Change (ringkas)

Baru: `supabase/migrations/*`, `src/lib/repositories/*`, `src/lib/auth/*`, `src/services/{seeding,ranking,points,championship,best-swimmer,records,excel-template,excel-parser,report/*}.ts`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/{registrations,competitions,reports,audit}/`, `src/app/public/*`, `src/components/ui/{data-table,empty-state,confirm-dialog,skeleton-table}.tsx`, `vitest.config.ts`.
Diubah: `src/app/page.tsx`, `src/app/layout.tsx`, `src/proxy.ts`, `package.json`, `src/types/database.ts`, seluruh page dashboard yang sudah ada.

## Validation

- `npx tsc --noEmit` — bersih
- `npm run lint` — bersih
- `npm run test` — services Fase 4 hijau (target: seeding, ranking, points, best-swimmer, records, excel-parser)
- `npm run build` — sukses
- Manual: import Excel → generate heat → input hasil → ranking & awards benar → live page ter-update realtime → PDF tercetak

## Risks & Tradeoffs

1. **Anon key saja.** Seluruh keamanan bergantung RLS. Jika ada operasi yang butuh bypass (backup, import massal), perlu service_role key di Server Action saja — JANGAN pernah di file klien atau variabel `NEXT_PUBLIC_*`.
2. **Next.js 16 ≠ Next 15.** `proxy.ts` menggantikan `middleware.ts`, `cookies()`/`params`/`searchParams` async. Pola dari memori/tutorial lama akan gagal — baca `node_modules/next/dist/docs/`.
3. **React Compiler aktif.** Hindari mutasi props/state di render; komponen tidak murni bisa berperilaku berbeda dari dev.
4. **Atomicity.** Generate heat dan import Excel harus RPC transaksional; kalau tidak, kegagalan di tengah meninggalkan data setengah jadi.
5. **Skala Realtime.** Satu channel per event, bukan per baris.
6. **Aturan lane/seeding** adalah asumsi konvensi standar; perlu konfirmasi panitia.

## Open Questions

1. Aturan lane 6/8/10 — pakai standar FINA seperti di Task 4.1, atau ada aturan khusus panitia?
2. Dead heat (waktu sama persis): poin dibagi rata, atau keduanya dapat poin penuh?
3. "Series" — satu event punya beberapa seri, atau beberapa event tergabung dalam satu series? Plan ini mengasumsikan tabel `series` menaungi banyak `events`.
4. Kelompok umur (age_group) dihitung otomatis dari tanggal lahir, atau diisi manual?
5. Best Swimmer — apakah selalu per (kelas × gender), termasuk untuk jenjang SMA?
6. Backup Database: export file dari UI saja, atau terjadwal ke Storage?
