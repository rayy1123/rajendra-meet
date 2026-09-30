import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  DaftarLombaDirectory,
  type ChampionshipEventItem,
} from '@/components/modules/daftar-lomba-directory';
import { getEventSettings } from '@/lib/data/event-settings-server';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole =
    (profile?.role as string) ||
    (user as any)?.user_metadata?.role ||
    (user as any)?.app_metadata?.role ||
    'viewer';

  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
    'admin_technical',
    'admin-technical',
  ];
  if (ADMIN_ROLES.includes(userRole)) {
    redirect('/events');
  }

  // 1. Ambil data seluruh event kejuaraan (sama lengkapnya seperti pada buku acara)
  let rawEvents: any[] = [];
  const { data: allEvents } = await supabase
    .from('events')
    .select('id, name, location, organizer, start_date, end_date, lane_count, pool_type, pool_length_meters, logo_url')
    .order('start_date', { ascending: false });

  if (allEvents && allEvents.length > 0) {
    rawEvents = allEvents;
  } else {
    // Fallback minimal jika kolom opsional berbeda
    const { data: basicEvents } = await supabase
      .from('events')
      .select('id, name, location, start_date, end_date, lane_count, pool_type')
      .order('start_date', { ascending: false });
    rawEvents = basicEvents || [];
  }

  // 2. Ambil data jumlah nomor lomba & registrasi peserta per event
  const [{ data: compEvents }, { data: registrations }] = await Promise.all([
    supabase.from('competition_events').select('id, event_id'),
    supabase.from('registrations').select('id, event_id'),
  ]);

  const compCountMap = new Map<string, number>();
  (compEvents || []).forEach((c: any) => {
    if (c.event_id) {
      compCountMap.set(c.event_id, (compCountMap.get(c.event_id) || 0) + 1);
    }
  });

  const regCountMap = new Map<string, number>();
  (registrations || []).forEach((r: any) => {
    if (r.event_id) {
      regCountMap.set(r.event_id, (regCountMap.get(r.event_id) || 0) + 1);
    }
  });

  // 3. Gabungkan dengan setting lokal per event (biaya, rekening, status override dsb.)
  const events: ChampionshipEventItem[] = (rawEvents || []).map((ev: any) => {
    const saved = getEventSettings(ev.id);
    return {
      id: ev.id,
      name: ev.name,
      organizer: ev.organizer || 'Panitia Pelaksana Rajendra Swim System',
      location: ev.location || 'Gelanggang Renang Resmi',
      start_date: ev.start_date,
      end_date: ev.end_date,
      lane_count: ev.lane_count || 8,
      pool_type: ev.pool_type || 'Olympic Course',
      pool_length_meters: ev.pool_length_meters || 50,
      fee_per_event: saved?.fee_per_event || 50000,
      max_participants: 800,
      logo_url: saved?.logo_url || ev.logo_url || null,
      bank_name: saved?.bank_name || 'BCA',
      status_override: saved?.status_override || null,
      compEventCount: compCountMap.get(ev.id) || 0,
      registrationCount: regCountMap.get(ev.id) || 0,
    };
  });

  return (
    <DashboardLayout role={userRole}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard-viewer' },
            { label: 'Daftar Nomor Lomba' },
          ]}
          className="mb-2"
        />

        <DaftarLombaDirectory events={events} />
      </div>
    </DashboardLayout>
  );
}
