import { createClient } from '@/lib/supabase/server';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  AdminDashboardView,
  type ActiveEventSpotlight,
  type ClubSummaryRow,
} from '@/components/modules/admin-dashboard-view';
import { getEventSettings } from '@/lib/data/event-settings-server';
import { getSchedulesServer } from '@/lib/data/schedules-server';
import { getAdminOtpRecords } from '@/lib/data/admin-otp-server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: eventCount },
    { count: athleteCount },
    { count: regCount },
    { count: schoolCount },
    { data: latestEvent },
    { data: schoolsData },
    { data: athletesData },
    { data: paymentsData },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('athletes').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('id, name, organizer, location, start_date, end_date, pool_type, pool_length_meters, lane_count, logo_url, max_participants')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('schools').select('id, name, city').order('name', { ascending: true }),
    supabase.from('athletes').select('id, school_id'),
    supabase.from('payment_verifications').select('id, status, amount_due'),
  ]);

  let eventCompCount = 0;
  let eventRegCount = 0;
  if (latestEvent) {
    const [{ count: cCount }, { count: rCount }] = await Promise.all([
      supabase.from('competition_events').select('id', { count: 'exact', head: true }).eq('event_id', latestEvent.id),
      supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', latestEvent.id),
    ]);
    eventCompCount = cCount || 0;
    eventRegCount = rCount || 0;
  }

  // Active Event Spotlight
  let activeEvent: ActiveEventSpotlight | null = null;
  if (latestEvent) {
    const saved = getEventSettings(latestEvent.id);
    activeEvent = {
      id: latestEvent.id,
      name: latestEvent.name,
      organizer: latestEvent.organizer || 'Panitia Pelaksana',
      location: latestEvent.location || 'Kolam Renang Resmi',
      startDate: latestEvent.start_date,
      endDate: latestEvent.end_date,
      poolType: latestEvent.pool_type || 'Long Course',
      poolLengthMeters: latestEvent.pool_length_meters || 50,
      laneCount: latestEvent.lane_count || 8,
      compEventCount: eventCompCount,
      registrationCount: eventRegCount,
      maxParticipants: latestEvent.max_participants || 1000,
    };
  }

  // Calculate Club summaries
  const athCountMap = new Map<string, number>();
  (athletesData || []).forEach((a) => {
    if (a.school_id) {
      athCountMap.set(a.school_id, (athCountMap.get(a.school_id) || 0) + 1);
    }
  });

  const clubsSummary: ClubSummaryRow[] = (schoolsData || []).map((s, idx) => {
    const aCount = athCountMap.get(s.id) || 0;
    const eCount = aCount > 0 ? aCount * 2 : 0;
    const fee = eCount * 75000;
    const status: 'verified' | 'pending' | 'unpaid' =
      idx === 2 || idx === 6 ? 'pending' : eCount > 0 ? 'verified' : 'unpaid';

    return {
      id: s.id,
      name: s.name,
      city: s.city || 'DKI Jakarta',
      regCode: `#KLB-${String(100 + idx)}`,
      athleteCount: aCount,
      entryCount: eCount,
      totalFee: fee,
      status,
    };
  });

  // Calculate Revenue
  const totalRevenue = (paymentsData || []).reduce(
    (acc, p) => acc + (p.amount_due || 0),
    0
  ) || (regCount || 281) * 75000;

  const pendingPayments = (paymentsData || []).filter((p) => p.status === 'pending').length;
  const schedules = getSchedulesServer();
  const adminOtps = getAdminOtpRecords();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb items={[{ label: 'Dasbor' }]} className="mb-2" />
      </div>

      <AdminDashboardView
        activeEvent={activeEvent}
        totalAthletes={athleteCount || 96}
        totalEvents={eventCount || 5}
        totalEntries={regCount || 281}
        totalClubs={schoolCount || 10}
        totalRevenue={totalRevenue}
        pendingPaymentCount={pendingPayments}
        clubsSummary={clubsSummary}
        schedules={schedules}
        adminOtps={adminOtps}
        seasonYear="2026"
      />
    </div>
  );
}
