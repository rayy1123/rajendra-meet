import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { CompEventPicker } from '@/components/modules/comp-event-picker';
import type { CompEvent } from '@/components/modules/leaderboard-view';
import { CalendarDays, MapPin, Waves } from 'lucide-react';
import Link from 'next/link';

interface EventCardData {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  lane_count: number | null;
  pool_type: string | null;
}

export const dynamic = 'force-dynamic';

export default async function ScoreboardPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type')
    .order('start_date', { ascending: false });

  return (
    <PublicShell
      title="Scoreboard Kejuaraan"
      subtitle="Pantau hasil perlombaan secara langsung. Pilih kejuaraan, lalu pilih nomor lomba (acara) untuk melihat peringkat lintas heat."
    >
      <div className="pub-container pb-16">
        {/* Daftar kejuaraan */}
        {!events || events.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada kejuaraan</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Panitia belum mempublikasikan kejuaraan apa pun.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

function EventCard({ event }: { event: EventCardData }) {
  return (
    <div className="pub-card flex flex-col gap-4 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-[var(--m-ink)] leading-snug">{event.name}</h3>
        <span className="pub-chip shrink-0">{event.lane_count || 8} lintasan</span>
      </div>

      <div className="space-y-1.5 text-sm text-[var(--m-muted)]">
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--m-aqua)]" /> {event.location}
          </p>
        )}
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--m-aqua)]" />
          {event.start_date} s/d {event.end_date}
        </p>
        {event.pool_type && (
          <p className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-[var(--m-aqua)]" /> {event.pool_type}
          </p>
        )}
      </div>

      <EventScoreboard eventId={event.id} />
    </div>
  );
}

// Ambil nomor lomba per event dan tampilkan sebagai satu pemilih acara yang rapi.
async function EventScoreboard({ eventId }: { eventId: string }) {
  const supabase = await createClient();
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', eventId)
    .order('distance_meters', { ascending: true });

  return (
    <div className="mt-auto">
      <CompEventPicker eventId={eventId} compEvents={(compEvents ?? []) as CompEvent[]} />
      <Link
        href={`/public-live/${eventId}`}
        className="pub-btn-ghost mt-3 w-full"
      >
        Buka Live Board lengkap
      </Link>
    </div>
  );
}
