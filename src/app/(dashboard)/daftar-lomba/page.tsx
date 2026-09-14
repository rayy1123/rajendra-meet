import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  UserRegistrationFlow,
  type EventOption,
  type CompEventOption,
  type MyAthleteOption,
} from '@/components/modules/user-registration-flow';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; athleteId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?for=daftar&redirect=/daftar-lomba');
  }

  const params = await searchParams;

  // 1. Ambil event yang statusnya published
  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, is_published')
    .eq('is_published', true)
    .order('start_date', { ascending: false });

  const activeEventId = params.eventId || events?.[0]?.id || '';

  // 2. Ambil nomor lomba (competition_events) untuk event aktif
  let compEvents: CompEventOption[] = [];
  if (activeEventId) {
    const { data: ceData } = await supabase
      .from('competition_events')
      .select('id, event_id, order_no, name, stroke, distance_meters, gender, age_group')
      .eq('event_id', activeEventId)
      .order('order_no', { ascending: true });
    compEvents = (ceData || []) as CompEventOption[];
  }

  // 3. Ambil data atlet milik user yang sedang login (owner_id = user.id)
  const { data: myAthletes } = await supabase
    .from('athletes')
    .select(`
      id,
      athlete_number,
      full_name,
      gender,
      birth_date,
      age_group,
      schools ( id, name )
    `)
    .eq('owner_id', user.id)
    .order('full_name', { ascending: true });

  // 4. Ambil pendaftaran yang sudah pernah disubmit agar tidak dobel
  let existingRegistrationIds: string[] = [];
  if (activeEventId && myAthletes && myAthletes.length > 0) {
    const athleteIds = myAthletes.map((a) => a.id);
    const { data: existingRegs } = await supabase
      .from('registrations')
      .select('competition_event_id, athlete_id')
      .in('athlete_id', athleteIds);

    if (existingRegs) {
      existingRegistrationIds = existingRegs.map(
        (r) => `${r.competition_event_id}_${r.athlete_id}`
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'Pendaftaran', href: '/daftar-lomba' },
          { label: 'Daftar Lomba' },
        ]}
        className="mb-2"
      />
      <PageHeader
        title="Pendaftaran Nomor Lomba"
        description="Pilih kejuaraan renang, tentukan atlet Anda, dan daftarkan ke nomor lomba yang diinginkan."
        icon={<Trophy className="h-6 w-6" />}
      />

      <UserRegistrationFlow
        events={(events || []) as EventOption[]}
        selectedEventId={activeEventId}
        compEvents={compEvents}
        myAthletes={(myAthletes || []) as unknown as MyAthleteOption[]}
        existingRegistrationIds={existingRegistrationIds}
      />
    </div>
  );
}
