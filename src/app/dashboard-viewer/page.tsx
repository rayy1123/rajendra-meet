import { requireUser } from '@/lib/auth';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/layout';
import { Waves, Ticket, ReceiptText, ArrowRight, User, UserCircle, ClipboardList, CalendarDays, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ZERO = '00000000-0000-0000-0000-000000000000';

export default async function DashboardViewerPage() {
  const { supabase, profile } = await requireUser();

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
        <div className="glass-panel px-6 py-5 text-[var(--m-ink)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--m-soft)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <img src="/brand/logo.png" alt="Rajendra Meet" className="h-7 w-auto" />
                )}
              </div>
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--m-muted)]">
                  <Sparkles className="h-3 w-3 text-[var(--m-aqua-ink)]" /> Ruang Atlet
                </p>
                <h1 className="text-xl font-bold tracking-tight">{fullName}</h1>
                <p className="text-xs text-[var(--m-muted)]">@{username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link href="/" className="inline-flex items-center gap-1 rounded-full border border-[var(--m-border)] bg-white px-3 py-1.5 font-semibold text-[var(--m-ink)] hover:border-[var(--m-aqua)]">
                Beranda
              </Link>
              <span className="text-[var(--m-muted)]">/</span>
              <span className="font-semibold text-[var(--m-ink)]">Dashboard</span>
            </div>
          </div>
        </div>

        <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />

        {/* Welcome */}
        <div>
          <h2 className="h-section">Semua persiapan lomba, dalam satu tempat.</h2>
          <p className="text-sm text-[var(--m-muted)]">
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
                className="group relative overflow-hidden rounded-2xl border border-[var(--m-border)] bg-white p-4 shadow-sm transition-ui hover:-translate-y-0.5 hover:border-[var(--m-aqua)]/50 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] transition-transform duration-200 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--m-ink)]">{q.label}</p>
                    <p className="truncate text-xs text-[var(--m-muted)]">{q.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Event comfort: upcoming event summary */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">
                    Event Berikutnya
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--m-ink)]">Menyesuaikan jadwal terdekat</p>
                  <p className="mt-1 text-xs text-[var(--m-muted)]">
                    Cek Daftar Lomba untuk memilih event dan melihat nomor lomba yang tersedia.
                  </p>
                </div>
                <Link href="/daftar-lomba" className="pub-btn-ghost">
                  Lihat Daftar Lomba
                </Link>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">
              Ringkasan
            </p>
            <div className="mt-3 space-y-2 text-xs text-[var(--m-muted)]">
              <p>Total atlet terdaftar: <span className="font-semibold text-[var(--m-ink)]">{myAthletes?.length ?? 0}</span></p>
              <p>Pendaftaran aktif: <span className="font-semibold text-[var(--m-ink)]">{nominalCount ?? 0}</span></p>
              <p>Tagihan tertunda: <span className="font-semibold text-[var(--m-ink)]">{billCount ?? 0}</span></p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="elevated transition-ui hover:-translate-y-0.5 hover:shadow-pop">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">
                      {s.label}
                    </div>
                    <div className="mt-1 text-3xl font-black tabular-nums text-[var(--m-ink)]">
                      {s.value} <span className="text-sm font-semibold text-[var(--m-muted)]">{s.unit}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--m-muted)]">{s.desc}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
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
