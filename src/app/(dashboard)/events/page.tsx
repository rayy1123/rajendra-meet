import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Waves, Plus, MapPin, CalendarDays, ExternalLink, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/layout/logout-button';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function EventsPage() {
  const supabase = await createClient();

  // 1. Cek User Session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch Data Events dari Supabase
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  // 3. Hitung jumlah nomor lomba per event untuk ringkasan
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
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kejuaraan / Events</h1>
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
          <LogoutButton />
          <Link href="/events/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Buat Event Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Event Cards Grid */}
      {!events || events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Waves className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">
              Belum ada event kejuaraan yang dibuat.
            </p>
            <Link href="/events/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Buat Event Baru
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-snug text-foreground">{event.name}</h3>
                  <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {event.lane_count || 8} Lintasan
                  </span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {event.organizer || 'Panitia Pelaksana'}
                </p>

                <div className="space-y-1.5 border-y border-border py-3 text-xs text-muted-foreground">
                  {event.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" /> {event.location}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    {event.start_date} s/d {event.end_date}
                  </p>
                  <p className="flex items-center gap-2">
                    <Waves className="h-4 w-4 shrink-0 text-primary" />
                    {event.pool_type || 'Long Course'} ({event.pool_length_meters || 50}m)
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  {compCountByEvent.get(event.id) || 0} Nomor Lomba
                </p>
              </CardContent>

              <div className="grid grid-cols-2 gap-2 px-5 pb-5">
                <Link
                  href={`/events/${event.id}`}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Kelola Event
                </Link>
                <Link
                  href={`/heats?eventId=${event.id}`}
                  className="w-full rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors hover:bg-accent"
                >
                  Atur Acara
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
