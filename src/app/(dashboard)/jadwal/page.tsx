import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CalendarDays } from 'lucide-react';
import { JadwalAgendaManager } from '@/components/modules/jadwal-agenda-manager';
import { getSchedulesServer } from '@/lib/data/schedules-server';

export const dynamic = 'force-dynamic';

export default async function JadwalPage() {
  const { supabase } = await requireRole(['super_admin', 'event_admin', 'operator']);

  // Ambil data jadwal tersimpan
  const schedules = getSchedulesServer();

  // Ambil daftar event aktif untuk opsi pengelompokan
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false })
    .limit(10);

  const events = (eventsData ?? []).map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Jadwal & Agenda Kejuaraan' },
        ]}
        className="mb-2"
      />

      <PageHeader
        title="Jadwal & Agenda Kejuaraan"
        description="Catat dan pantau rundown agenda kejuaraan: batas pendaftaran, technical meeting, uji coba sensor touchpad kolam, hingga sesi nomor lomba."
        icon={<CalendarDays className="h-6 w-6" />}
      />

      <JadwalAgendaManager initialSchedules={schedules} events={events} />
    </div>
  );
}
