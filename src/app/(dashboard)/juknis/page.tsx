import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { FileText } from 'lucide-react';
import { JuknisManager } from '@/components/modules/juknis-manager';
import { DEFAULT_SPONSORS, type SponsorItem } from '@/lib/data/sponsors';

export const dynamic = 'force-dynamic';

export default async function JuknisPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  // 1. Ambil daftar event
  const { data: events } = await supabase
    .from('events')
    .select('id, name, organizer, location, start_date, end_date, pool_type, pool_length_meters, lane_count')
    .order('start_date', { ascending: false });

  const currentEvent = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

  let sponsorList: SponsorItem[] = DEFAULT_SPONSORS;

  if (currentEvent) {
    // 2. Ambil sponsor kejuaraan
    const { data: dbSponsors } = await supabase
      .from('sponsors')
      .select('*')
      .eq('event_id', currentEvent.id)
      .order('order_no', { ascending: true });

    if (dbSponsors && dbSponsors.length > 0) {
      sponsorList = dbSponsors.map((s: {
        id: string;
        name: string;
        tier: string;
        logo_url: string;
        website_url?: string | null;
        is_active: boolean;
        order_no: number;
      }) => ({
        id: s.id,
        name: s.name,
        tier: s.tier as SponsorItem['tier'],
        logoUrl: s.logo_url,
        websiteUrl: s.website_url,
        isActive: s.is_active,
        orderNo: s.order_no,
      }));
    }
  }

  const formattedEvent = currentEvent
    ? {
        id: currentEvent.id,
        name: currentEvent.name,
        organizer: currentEvent.organizer || 'Panitia Pelaksana Kejuaraan',
        location: currentEvent.location || 'Kolam Renang Resmi',
        startDate: currentEvent.start_date,
        endDate: currentEvent.end_date,
        poolType: currentEvent.pool_type || 'indoor',
        poolLengthMeters: currentEvent.pool_length_meters || 25,
        laneCount: currentEvent.lane_count || 8,
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Petunjuk Teknis (Juknis)' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Petunjuk Teknis Perlombaan (Juknis)"
          description="Buku panduan teknis regulasi perlombaan renang resmi standar nasional 20 poin kejuaraan."
          icon={<FileText className="h-6 w-6" />}
        />
      </div>

      <JuknisManager
        event={formattedEvent}
        eventsList={(events || []).map((e) => ({ id: e.id, name: e.name }))}
        sponsors={sponsorList}
      />
    </div>
  );
}
