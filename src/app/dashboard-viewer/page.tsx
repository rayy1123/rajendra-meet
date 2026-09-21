import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/layout';
import { Waves, Ticket, ReceiptText, ArrowRight, User, UserCircle, ClipboardList, CalendarDays, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ZERO = '00000000-0000-0000-0000-000000000000';

export default async function DashboardViewerPage() {
  const { supabase, profile, user } = await requireUser();

  const userRole =
    (profile as any)?.role ||
    (user as any)?.user_metadata?.role ||
    (user as any)?.app_metadata?.role ||
    'viewer';
  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  if (ADMIN_ROLES.includes(userRole)) {
    redirect('/dashboard');
  }

  const fullName = (profile as any)?.full_name || 'Pengguna';
  const username = (profile as any)?.username || 'Pengguna';
  const avatarUrl = (profile as any)?.avatar_url || null;
  const viewerId = (profile as any)?.id;

  // Atlet milik viewer -> id untuk filter pendaftaran & tagihan
  const [{ data: myAthletes }, { count: eventCount }] = await Promise.all([
    supabase.from('athletes').select('id').eq('owner_id', viewerId),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ]);
  const myIds = (myAthletes ?? []).map((a: any) => a.id);

  const [{ count: nominalCount }] = await Promise.all([
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .in('athlete_id', myIds.length ? myIds : [ZERO]),
    supabase.from('competition_events').select('id', { count: 'exact', head: true }),
  ]);

  // Tagihan = pembayaran masih pending untuk pendaftaran milik viewer
  const { data: myRegs } = await supabase
    .from('registrations')
    .select('id')
    .in('athlete_id', myIds.length ? myIds : [ZERO]);
  const regIds = (myRegs ?? []).map((r: any) => r.id);
  const { count: billCount } = await supabase
    .from('payment_verifications')
    .select('id', { count: 'exact', head: true })
    .in('registration_id', regIds.length ? regIds : [ZERO])
    .eq('status', 'pending');

  const stats = [
    { label: 'Perlombaan', value: eventCount ?? 0, unit: 'Lomba', icon: Waves, desc: 'Kejuaraan renang yang sedang berlangsung atau akan datang.' },
    { label: 'Nomor Lomba', value: nominalCount ?? 0, unit: 'Nomor Lomba', icon: Ticket, desc: 'Jumlah nomor lomba yang tersedia untuk didaftarkan.' },
    { label: 'Tagihan', value: billCount ?? 0, unit: 'Tagihan', icon: ReceiptText, desc: 'Pembayaran yang menunggu verifikasi panitia.' },
  ];

  const quickLinks = [
    { label: 'Atlet Saya', href: '/atlet-saya', icon: User, desc: 'Tambah dan kelola data atlet yang akan Anda daftarkan.' },
    { label: 'Daftar Lomba', href: '/daftar-lomba', icon: CalendarDays, desc: 'Pilih kejuaraan dan nomor lomba untuk pendaftaran.' },
    { label: 'Pendaftaran', href: '/pendaftaran-saya', icon: ClipboardList, desc: 'Lihat riwayat dan status pendaftaran serta pembayaran.' },
    { label: 'Profil', href: '/profile', icon: UserCircle, desc: 'Ubah nama, username, foto profil, dan kata sandi.' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* User Banner */}
        <div className="glass-panel relative overflow-hidden px-6 py-5 text-[var(--m-ink)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[var(--m-aqua-soft)]/60 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--m-aqua-soft)] to-white border border-[var(--m-border)] shadow-xs">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <img src="/brand/logo.png" alt="Rajendra Meet" className="h-8 w-auto object-contain" />
                )}
              </div>
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--m-aqua-ink)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> Ruang Atlet & Wali
                </p>
                <h1 className="font-heading text-xl font-black tracking-tight text-[var(--m-ink)] sm:text-2xl">{fullName}</h1>
                <p className="text-xs font-mono text-[var(--m-muted)]">@{username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--m-border)] bg-white px-3.5 py-1.5 font-semibold text-[var(--m-ink)] shadow-2xs transition-colors hover:border-[var(--m-aqua)] hover:text-[var(--m-aqua-ink)]">
                Beranda
              </Link>
              <span className="text-[var(--m-muted)]">/</span>
              <span className="rounded-full bg-[var(--m-aqua-soft)] px-3 py-1 font-bold text-[var(--m-aqua-ink)]">Dasbor Peserta</span>
            </div>
          </div>
        </div>

        <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />

        {/* Welcome */}
        <div>
          <h2 className="font-heading text-2xl font-black tracking-tight text-[var(--m-ink)] sm:text-3xl">
            Semua persiapan lomba, dalam satu tempat.
          </h2>
          <p className="mt-1 text-sm text-[var(--m-muted)]">
            Pilih aksi di bawah ini untuk mengelola pendaftaran dan data atlet Anda.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group relative overflow-hidden rounded-2xl border border-[var(--m-border)] bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[var(--m-aqua)] hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] transition-transform duration-200 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-[var(--m-ink)] group-hover:text-[var(--m-aqua-ink)]">{q.label}</p>
                    <p className="truncate text-xs text-[var(--m-muted)]">{q.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Panduan 3 Langkah Pendaftaran Peserta */}
        <div className="rounded-2xl border border-[var(--m-border)] bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
                3
              </span>
              <h3 className="font-heading font-bold text-sm text-[var(--m-ink)]">
                Alur Pendaftaran Lomba (3 Langkah Mudah)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Panduan Peserta
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/atlet-saya" className="group rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-blue-400 hover:shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-xs mt-0.5">1</span>
                <div>
                  <p className="font-heading font-bold text-xs text-[var(--m-ink)] group-hover:text-blue-700">Lengkapi Data Atlet</p>
                  <p className="text-[11px] text-[var(--m-muted)] mt-0.5 leading-snug">Input nama & tanggal lahir atlet agar Kategori Usia (KU) otomatis terdeteksi tepat.</p>
                </div>
              </div>
            </Link>

            <Link href="/daftar-lomba" className="group rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-indigo-400 hover:shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs mt-0.5">2</span>
                <div>
                  <p className="font-heading font-bold text-xs text-[var(--m-ink)] group-hover:text-indigo-700">Pilih Nomor Lomba (KU)</p>
                  <p className="text-[11px] text-[var(--m-muted)] mt-0.5 leading-snug">Pilih event aktif & nomor lomba yang sesuai batasan usia atlet.</p>
                </div>
              </div>
            </Link>

            <Link href="/pendaftaran-saya" className="group rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-emerald-400 hover:shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs mt-0.5">3</span>
                <div>
                  <p className="font-heading font-bold text-xs text-[var(--m-ink)] group-hover:text-emerald-700">Bayar & Unduh Invoice</p>
                  <p className="text-[11px] text-[var(--m-muted)] mt-0.5 leading-snug">Kirim bukti transfer dengan kode unik & pantau verifikasi panitia.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Event comfort: upcoming event summary */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--m-muted)]">
                    Event Berikutnya
                  </p>
                  <p className="font-heading mt-1 text-base font-bold text-[var(--m-ink)]">Menyesuaikan jadwal terdekat</p>
                  <p className="mt-1 text-xs text-[var(--m-muted)]">
                    Cek Daftar Lomba untuk memilih event dan melihat nomor lomba yang tersedia.
                  </p>
                </div>
                <Link href="/daftar-lomba" className="pub-btn-primary text-xs font-bold">
                  Lihat Daftar Lomba
                </Link>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--m-muted)]">
              Ringkasan Data Anda
            </p>
            <div className="mt-3 space-y-2 text-xs text-[var(--m-muted)]">
              <p className="flex justify-between border-b border-[var(--m-border)]/60 pb-1.5">
                <span>Total atlet terdaftar:</span>
                <span className="font-bold text-[var(--m-ink)] font-mono">{myAthletes?.length ?? 0}</span>
              </p>
              <p className="flex justify-between border-b border-[var(--m-border)]/60 pb-1.5">
                <span>Pendaftaran aktif:</span>
                <span className="font-bold text-[var(--m-ink)] font-mono">{nominalCount ?? 0}</span>
              </p>
              <p className="flex justify-between">
                <span>Tagihan tertunda:</span>
                <span className="font-bold text-amber-600 font-mono">{billCount ?? 0}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="elevated transition-all duration-200 hover:-translate-y-1 hover:shadow-pop border border-[var(--m-border)]">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--m-muted)]">
                      {s.label}
                    </div>
                    <div className="font-heading mt-1 text-3xl font-black tabular-nums text-[var(--m-ink)]">
                      {s.value} <span className="text-sm font-semibold text-[var(--m-muted)]">{s.unit}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--m-muted)]">{s.desc}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] shadow-2xs">
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
