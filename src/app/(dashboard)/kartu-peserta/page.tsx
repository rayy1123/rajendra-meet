import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { IdCard } from 'lucide-react';
import {
  ParticipantCardManager,
  type ParticipantCardData,
  type ParticipantCardRaceItem,
} from '@/components/modules/participant-card-manager';
import { getKuCode, formatKuDisplay } from '@/lib/age-category';

export const dynamic = 'force-dynamic';

export default async function KartuPesertaPage({
  searchParams,
}: {
  searchParams: Promise<{ athleteId?: string; eventId?: string }>;
}) {
  const { athleteId, eventId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/kartu-peserta');
  }

  // 1. Dapatkan peran user untuk menentukan apakah admin atau viewer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole =
    (profile?.role as string) ||
    (user.user_metadata?.role as string) ||
    (user.app_metadata?.role as string) ||
    'viewer';

  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // 2. Query pendaftaran registrasi beserta atlet, nomor lomba, event, & heat assignment
  let query = supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      athlete_id,
      competition_event_id,
      seed_time_ms,
      created_at,
      events:event_id (
        id,
        name,
        organizer,
        location,
        start_date,
        end_date,
        pool_type
      ),
      athletes (
        id,
        athlete_number,
        full_name,
        gender,
        birth_date,
        age_group,
        schools (
          id,
          name
        )
      ),
      competition_events (
        id,
        order_no,
        name,
        stroke,
        distance_meters,
        gender,
        events:event_id (
          id,
          name,
          organizer,
          location,
          start_date,
          end_date
        )
      ),
      heat_assignments (
        id,
        lane_number,
        heats (
          id,
          heat_number
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Filter event jika diberikan via parameter URL
  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  // Filter athlete jika diberikan via parameter URL
  if (athleteId) {
    query = query.eq('athlete_id', athleteId);
  }

  // Jika bukan admin dan tidak ada filter spesifik, batasi ke atlet binaan user
  if (!isAdmin && !athleteId) {
    const { data: userAthletes } = await supabase
      .from('athletes')
      .select('id')
      .eq('owner_id', user.id);

    const ownedAthleteIds = (userAthletes || []).map((a) => a.id);

    if (ownedAthleteIds.length > 0) {
      query = query.or(`registrant_id.eq.${user.id},athlete_id.in.(${ownedAthleteIds.join(',')})`);
    } else {
      query = query.eq('registrant_id', user.id);
    }
  }

  // Ambil data registrasi dan data verifikasi pembayaran secara paralel
  const [{ data: rawRegistrations }, { data: paymentsData }] = await Promise.all([
    query,
    supabase.from('payment_verifications').select('id, registration_id, status, amount_due'),
  ]);

  // Map status pembayaran berdasarkan registration_id
  const payMap = new Map<string, { id: string; status: string; amount_due: number }>();
  (paymentsData || []).forEach((p: any) => {
    if (p.registration_id) {
      payMap.set(p.registration_id, {
        id: p.id,
        status: p.status || 'pending',
        amount_due: Number(p.amount_due) || 0,
      });
    }
  });

  // 3. Kelompokkan pendaftaran per [atlet + event] sehingga 1 kartu memuat semua nomor lomba yang diikuti
  const cardMap = new Map<string, ParticipantCardData>();

  (rawRegistrations || []).forEach((row: any) => {
    const rawAth = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes;
    const rawComp = Array.isArray(row.competition_events) ? row.competition_events[0] : row.competition_events;
    const rawEvent = Array.isArray(row.events) ? row.events[0] : (row.events || rawComp?.events);
    const rawHeatAssign = Array.isArray(row.heat_assignments) ? row.heat_assignments[0] : row.heat_assignments;
    const rawHeat = Array.isArray(rawHeatAssign?.heats) ? rawHeatAssign?.heats[0] : rawHeatAssign?.heats;
    const payInfo = payMap.get(row.id);

    if (!rawAth) return;

    const athleteIdStr = rawAth.id;
    const eventIdStr = rawEvent?.id || row.event_id || 'general-event';
    const groupKey = `${athleteIdStr}_${eventIdStr}`;

    const rawSchool = Array.isArray(rawAth.schools) ? rawAth.schools[0] : rawAth.schools;

    const isVerified = payInfo?.status === 'verified';

    const athleteKuStr = formatKuDisplay(
      rawAth.birth_date ? getKuCode(rawAth.birth_date) : rawAth.age_group
    );

    const raceItem: ParticipantCardRaceItem = {
      registrationId: row.id,
      orderNo: rawComp?.order_no || null,
      eventName: rawComp?.name || 'Nomor Perlombaan',
      stroke: rawComp?.stroke || 'freestyle',
      distanceMeters: rawComp?.distance_meters || 50,
      gender: rawComp?.gender || rawAth.gender || 'male',
      ageGroup: athleteKuStr,
      seedTimeMs: row.seed_time_ms,
      paymentStatus: payInfo?.status || 'pending',
      isVerified,
      heatNumber: rawHeat?.heat_number || null,
      laneNumber: rawHeatAssign?.lane_number || null,
    };

    if (!cardMap.has(groupKey)) {
      cardMap.set(groupKey, {
        cardId: groupKey,
        athlete: {
          id: rawAth.id,
          athleteNumber: rawAth.athlete_number || 'AT-00000',
          fullName: rawAth.full_name || 'Nama Atlet',
          gender: rawAth.gender || 'male',
          birthDate: rawAth.birth_date || '',
          ageGroup: athleteKuStr,
          schoolName: rawSchool?.name || 'Klub / Kontingen Mandiri',
        },
        event: {
          id: eventIdStr,
          name: rawEvent?.name || 'Kejuaraan Renang Rajendra Swim System',
          organizer: rawEvent?.organizer || 'Panitia Pelaksana Rajendra Swim System',
          location: rawEvent?.location || 'Kolam Renang Resmi',
          startDate: rawEvent?.start_date || '',
          endDate: rawEvent?.end_date || '',
          poolType: rawEvent?.pool_type || 'Olympic 50m',
        },
        races: [raceItem],
        allVerified: isVerified,
        anyVerified: isVerified,
        totalRaces: 1,
      });
    } else {
      const existing = cardMap.get(groupKey)!;
      existing.races.push(raceItem);
      existing.totalRaces = existing.races.length;
      if (!isVerified) existing.allVerified = false;
      if (isVerified) existing.anyVerified = true;
    }
  });

  const cardsList = Array.from(cardMap.values());

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-0 print:m-0 print:max-w-none">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Kartu Peserta' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Cetak Kartu Tanda Peserta"
          description="Cetak kartu ID resmi atlet yang memuat rincian lengkap nomor perlombaan yang diikuti dan QR Code verifikasi Call Room."
          icon={<IdCard className="h-6 w-6" />}
        />
      </div>

      <ParticipantCardManager
        cards={cardsList}
        initialAthleteId={athleteId || null}
        initialEventId={eventId || null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
