import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  NomorLombaPageManager,
  type NomorLombaItem,
} from '@/components/modules/nomor-lomba-page-manager';

export const dynamic = 'force-dynamic';

export default async function NomorLombaPage() {
  const supabase = await createClient();

  // 1. Ambil daftar events
  const { data: events } = await supabase
    .from('events')
    .select('id, name, fee_per_event')
    .order('created_at', { ascending: false });

  const eventsList = (events || []).map((e) => ({
    id: e.id,
    name: e.name,
    fee_per_event: e.fee_per_event || 150000,
  }));

  // 2. Ambil seluruh competition_events
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('*')
    .order('order_no', { ascending: true });

  const items: NomorLombaItem[] = (compEvents || []).map((c) => {
    // Generate simple code if not set
    const codeMatch = c.name.match(/^([A-Z0-9]+)\s*-\s*/i);
    const code = codeMatch ? codeMatch[1] : undefined;
    const parentEvent = eventsList.find((e) => e.id === c.event_id);

    return {
      id: c.id,
      event_id: c.event_id,
      event_name: parentEvent?.name || '',
      code,
      name: c.name,
      stroke: c.stroke || 'Freestyle',
      distance_meters: c.distance_meters || 50,
      gender: c.gender || 'male',
      grade_level: c.grade_level,
      class_name: c.class_name || c.grade_level || 'SD KELAS 1',
      order_no: c.order_no,
      session_no: c.session_no,
      price: parentEvent?.fee_per_event || 150000,
      max_participants: 999,
    };
  });

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Manajemen Nomor Lomba', href: '/nomor-lomba' },
        ]}
      />

      <PageHeader
        title="Manajemen Nomor Lomba"
        description="Kelola daftar acara dan nomor perlombaan renang, biaya pendaftaran, kategori kelas, dan batas peserta."
      />

      <NomorLombaPageManager
        initialItems={items}
        events={eventsList}
      />
    </div>
  );
}
