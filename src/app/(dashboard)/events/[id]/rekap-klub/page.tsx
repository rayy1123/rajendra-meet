import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { School } from 'lucide-react';
import {
  ClubRosterReport,
  type RegistrationClubRecord,
} from '@/components/modules/club-roster-report';
import { getEventSettings } from '@/lib/data/event-settings-server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EventClubRosterPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Ambil data event
  const { data: rawEvent } = await supabase
    .from('events')
    .select('id, name, organizer, location, start_date, end_date, pool_type, pool_length_meters, lane_count, fee_per_event, bank_name, bank_account_no, bank_account_name')
    .eq('id', id)
    .single();

  if (!rawEvent) notFound();

  const savedSettings = getEventSettings(id);
  const event = {
    ...rawEvent,
    ...savedSettings,
  };

  // 2. Ambil seluruh kejuaraan untuk switcher
  const { data: allEvents } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });

  // 3. Ambil data sekolah / klub
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, city')
    .order('name', { ascending: true });

  // 4. Ambil seluruh pendaftaran di event ini beserta atlet, klub, nomor lomba, & verifikasi bayar
  const { data: rawRegistrations } = await supabase
    .from('registrations')
    .select(`
      id,
      seed_time_ms,
      athletes!inner (
        id,
        athlete_number,
        full_name,
        gender,
        birth_date,
        age_group,
        grade_level,
        school_id,
        schools (
          id,
          name,
          city
        )
      ),
      competition_events!inner (
        id,
        order_no,
        name,
        stroke,
        distance_meters,
        gender
      ),
      payment_verifications (
        id,
        status,
        amount_due
      )
    `)
    .eq('event_id', id);

  const registrations = (rawRegistrations || []).map((r: any) => ({
    id: r.id,
    seed_time_ms: r.seed_time_ms,
    athletes: r.athletes,
    competition_events: r.competition_events,
    payment_verifications: Array.isArray(r.payment_verifications)
      ? r.payment_verifications[0] || null
      : r.payment_verifications || null,
  })) as RegistrationClubRecord[];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Kejuaraan / Events', href: '/events' },
            { label: event.name, href: `/events/${event.id}` },
            { label: 'Rekap Atlet per Klub (PDF)' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title={`Rekapitulasi Kontingen: ${event.name}`}
          description="Daftar atlet yang dikirim per sekolah/klub beserta status pembayaran pendaftaran kejuaraan ini (Format Cetak PDF Resmi)."
          icon={<School className="h-6 w-6" />}
        />
      </div>

      <ClubRosterReport
        event={event}
        eventsList={(allEvents || []).map((e) => ({ id: e.id, name: e.name }))}
        schools={schools || []}
        registrations={registrations}
        lockEvent={false}
        backHref={`/events/${event.id}`}
      />
    </div>
  );
}
