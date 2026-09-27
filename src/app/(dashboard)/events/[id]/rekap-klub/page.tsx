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
  searchParams?: Promise<{
    clubId?: string;
    schoolId?: string;
    payment?: string;
    print?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EventClubRosterPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const initialClubId = sParams.clubId || sParams.schoolId || 'all';
  const initialPayment = sParams.payment || 'all';
  const autoPrint = sParams.print === 'true';
  const supabase = await createClient();

  // 1. Ambil data event menggunakan select('*')
  let { data: rawEvent } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // Fallback: Jika event dengan ID spesifik tidak ditemukan di DB, gunakan event aktif terbaru
  if (!rawEvent) {
    const { data: fallbackEvent } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    rawEvent = fallbackEvent;
  }

  if (!rawEvent) {
    notFound();
  }

  const savedSettings = getEventSettings(rawEvent.id);
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

  // 4. Ambil seluruh pendaftaran di event ini beserta atlet & nomor lomba
  const [{ data: rawRegistrations }, { data: payments }] = await Promise.all([
    supabase
      .from('registrations')
      .select(`
        id,
        seed_time_ms,
        athletes (
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
        competition_events (
          id,
          order_no,
          name,
          stroke,
          distance_meters,
          gender
        )
      `)
      .eq('event_id', rawEvent.id),
    supabase
      .from('payment_verifications')
      .select('id, registration_id, status, amount_due'),
  ]);

  const payMap = new Map<string, { id?: string; status: 'pending' | 'verified' | 'rejected'; amount_due: number }>();
  (payments || []).forEach((p: any) => {
    if (p.registration_id) {
      payMap.set(p.registration_id, {
        id: p.id,
        status: (p.status as any) || 'verified',
        amount_due: Number(p.amount_due) || 0,
      });
    }
  });

  const registrations: RegistrationClubRecord[] = (rawRegistrations || []).map((r: any) => {
    const pay = payMap.get(r.id) || null;
    return {
      id: r.id,
      seed_time_ms: r.seed_time_ms,
      athletes: r.athletes || null,
      competition_events: r.competition_events || null,
      payment_verifications: pay,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-0 print:m-0 print:max-w-none">
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
        initialClubId={initialClubId}
        initialPayment={initialPayment}
        autoPrint={autoPrint}
        lockEvent={false}
        backHref={`/events/${event.id}`}
      />
    </div>
  );
}
