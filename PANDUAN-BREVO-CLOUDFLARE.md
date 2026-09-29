# PANDUAN INTEGRASI BREVO SMTP & CLOUDFLARE (RAJENDRA SWIM SYSTEM)

Dokumen ini berisi panduan lengkap pengesetan **Brevo (Sendinblue) SMTP** untuk email transaksional dan **Cloudflare CDN/WAF** untuk domain & keamanan platform Rajendra Swim System.

---

## 1. Solusi Error Hydration di Browser (`fdprocessedid`)

### Penyebab Error:
Error `A tree hydrated but some attributes of the server rendered HTML didn't match... (fdprocessedid="nycdx")` disebabkan oleh **Ekstensi Browser** (seperti Password Manager / Bitwarden / 1Password / Auto-fillers) yang menyuntikkan atribut `fdprocessedid` secara otomatis ke elemen `<button>` atau `<input>` setelah HTML server diterima di DOM.

### Solusi yang Sudah Diterapkan:
1. `src/app/layout.tsx`: Menambahkan `suppressHydrationWarning` pada tag `<html>` dan `<body>`.
2. `src/components/layout/landing-nav.tsx`: Menambahkan `suppressHydrationWarning` pada komponen `BreadcrumbMenuButton`.

---

## 2. Pengesetan Email SMTP Provider (Brevo / Sendinblue)

### A. Konfigurasi Environment Variables (`.env.local` / Vercel Settings)
Tambahkan variabel berikut pada `.env.local` atau Vercel Environment Variables:

```env
# Brevo API Key & Sender Info
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
BREVO_SENDER_NAME=Rajendra Swim System
BREVO_SENDER_EMAIL=noreply@rajendra.id

# Brevo Custom SMTP Credentials (untuk Supabase Auth)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=email_akun_brevo_anda@domain.com
SMTP_PASSWORD=master_key_smtp_brevo_anda
```

### B. Konfigurasi Custom SMTP di Supabase Dashboard (Auth Email)
Untuk mengirim email reset password dan verifikasi akun via Brevo dari Supabase Auth:
1. Login ke **Supabase Dashboard** -> Pilih Project Anda.
2. Masuk ke **Authentication** -> **Email Templates** / **Provider Settings**.
3. Aktifkan **Enable Custom SMTP**.
4. Isi data kredensial Brevo SMTP:
   - **Sender Email**: `noreply@rajendra.id` (atau email domain yang sudah diverifikasi di Brevo).
   - **Sender Name**: `Rajendra Swim System`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: *User SMTP Brevo Anda*
   - **Password**: *Password SMTP Brevo Anda*
5. Simpan perubahan.

### C. Penggunaan Service Email di Kode (`src/lib/email/brevo.ts`)
```ts
import { sendBrevoEmail, sendRegistrationNotificationEmail } from '@/lib/email/brevo';

// Mengirim email notification pendaftaran
await sendRegistrationNotificationEmail({
  toEmail: 'peserta@email.com',
  toName: 'Budi Santoso',
  athleteName: 'Bima Paralayang',
  eventName: 'Kejurda Banten 2026',
  totalAmount: 150000,
});
```

---

## 3. Pengesetan Cloudflare DNS, WAF, & SSL/TLS

### A. Pengesetan DNS (Vercel Integration)
Arahkan domain resmi ke Vercel melalui Cloudflare DNS:

| Type | Name | Target / Value | Proxy Status |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` / `rajendra.id` | `cname.vercel-dns.com` | **Proxied** (Orange Cloud) |
| **CNAME** | `www` | `cname.vercel-dns.com` | **Proxied** (Orange Cloud) |

### B. Mode SSL / TLS Encryption
1. Masuk ke **Cloudflare Dashboard** -> **SSL/TLS** -> **Overview**.
2. Pilih mode **Full (Strict)**.
3. Aktifkan **Always Use HTTPS** di tab **Edge Certificates**.
4. Aktifkan **HTTP/3 (with QUIC)** dan **0-RTT Connection Resumption** untuk latensi rendah.

### C. Header IP Pengunjung Asli (Handling di Proxy Next.js)
Aplikasi secara otomatis menangkap IP asli pengunjung di balik Cloudflare melalui `src/proxy.ts`:
- Header `CF-Connecting-IP` disuntikkan ke `x-client-ip` & `x-real-ip`.
- Header `CF-IPCountry` disuntikkan ke `x-client-country`.
- CSP `connect-src` telah mengizinkan `https://*.cloudflare.com`, `https://api.brevo.com`, dan `wss://*.supabase.co`.

---

## 4. Pengujian & Validasi

Jalankan perintah berikut untuk memastikan tidak ada error kompilasi:

```bash
npm test        # Memastikan seluruh unit test lulus (100% pass)
npx tsc --noEmit # Memastikan 0 type error
npm run build   # Memastikan Next.js build sukses (code 0)
```
