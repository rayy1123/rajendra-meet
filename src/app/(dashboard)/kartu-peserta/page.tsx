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

export const dynamic = 'force-dynamic';

export default async function KartuPesertaPage({
  searchParams,
}: {
  searchParams: Promise<{ athleteId?: string; eventId?: string }>;
}) {
  const { athleteId } = await searchParams;
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

  // 2. Query pendaftaran: jika admin tampilkan seluruh pendaftaran di event, jika viewer hanya atlet binaannya
  let query = supabase
    .from('registrations')
    .select(`
      id,
      seed_time_ms,
      payment_status,
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
      ),
      payment_verifications (
        id,
        status,
        amount_due
      )
    `)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
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

  const { data: rawRegistrations } = await query;

  // 3. Kelompokkan pendaftaran per [atlet + event] sehingga 1 kartu memuat semua nomor lomba yang diikuti
  const cardMap = new Map<string, ParticipantCardData>();

  (rawRegistrations || []).forEach((row) => {
    const rawAth = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes;
    const rawComp = Array.isArray(row.competition_events) ? row.competition_events[0] : row.competition_events;
    const rawEvent = Array.isArray(row.events) ? row.events[0] : (row.events || rawComp?.events);
    const rawHeatAssign = Array.isArray(row.heat_assignments) ? row.heat_assignments[0] : row.heat_assignments;
    const rawHeat = Array.isArray(rawHeatAssign?.heats) ? rawHeatAssign?.heats[0] : rawHeatAssign?.heats;
    const rawPay = Array.isArray(row.payment_verifications) ? row.payment_verifications[0] : row.payment_verifications;

    if (!rawAth) return;

    const athleteIdStr = rawAth.id;
    const eventIdStr = rawEvent?.id || 'general-event';
    const groupKey = `${athleteIdStr}_${eventIdStr}`;

    const rawSchool = Array.isArray(rawAth.schools) ? rawAth.schools[0] : rawAth.schools;

    const isVerified = rawPay?.status === 'verified' || row.payment_status === 'verified';

    const raceItem: ParticipantCardRaceItem = {
      registrationId: row.id,
      orderNo: rawComp?.order_no || null,
      eventName: rawComp?.name || 'Nomor Perlombaan',
      stroke: rawComp?.stroke || 'freestyle',
      distanceMeters: rawComp?.distance_meters || 50,
      gender: rawComp?.gender || rawAth.gender || 'male',
      ageGroup: rawAth.age_group || 'Umum',
      seedTimeMs: row.seed_time_ms,
      paymentStatus: row.payment_status || 'pending',
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
          ageGroup: rawAth.age_group || 'Umum',
          schoolName: rawSchool?.name || 'Klub / Kontingen Mandiri',
        },
        event: {
          id: eventIdStr,
          name: rawEvent?.name || 'Kejuaraan Renang SCMS',
          organizer: rawEvent?.organizer || 'Panitia Pelaksana SCMS',
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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
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
        isAdmin={isAdmin}
      />
    </div>
  );
}
