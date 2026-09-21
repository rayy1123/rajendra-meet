import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  PartisipasiEventDetail,
  type ParticipantItem,
} from '@/components/modules/partisipasi-event-detail';

export const dynamic = 'force-dynamic';

export default async function PartisipasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Ambil data event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (!event) {
    notFound();
  }

  // 2. Ambil seluruh klub/sekolah
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  // 3. Ambil data partisipasi / registrasi atlet
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      seed_time_ms,
      athletes (
        id,
        full_name,
        gender,
        school_id,
        schools (id, name)
      ),
      competition_events (
        id,
        name
      )
    `)
    .eq('event_id', id);

  const participants: ParticipantItem[] = (registrations || []).map((r: any) => {
    return {
      id: r.id,
      athlete_name: r.athletes?.full_name || 'Atlet',
      club_id: r.athletes?.school_id || 'unknown',
      club_name: r.athletes?.schools?.name || 'Klub Independen',
      comp_event_name: r.competition_events?.name || 'Nomor Lomba',
      seed_time: r.seed_time_ms ? `${(r.seed_time_ms / 1000).toFixed(2)}s` : null,
      gender: r.athletes?.gender || 'male',
    };
  });

  const eventWithDates = {
    ...event,
    tm_date: event.start_date
      ? new Date(new Date(event.start_date).getTime() - 86400000).toISOString().slice(0, 10)
      : undefined,
    reg_start_date: event.start_date
      ? new Date(new Date(event.start_date).getTime() - 86400000 * 30).toISOString().slice(0, 10)
      : undefined,
    reg_end_date: event.start_date
      ? new Date(new Date(event.start_date).getTime() - 86400000 * 2).toISOString().slice(0, 10)
      : undefined,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Daftar Perlombaan', href: '/perlombaan' },
          { label: 'Partisipasi & Detail', href: `/perlombaan/partisipasi/${id}` },
        ]}
      />

      <PartisipasiEventDetail
        event={eventWithDates}
        participants={participants}
        clubs={schools || []}
      />
    </div>
  );
}
