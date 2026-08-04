import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, Clock, Radio, Waves } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from('events').select('*').eq('id', id).single();
  if (!event) notFound();

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', id)
    .order('distance_meters', { ascending: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Event
      </Link>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="text-sm text-muted-foreground">{event.organizer || 'Panitia Pelaksana'}</p>
          </div>
          <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {event.lane_count || 8} Lintasan
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {event.location && (
            <span className="flex items-center gap-1.5"><Waves className="h-4 w-4" /> {event.location}</span>
          )}
          <span>{event.start_date} s/d {event.end_date}</span>
          <span>{event.pool_type} ({event.pool_length_meters}m)</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/heats?eventId=${event.id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Layers className="h-4 w-4" /> Atur Heat
          </Link>
          <Link href={`/results?eventId=${event.id}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold">
            <Clock className="h-4 w-4" /> Input Hasil
          </Link>
          <Link href={`/public-live/${event.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold">
            <Radio className="h-4 w-4" /> Buka Live Board
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Nomor Lomba ({compEvents?.length || 0})</h2>
        {!compEvents || compEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada nomor lomba. Tambahkan lewat menu yang sesuai.</p>
        ) : (
          <div className="divide-y">
            {compEvents.map((ce: any) => (
              <div key={ce.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {ce.distance_meters}m {ce.stroke} {ce.grade_level}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ce.gender === 'female' ? 'Putri' : 'Putra'}
                    {ce.class_name ? ` · ${ce.class_name}` : ''}
                  </p>
                </div>
                <Link href={`/results?eventId=${event.id}&compEventId=${ce.id}`} className="text-sm font-medium text-primary hover:underline">
                  Input Hasil →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
