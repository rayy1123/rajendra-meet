import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layers, Clock, Radio, Waves } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface CompEventRow {
  id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: string;
  grade_level: string;
  class_name: string;
}

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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kejuaraan / Events', href: '/events' }, { label: event.name }]} className="mb-2" />
      <PageHeader
        title={event.name}
        description={event.organizer || 'Panitia Pelaksana'}
      />

      <div className="glass-panel p-6">
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--m-muted)]">
          {event.location && (
            <span className="flex items-center gap-1.5"><Waves className="h-4 w-4" /> {event.location}</span>
          )}
          <span>{event.start_date} s/d {event.end_date}</span>
          <span>{event.pool_type} ({event.pool_length_meters}m)</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/heats?eventId=${event.id}`} className="inline-flex items-center gap-2 rounded-lg bg-[var(--m-aqua)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--m-aqua-ink)]">
            <Layers className="h-4 w-4" /> Atur Acara
          </Link>
          <Link href={`/results?eventId=${event.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[var(--m-border)] px-4 py-2 text-sm font-semibold text-[var(--m-ink)] transition-ui hover:border-[var(--m-muted)]">
            <Clock className="h-4 w-4" /> Input Hasil
          </Link>
          <Link href={`/public-live/${event.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-[var(--m-border)] px-4 py-2 text-sm font-semibold text-[var(--m-ink)] transition-ui hover:border-[var(--m-muted)]">
            <Radio className="h-4 w-4" /> Buka Live Board
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--m-border)] bg-[var(--m-soft)] p-6">
        <h2 className="mb-2 text-lg font-semibold">Nomor Lomba ({compEvents?.length || 0})</h2>
        {!compEvents || compEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada nomor lomba. Tambahkan lewat menu yang sesuai.</p>
        ) : (
          <div className="divide-y">
            {compEvents.map((ce: CompEventRow) => (
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
