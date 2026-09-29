import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/layout';
import {
  UserDashboardView,
  type UserAthleteItem,
  type UserRegistrationItem,
  type ActiveChampionshipSpotlight,
} from '@/components/modules/user-dashboard-view';
import { getEventSettings } from '@/lib/data/event-settings-server';
import { getKuCode } from '@/lib/age-category';

export const dynamic = 'force-dynamic';

const ZERO = '00000000-0000-0000-0000-000000000000';

export default async function DashboardViewerPage() {
  const { supabase, profile, user } = await requireUser();

  const userRole =
    (profile as any)?.role ||
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
  ];
  if (ADMIN_ROLES.includes(userRole)) {
    redirect('/dashboard');
  }

  const fullName = (profile as any)?.full_name || 'Pengguna';
  const username = (profile as any)?.username || 'pengguna';
  const avatarUrl = (profile as any)?.avatar_url || null;
  const viewerId = (profile as any)?.id || user.id;

  // 1. Ambil data atlet binaan milik user
  const { data: rawAthletes } = await supabase
    .from('athletes')
    .select(`
      id,
      full_name,
      athlete_number,
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
    `)
    .eq('owner_id', viewerId)
    .order('created_at', { ascending: false });

  const myAthleteIds = (rawAthletes || []).map((a: any) => a.id);

  // 2. Ambil data registrasi nomor lomba atlet binaan
  let userRegistrationsQuery = supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      athlete_id,
      competition_event_id,
      seed_time_ms,
      created_at,
      events (
        id,
        name,
        location,
        start_date,
        end_date
      ),
      competition_events (
        id,
        name,
        stroke,
        distance_meters,
        gender,
        age_group
      ),
      athletes (
        id,
        full_name,
        athlete_number,
        gender,
        age_group
      ),
      payment_verifications (
        id,
        status,
        amount_due
      )
    `)
    .order('created_at', { ascending: false });

  if (myAthleteIds.length > 0) {
    userRegistrationsQuery = userRegistrationsQuery.or(
      `registrant_id.eq.${viewerId},athlete_id.in.(${myAthleteIds.join(',')})`
    );
  } else {
    userRegistrationsQuery = userRegistrationsQuery.eq('registrant_id', viewerId);
  }

  // 3. Ambil event aktif terdekat & total event yang dipublikasikan
  const [{ data: rawRegistrations }, { data: latestEvent }, { count: totalEventsCount }] =
    await Promise.all([
      userRegistrationsQuery,
      supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
    ]);

  // Hitung jumlah pendaftaran per atlet
  const regCountByAthlete = new Map<string, number>();
  (rawRegistrations || []).forEach((r: any) => {
    if (r.athlete_id) {
      regCountByAthlete.set(r.athlete_id, (regCountByAthlete.get(r.athlete_id) || 0) + 1);
    }
  });

  // Normalisasi data atlet binaan
  const athletes: UserAthleteItem[] = (rawAthletes || []).map((a: any) => {
    const rawSchool = Array.isArray(a.schools) ? a.schools[0] : a.schools;
    return {
      id: a.id,
      fullName: a.full_name || 'Atlet',
      athleteNumber: a.athlete_number || '#ATH-001',
      gender: a.gender || 'male',
      birthDate: a.birth_date || '',
      ageGroup: a.birth_date ? getKuCode(a.birth_date) : (a.age_group || a.grade_level || 'Umum'),
      gradeLevel: a.grade_level || null,
      schoolName: rawSchool?.name || 'Klub Mandiri',
      registrationCount: regCountByAthlete.get(a.id) || 0,
    };
  });

  // Normalisasi data registrasi nomor lomba
  const registrations: UserRegistrationItem[] = (rawRegistrations || []).map((r: any) => {
    const rawEvent = Array.isArray(r.events) ? r.events[0] : r.events;
    const rawComp = Array.isArray(r.competition_events) ? r.competition_events[0] : r.competition_events;
    const rawAth = Array.isArray(r.athletes) ? r.athletes[0] : r.athletes;
    const rawPay = Array.isArray(r.payment_verifications) ? r.payment_verifications[0] : r.payment_verifications;

    const payStatus = rawPay?.status || 'pending';

    return {
      id: r.id,
      eventId: rawEvent?.id || r.event_id || '',
      eventName: rawEvent?.name || 'Kejuaraan Renang',
      compEventName: rawComp?.name || 'Nomor Perlombaan',
      athleteName: rawAth?.full_name || 'Atlet',
      athleteNumber: rawAth?.athlete_number || '–',
      gender: rawComp?.gender || rawAth?.gender || 'male',
      ageGroup: rawComp?.age_group || rawAth?.age_group || 'KU I',
      seedTimeMs: r.seed_time_ms || null,
      amountDue: Number(rawPay?.amount_due) || 50000,
      paymentStatus: payStatus as any,
      createdAt: r.created_at,
    };
  });

  // Spotlight Event Aktif
  let activeEvent: ActiveChampionshipSpotlight | null = null;
  if (latestEvent) {
    const saved = getEventSettings(latestEvent.id);
    const { count: compCount } = await supabase
      .from('competition_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', latestEvent.id);

    activeEvent = {
      id: latestEvent.id,
      name: latestEvent.name,
      organizer: latestEvent.organizer || 'Panitia Pelaksana Rajendra Meet',
      location: latestEvent.location || 'Kolam Renang Resmi',
      startDate: latestEvent.start_date,
      endDate: latestEvent.end_date,
      poolType: latestEvent.pool_type || 'Olympic 50m',
      poolLengthMeters: latestEvent.pool_length_meters || 50,
      laneCount: latestEvent.lane_count || 8,
      feePerEvent: saved?.fee_per_event || latestEvent.fee_per_event || 50000,
      compEventCount: compCount || 0,
    };
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <UserDashboardView
          userProfile={{
            id: viewerId,
            fullName,
            username,
            avatarUrl,
            role: userRole,
            email: user.email,
          }}
          athletes={athletes}
          registrations={registrations}
          activeEvent={activeEvent}
          totalPublishedEvents={totalEventsCount || 0}
        />
      </div>
    </DashboardLayout>
  );
}
