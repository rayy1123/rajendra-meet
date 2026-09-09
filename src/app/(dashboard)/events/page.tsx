import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MapPin, CalendarDays, ExternalLink, Trophy, Waves } from 'lucide-react';
import Link from 'next/link';
import { ProfileMenu } from '@/components/layout/logout-button';
import { Button } from '@/components/ui/button';

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
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kejuaraan / Events' }]} className="mb-2" />
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-gradient-hero">Kejuaraan / Events</h1>
            <p className="text-sm text-muted-foreground">
              Kelola kejuaraan renang, pengaturan kolam, dan jadwal perlombaan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/scoreboard" target="_blank">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Live Scoreboard
            </Button>
          </Link>
          <ProfileMenu />
          <Link href="/events/new">
            <Button className="gap-2">
              Buat Event Baru
            </Button>
          </Link>
        </div>
      </div>

      {!events || events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Waves className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">
              Belum ada event kejuaraan yang dibuat.
            </p>
            <Link href="/events/new">
              <Button className="gap-2">
                Buat Event Baru
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="glass-panel elevated transition-ui hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold leading-snug text-[var(--m-ink)]">{event.name}</h3>
                  <span className="shrink-0 rounded-lg bg-[var(--m-aqua-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--m-aqua-ink)]">
                    {event.lane_count || 8} Lintasan
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--m-muted)]">
                  {event.organizer || 'Panitia Pelaksana'}
                </p>

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

              <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                <Link
                  href={`/events/${event.id}`}
                  className="w-full rounded-xl bg-[var(--m-aqua)] px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[var(--m-aqua-ink)]"
                >
                  Kelola Event
                </Link>
                <Link
                  href={`/heats?eventId=${event.id}`}
                  className="w-full rounded-xl border border-[var(--m-border)] bg-white px-3 py-2 text-center text-xs font-semibold text-[var(--m-ink)] transition-colors hover:border-[var(--m-aqua)]"
                >
                  Atur Acara
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
