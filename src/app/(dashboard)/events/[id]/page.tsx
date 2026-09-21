import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layers, Clock, Radio, Waves, CreditCard, Tag, Trophy, Camera } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EventSettingsDialog } from '@/components/modules/event-settings-dialog';
import { EventLogoDialog } from '@/components/modules/event-logo-dialog';
import { CompetitionEventsManager } from '@/components/modules/competition-events-manager';
import { EventLiveToggle } from '@/components/modules/event-live-toggle';
import { EventWorkflowStepper } from '@/components/modules/event-workflow-stepper';
import { getEventLiveConfig } from '@/lib/data/live-scoreboard-server';
import { getEventSettings } from '@/lib/data/event-settings-server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawEvent } = await supabase.from('events').select('*').eq('id', id).single();
  if (!rawEvent) notFound();

  const savedSettings = getEventSettings(id);
  const event = {
    ...rawEvent,
    ...savedSettings,
  };

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name, order_no, session_no')
    .eq('event_id', id)
    .order('order_no', { ascending: true });

  const compEventIds = (compEvents || []).map((c) => c.id);

  const [{ count: regCount }, { count: heatCount }] = await Promise.all([
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id),
    compEventIds.length > 0
      ? supabase
          .from('heats')
          .select('id', { count: 'exact', head: true })
          .in('competition_event_id', compEventIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const liveConfig = getEventLiveConfig(id);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Kejuaraan / Events', href: '/events' }, { label: event.name }]} className="mb-2" />
      <PageHeader
        title={event.name}
        description={event.organizer || 'Panitia Pelaksana'}
      />

      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--m-border)]">
          <div className="flex items-center gap-4">
            <EventLogoDialog
              eventId={event.id}
              eventName={event.name}
              currentLogoUrl={event.logo_url}
              trigger={
                <button
                  type="button"
                  className="group relative h-16 w-16 shrink-0 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                  title="Klik untuk mengubah logo kejuaraan"
                >
                  {event.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.logo_url}
                      alt={event.name}
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <Trophy className="h-8 w-8 text-blue-600" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="h-5 w-5" />
                  </div>
                </button>
              }
            />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base text-[var(--m-ink)]">Logo Resmi Kejuaraan</span>
                <EventLogoDialog
                  eventId={event.id}
                  eventName={event.name}
                  currentLogoUrl={event.logo_url}
                />
              </div>
              <p className="text-xs text-[var(--m-muted)] mt-0.5">
                {event.logo_url
                  ? 'Logo khusus aktif untuk sertifikat, piagam, dan invoice.'
                  : 'Belum ada logo khusus. Klik tombol di atas untuk unggah logo.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--m-muted)]">
          {event.location && (
            <span className="flex items-center gap-1.5"><Waves className="h-4 w-4" /> {event.location}</span>
          )}
          <span>{event.start_date} s/d {event.end_date}</span>
          <span>{event.pool_type} ({event.pool_length_meters}m)</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link href="#atur-acara" className="inline-flex items-center gap-2 rounded-lg bg-[var(--m-aqua)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--m-aqua-ink)]">
            <Layers className="h-4 w-4" /> Atur Acara
          </Link>
          <Link href={`/results?eventId=${event.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[var(--m-border)] px-4 py-2 text-sm font-semibold text-[var(--m-ink)] transition-ui hover:border-[var(--m-muted)]">
            <Clock className="h-4 w-4" /> Input Hasil
          </Link>
          <Link href={`/public-live/${event.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-[var(--m-border)] px-4 py-2 text-sm font-semibold text-[var(--m-ink)] transition-ui hover:border-[var(--m-muted)]">
            <Radio className="h-4 w-4" /> Buka Live Board
          </Link>
          <EventLiveToggle eventId={event.id} initialMode={liveConfig.mode} event={event} />
          <EventSettingsDialog event={event} />
        </div>
      </div>

      {/* Alur Kerja Kejuaraan (Interactive Workflow Stepper) */}
      <EventWorkflowStepper
        eventId={event.id}
        eventName={event.name}
        compEventCount={compEvents?.length || 0}
        registrationCount={regCount || 0}
        heatCount={heatCount || 0}
        isLiveActive={liveConfig.mode === 'open'}
      />

      {/* Rincian Biaya & Kode Unik */}
      <div className="rounded-2xl border border-[var(--m-border)] bg-[var(--m-surface)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--m-ink)] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Biaya Pendaftaran & Kode Unik Pembayaran
            </h2>
            <p className="text-xs text-[var(--m-muted)]">
              Konfigurasi tarif nomor lomba dan pengenal transfer otomatis khusus kejuaraan ini.
            </p>
          </div>
          <EventSettingsDialog event={event} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-muted-foreground block text-[11px] font-medium">Biaya per Nomor Lomba</span>
            <span className="text-base font-bold text-foreground mt-0.5 block">
              Rp {(event.fee_per_event || 50000).toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-muted-foreground">per atlet per nomor</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-muted-foreground block text-[11px] font-medium">Sistem Kode Unik</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                event.use_unique_code ?? true
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                <Tag className="h-3 w-3" />
                {event.use_unique_code ?? true ? 'AKTIF' : 'NONAKTIF'}
              </span>
              <span className="text-muted-foreground font-medium">
                {event.unique_code_mode === 'random_3_digit' || !event.unique_code_mode
                  ? '3 Digit Random'
                  : event.unique_code_mode === 'sequential'
                  ? 'Nomor Urut'
                  : event.unique_code_mode === 'fixed'
                  ? `Fixed (${event.unique_code_fixed || 0})`
                  : `Custom (${event.unique_code_min || 100}-${event.unique_code_max || 999})`}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1">Ditambahkan ke nominal transfer</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-muted-foreground block text-[11px] font-medium">Rekening Tujuan</span>
            <span className="font-bold text-foreground block text-sm mt-0.5">
              {event.bank_name || 'BCA'} {event.bank_account_no ? `· ${event.bank_account_no}` : ''}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              a.n {event.bank_account_name || 'Panitia Pelaksana Renang'}
            </span>
          </div>
        </div>
      </div>

      <CompetitionEventsManager
        eventId={event.id}
        eventName={event.name}
        initialCompEvents={(compEvents as any) || []}
      />
    </div>
  );
}
