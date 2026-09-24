import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MapPin, CalendarDays, ExternalLink, Trophy, Waves, Camera } from 'lucide-react';
import Link from 'next/link';
import { ProfileMenu } from '@/components/layout/logout-button';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { EventLogoDialog } from '@/components/modules/event-logo-dialog';
import { EventLogoImage } from '@/components/ui/event-logo-image';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('event_id');

  const compCountByEvent = new Map<string, number>();
  (compEvents || []).forEach((ce) => {
    if (ce.event_id) {
      compCountByEvent.set(ce.event_id, (compCountByEvent.get(ce.event_id) || 0) + 1);
    }
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Kejuaraan / Events' }]} className="mb-2" />
      <PageHeader
        title="Kejuaraan / Events"
        description="Kelola kejuaraan renang, pengaturan kolam, dan jadwal perlombaan."
        icon={<Trophy className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/scoreboard" target="_blank">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Live Scoreboard
              </Button>
            </Link>
            <ProfileMenu />
            <Link href="/events/new">
              <Button className="gap-2">Buat Event Baru</Button>
            </Link>
          </div>
        }
      />

      {!events || events.length === 0 ? (
        <EmptyState
          icon={<Waves className="h-6 w-6" />}
          title="Belum ada event kejuaraan"
          description="Silakan buat event terlebih dahulu untuk mengelola nomor lomba dan hasil."
          action={
            <Link href="/events/new">
              <Button className="gap-2">Buat Event Baru</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="glass-panel elevated transition-ui hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <EventLogoDialog
                      eventId={event.id}
                      eventName={event.name}
                      currentLogoUrl={event.logo_url}
                      trigger={
                        <button
                          type="button"
                          className="group relative h-12 w-12 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                          title="Klik untuk mengubah logo kejuaraan"
                        >
                          <EventLogoImage
                            src={event.logo_url}
                            alt={event.name}
                            className="h-full w-full object-contain p-1"
                            fallbackIconClassName="h-6 w-6 text-blue-600"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="h-3.5 w-3.5" />
                          </div>
                        </button>
                      }
                    />
                    <div>
                      <h3 className="font-bold leading-snug text-[var(--m-ink)]">{event.name}</h3>
                      <p className="text-xs font-medium text-[var(--m-muted)] mt-0.5">
                        {event.organizer || 'Panitia Pelaksana'}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-[var(--m-aqua-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--m-aqua-ink)]">
                    {event.lane_count || 8} Lintasan
                  </span>
                </div>

                <div className="space-y-2 border-y border-[var(--m-border)] py-4 text-xs text-[var(--m-muted)]">
                  {event.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--m-aqua-ink)]" /> {event.location}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-[var(--m-aqua-ink)]" />
                    {event.start_date} s/d {event.end_date}
                  </p>
                  <p className="flex items-center gap-2">
                    <Waves className="h-4 w-4 shrink-0 text-[var(--m-aqua-ink)]" />
                    {event.pool_type || 'Long Course'} ({event.pool_length_meters || 50}m)
                  </p>
                </div>

                <p className="text-xs text-[var(--m-muted)]">
                  {compCountByEvent.get(event.id) || 0} Nomor Lomba
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 px-5 pb-5">
                <Link
                  href={`/events/${event.id}`}
                  className="w-full rounded-xl bg-[var(--m-aqua)] px-2 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[var(--m-aqua-ink)]"
                >
                  Kelola
                </Link>
                <Link
                  href={`/events/${event.id}#atur-acara`}
                  className="w-full rounded-xl border border-[var(--m-border)] bg-white px-2 py-2 text-center text-xs font-semibold text-[var(--m-ink)] transition-colors hover:border-[var(--m-aqua)]"
                >
                  Acara
                </Link>
                <EventLogoDialog
                  eventId={event.id}
                  eventName={event.name}
                  currentLogoUrl={event.logo_url}
                  trigger={
                    <button
                      type="button"
                      className="w-full rounded-xl border border-[var(--m-border)] bg-white px-2 py-2 text-center text-xs font-semibold text-[var(--m-ink)] transition-colors hover:border-primary hover:text-primary flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5 text-primary" /> Logo
                    </button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
