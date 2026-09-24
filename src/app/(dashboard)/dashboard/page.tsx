import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  School,
  Trophy,
  Timer,
  Award,
  Waves,
  ArrowRight,
  Sparkles,
  MapPin,
  Radio,
  BookOpen,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminActionGuide } from '@/components/modules/admin-action-guide';
import { EventLogoImage } from '@/components/ui/event-logo-image';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: eventCount },
    { count: athleteCount },
    { count: regCount },
    { count: schoolCount },
    { data: latestEvent },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('athletes').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('id, name, organizer, location, start_date, end_date, pool_type, lane_count, logo_url')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let eventCompCount = 0;
  let eventRegCount = 0;
  if (latestEvent) {
    const [{ count: cCount }, { count: rCount }] = await Promise.all([
      supabase.from('competition_events').select('id', { count: 'exact', head: true }).eq('event_id', latestEvent.id),
      supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', latestEvent.id),
    ]);
    eventCompCount = cCount || 0;
    eventRegCount = rCount || 0;
  }

  const stats = [
    { label: 'Kejuaraan', value: eventCount ?? 0, href: '/events', icon: CalendarDays },
    { label: 'Atlet', value: athleteCount ?? 0, href: '/athletes', icon: Users },
    { label: 'Pendaftaran', value: regCount ?? 0, href: '/verifikasi-pembayaran', icon: ClipboardList },
    { label: 'Sekolah / Klub', value: schoolCount ?? 0, href: '/schools', icon: School },
  ];

  const quickLinks = [
    { label: 'Acara & Heat', href: '/heats', icon: Timer },
    { label: 'Input Hasil', href: '/results', icon: Trophy },
    { label: 'Perangkingan', href: '/rankings', icon: Award },
    { label: 'Klasemen Medali', href: '/medals', icon: Trophy },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />
      <div className="flex flex-col gap-4 border-b border-[var(--m-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--m-aqua)] text-white shadow-xs">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-[var(--m-ink)] sm:text-3xl">Dasbor Panitia</h1>
            <p className="mt-0.5 text-sm text-[var(--m-muted)]">
              Kelola seluruh rangkaian kejuaraan renang dari satu panel terpadu.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="reveal" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="glass-panel elevated transition-all duration-200 hover:-translate-y-1 hover:shadow-pop border border-[var(--m-border)]">
                <div className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] shadow-2xs">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-heading text-3xl font-black tabular-nums text-[var(--m-ink)]">{s.value}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--m-muted)] mt-0.5">{s.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Kejuaraan Aktif Utama (Spotlight & Quick Workflow) */}
      {latestEvent && (
        <div className="glass-panel relative overflow-hidden p-6 border border-[var(--m-border)] shadow-xs">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[var(--m-aqua-soft)]/50 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-[var(--m-border)] p-2 shadow-2xs">
                <EventLogoImage
                  src={latestEvent.logo_url}
                  alt={latestEvent.name}
                  fallbackIconClassName="h-7 w-7 text-[var(--m-aqua-ink)]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border-[var(--m-aqua)]/30 font-bold text-[10px]">
                    <Sparkles className="h-3 w-3 mr-1" /> Kejuaraan Terkini
                  </Badge>
                  <span className="text-xs text-[var(--m-muted)]">•</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {eventCompCount} Nomor Lomba · {eventRegCount} Peserta
                  </span>
                </div>
                <h2 className="font-heading text-xl font-black text-[var(--m-ink)] sm:text-2xl">
                  {latestEvent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--m-muted)]">
                  {latestEvent.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {latestEvent.location}
                    </span>
                  )}
                  {latestEvent.start_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-[var(--m-aqua)]" />
                      {latestEvent.start_date} s/d {latestEvent.end_date}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" />
                    {latestEvent.lane_count || 8} Lintasan ({latestEvent.pool_type || 'Indoor'})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Workflow Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/events/${latestEvent.id}`}
                className="pub-btn-primary gap-1.5 text-xs font-bold"
              >
                Kelola Event <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/events/${latestEvent.id}#atur-acara`}
                className="pub-btn-ghost gap-1.5 text-xs font-semibold"
              >
                <Layers className="h-3.5 w-3.5 text-blue-600" /> Atur Acara
              </Link>
              <Link
                href={`/heats?eventId=${latestEvent.id}`}
                className="pub-btn-ghost gap-1.5 text-xs font-semibold"
              >
                <Timer className="h-3.5 w-3.5 text-indigo-600" /> Seri & Lintasan
              </Link>
              <Link
                href={`/buku-acara?event=${latestEvent.id}`}
                className="pub-btn-ghost gap-1.5 text-xs font-semibold"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-600" /> Buku Acara
              </Link>
              <Link
                href={`/results?eventId=${latestEvent.id}`}
                className="pub-btn-ghost gap-1.5 text-xs font-semibold"
              >
                <Trophy className="h-3.5 w-3.5 text-emerald-600" /> Input Hasil
              </Link>
              <Link
                href={`/public-live/${latestEvent.id}`}
                target="_blank"
                className="pub-btn-ghost gap-1.5 text-xs font-semibold text-primary"
              >
                <Radio className="h-3.5 w-3.5 text-rose-600" /> Live Scoreboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="reveal" style={{ animationDelay: `400ms` }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-black tracking-tight text-[var(--m-ink)]">Akses Cepat Operasional</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((q, i) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="pub-card elevated flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--m-aqua)] hover:shadow-md reveal"
                style={{ animationDelay: `${(i + 4) * 80}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-heading text-sm font-bold text-[var(--m-ink)]">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <AdminActionGuide />
    </div>
  );
}