import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  PerlombaanCardList,
  type EventCardData,
} from '@/components/modules/perlombaan-card-list';

export const dynamic = 'force-dynamic';

export default async function PerlombaanPage() {
  const supabase = await createClient();

  // 1. Ambil data event
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true });

  // 2. Ambil total registrasi per event
  const { data: regs } = await supabase
    .from('registrations')
    .select('id, event_id');

  const regCounts: Record<string, number> = {};
  (regs || []).forEach((r) => {
    regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
  });

  const eventCardList: EventCardData[] = (events || []).map((e) => ({
    ...e,
    participant_count: regCounts[e.id] || 0,
    max_participants: 999,
    tm_date: e.start_date ? new Date(new Date(e.start_date).getTime() - 86400000).toISOString().slice(0, 10) : undefined,
    reg_start_date: e.start_date ? new Date(new Date(e.start_date).getTime() - 86400000 * 30).toISOString().slice(0, 10) : undefined,
    reg_end_date: e.start_date ? new Date(new Date(e.start_date).getTime() - 86400000 * 2).toISOString().slice(0, 10) : undefined,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Daftar Perlombaan', href: '/perlombaan' },
        ]}
      />

      <PageHeader
        title="Daftar Perlombaan"
        description="Kelola kejuaraan renang resmi, pendaftaran manual atlet, impor data peserta massal dari Excel, dan monitoring kuota."
      />

      <PerlombaanCardList events={eventCardList} />
    </div>
  );
}
