import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Award, Trophy } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  CertificateManager,
  type CertificateRecipient,
  type CompetitionEventOption,
} from '@/components/modules/certificate-manager';
import { UserCertificatesView } from '@/components/modules/user-certificates-view';
import { formatMsToTime } from '@/lib/utils';
import { DEFAULT_SPONSORS } from '@/lib/data/sponsors';

export const dynamic = 'force-dynamic';

export default async function CertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; ce?: string }>;
}) {
  const { event: eventId, ce: ceId } = await searchParams;
  const supabase = await createClient();

  // 1. Periksa sesi dan wewenang akun pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .maybeSingle();

  const userRole =
    (profile?.role as string) ||
    (user?.user_metadata?.role as string) ||
    (user?.app_metadata?.role as string) ||
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

  // 2. Ambil daftar event aktif
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date')
    .order('start_date', { ascending: false });

  const events = (eventsData || []).map((e) => ({
    id: e.id,
    name: e.name,
    location: e.location || 'Kolam Renang Resmi',
    startDate: e.start_date || '2026',
    endDate: e.end_date || '2026',
  }));

  const currentEvent = events.find((e) => e.id === eventId) || events[0] || null;

  // 3. Ambil daftar nomor lomba untuk event terpilih
  let compEvents: CompetitionEventOption[] = [];
  if (currentEvent) {
    const { data: ceData } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender, order_no, age_group')
      .eq('event_id', currentEvent.id)
      .order('order_no', { ascending: true });

    compEvents = (ceData || []).map((c) => ({
      id: c.id,
      name: `${c.order_no ? `#${c.order_no} · ` : ''}${c.distance_meters}m ${c.stroke} ${c.gender === 'male' ? 'Putra' : 'Putri'} (${c.age_group || 'Umum'})`,
      orderNo: c.order_no,
      stroke: c.stroke,
      distanceMeters: c.distance_meters,
      gender: c.gender,
    }));
  }

  // 4. Ambil data atlet binaan user (jika role viewer)
  let ownedAthleteIds: string[] = [];
  if (!isAdmin && user) {
    const { data: myAthletes } = await supabase
      .from('athletes')
      .select('id')
      .eq('owner_id', user.id);
    ownedAthleteIds = (myAthletes || []).map((a: any) => a.id);
  }

  // 5. Ambil data hasil lomba (results) dengan relasi lengkap
  const recipients: CertificateRecipient[] = [];

  if (currentEvent) {
    let resultsQuery = supabase
      .from('results')
      .select(`
        id,
        time_ms,
        status,
        is_new_record,
        heat_assignments!inner (
          id,
          heat_id,
          lane_number,
          registration_id,
          registrations!inner (
            id,
            competition_event_id,
            event_id,
            seed_time_ms,
            athlete_id,
            registrant_id,
            athletes!inner (
              id,
              athlete_number,
              full_name,
              gender,
              age_group,
              grade_level,
              school_id,
              schools (
                id,
                name
              )
            ),
            competition_events!inner (
              id,
              name,
              stroke,
              distance_meters,
              gender,
              order_no,
              age_group
            )
          )
        )
      `)
      .eq('heat_assignments.registrations.event_id', currentEvent.id)
      .eq('status', 'finished')
      .order('time_ms', { ascending: true });

    const { data: rawResults } = await resultsQuery;

    // Kelompokkan per competition_event_id untuk menentukan peringkat 1, 2, 3...
    const byComp = new Map<string, any[]>();
    (rawResults || []).forEach((r: any) => {
      const cId = r.heat_assignments?.registrations?.competition_event_id;
      if (!cId) return;
      const list = byComp.get(cId) || [];
      list.push(r);
      byComp.set(cId, list);
    });

    byComp.forEach((resultsList, cId) => {
      const sorted = [...resultsList].sort(
        (a, b) => (a.time_ms || 999999) - (b.time_ms || 999999)
      );

      sorted.forEach((item, idx) => {
        const reg = item.heat_assignments?.registrations;
        const ath = reg?.athletes;
        const ce = reg?.competition_events;
        if (!ath || !ce) return;

        const rank = idx + 1;
        const isNewRecord = Boolean(item.is_new_record);

        // Jika viewer, hanya sertakan atlet yang dimiliki oleh user dan berstatus podium (1, 2, 3) atau rekor
        if (!isAdmin) {
          const isOwned =
            ownedAthleteIds.includes(ath.id) ||
            (user && reg.registrant_id === user.id);
          if (!isOwned) return;
          if (rank > 3 && !isNewRecord) return;
        }

        recipients.push({
          id: `cert-${item.id}`,
          rank,
          athleteId: ath.id,
          athleteNumber: ath.athlete_number || `#ATH-${String(100 + idx)}`,
          swimmerName: ath.full_name,
          gender: ath.gender || 'male',
          ageGroup: ath.age_group || ce.age_group || 'KU I',
          schoolName: ath.schools?.name || 'Klub / Kontingen Independen',
          finishTimeMs: item.time_ms,
          formattedTime: formatMsToTime(item.time_ms),
          isNewRecord,
          status: item.status || 'finished',
          competitionEventId: cId,
          competitionEventName: ce.name,
          stroke: ce.stroke,
          distanceMeters: ce.distance_meters,
          orderNo: ce.order_no,
          eventId: currentEvent.id,
          eventName: currentEvent.name,
          eventLocation: currentEvent.location,
          eventStartDate: currentEvent.startDate,
        });
      });
    });

    // 6. Fallback jika results belum ada tapi ada registrasi (hanya untuk mode admin preview)
    if (isAdmin && recipients.length === 0) {
      const { data: regList } = await supabase
        .from('registrations')
        .select(`
          id,
          seed_time_ms,
          competition_event_id,
          athletes (
            id,
            athlete_number,
            full_name,
            gender,
            age_group,
            school_id,
            schools (id, name)
          ),
          competition_events (
            id,
            name,
            stroke,
            distance_meters,
            gender,
            order_no,
            age_group
          )
        `)
        .eq('event_id', currentEvent.id);

      if (regList && regList.length > 0) {
        const byRegComp = new Map<string, any[]>();
        regList.forEach((r: any) => {
          if (!r.competition_event_id) return;
          const arr = byRegComp.get(r.competition_event_id) || [];
          arr.push(r);
          byRegComp.set(r.competition_event_id, arr);
        });

        byRegComp.forEach((rList, cId) => {
          rList.forEach((r, idx) => {
            const ath = r.athletes;
            const ce = r.competition_events;
            if (!ath || !ce) return;

            const timeMs = r.seed_time_ms || (25000 + idx * 750);
            recipients.push({
              id: `cert-reg-${r.id}`,
              rank: idx + 1,
              athleteId: ath.id,
              athleteNumber: ath.athlete_number || `#ATH-${String(100 + idx)}`,
              swimmerName: ath.full_name,
              gender: ath.gender || 'male',
              ageGroup: ath.age_group || ce.age_group || 'KU I',
              schoolName: ath.schools?.name || 'Klub / Kontingen Independen',
              finishTimeMs: timeMs,
              formattedTime: formatMsToTime(timeMs),
              isNewRecord: idx === 0,
              status: 'finished',
              competitionEventId: cId,
              competitionEventName: ce.name,
              stroke: ce.stroke,
              distanceMeters: ce.distance_meters,
              orderNo: ce.order_no,
              eventId: currentEvent.id,
              eventName: currentEvent.name,
              eventLocation: currentEvent.location,
              eventStartDate: currentEvent.startDate,
            });
          });
        });
      }
    }
  }

  const breadcrumbHref = isAdmin ? '/dashboard' : '/dashboard-viewer';
  const breadcrumbLabel = isAdmin ? 'Dasbor Panitia' : 'Dasbor Peserta';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-0 print:m-0 print:max-w-none">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: breadcrumbLabel, href: breadcrumbHref },
            { label: 'Sertifikat Juara' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title={isAdmin ? 'Otoritas & Manajemen Sertifikat' : 'Sertifikat Juara Saya'}
          description={
            isAdmin
              ? 'Kelola nomor SK panitia, pengesahan tanda tangan, dan cetak sertifikat juara 1–3 resmi standar Aquatic Indonesia & World Aquatics.'
              : 'Daftar piagam penghargaan resmi untuk atlet binaan Anda yang berhasil meraih podium (Juara 1, 2, 3) atau memecahkan Rekor Kejuaraan.'
          }
          icon={isAdmin ? <Award className="h-6 w-6" /> : <Trophy className="h-6 w-6 text-amber-500" />}
        />
      </div>

      {isAdmin ? (
        <CertificateManager
          recipients={recipients}
          events={events.map((e) => ({ id: e.id, name: e.name }))}
          activeEventId={currentEvent?.id || ''}
          competitionEvents={compEvents}
          sponsors={DEFAULT_SPONSORS}
        />
      ) : (
        <UserCertificatesView
          recipients={recipients}
          userAthletesCount={ownedAthleteIds.length}
          sponsors={DEFAULT_SPONSORS}
        />
      )}
    </div>
  );
}
