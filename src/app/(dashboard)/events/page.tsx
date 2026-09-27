import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  EventsDirectoryManager,
  type EventItemData,
} from '@/components/modules/events-directory-manager';
import { getEventSettings } from '@/lib/data/event-settings-server';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil seluruh data event
  const { data: rawEvents } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false });

  // 2. Ambil data nomor lomba & registrasi per event
  const [{ data: compEvents }, { data: registrations }, { count: schoolCount }, { count: athleteCount }] =
    await Promise.all([
      supabase.from('competition_events').select('id, event_id'),
      supabase.from('registrations').select('id, event_id'),
      supabase.from('schools').select('*', { count: 'exact', head: true }),
      supabase.from('athletes').select('*', { count: 'exact', head: true }),
    ]);

  const compCountMap = new Map<string, number>();
  (compEvents || []).forEach((c) => {
    if (c.event_id) {
      compCountMap.set(c.event_id, (compCountMap.get(c.event_id) || 0) + 1);
    }
  });

  const regCountMap = new Map<string, number>();
  (registrations || []).forEach((r) => {
    if (r.event_id) {
      regCountMap.set(r.event_id, (regCountMap.get(r.event_id) || 0) + 1);
    }
  });

  // Gabungkan dengan settings lokal (logo, fee, dsb)
  const events: EventItemData[] = (rawEvents || []).map((ev) => {
    const saved = getEventSettings(ev.id);
    return {
      ...ev,
      ...saved,
      logo_url: saved?.logo_url || ev.logo_url || null,
      fee_per_event: saved?.fee_per_event || ev.fee_per_event || 50000,
      compEventCount: compCountMap.get(ev.id) || 0,
      registrationCount: regCountMap.get(ev.id) || 0,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Kejuaraan / Events' }]}
          className="mb-2"
        />
      </div>

      <EventsDirectoryManager
        events={events}
        totalSchoolsCount={schoolCount || 0}
        totalAthletesCount={athleteCount || 0}
        totalRegistrationsCount={(registrations || []).length}
      />
    </div>
  );
}
