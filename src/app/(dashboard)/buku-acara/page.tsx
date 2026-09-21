import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { BookOpen } from 'lucide-react';
import { BukuAcaraManager, type BukuEventItem } from '@/components/modules/buku-acara-manager';
import { DEFAULT_SPONSORS, type SponsorItem } from '@/lib/data/sponsors';

export const dynamic = 'force-dynamic';

export default async function BukuAcaraPage({
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

  let bukuEvents: BukuEventItem[] = [];
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

    // 3. Ambil seluruh nomor lomba beserta heats dan penugasan lintasan
    const { data: compEvents } = await supabase
      .from('competition_events')
      .select(`
        id,
        order_no,
        name,
        stroke,
        distance_meters,
        gender,
        heats (
          id,
          heat_number,
          heat_assignments (
            id,
            lane_number,
            registrations (
              seed_time_ms,
              athletes (
                athlete_number,
                full_name,
                schools (
                  name
                )
              )
            ),
            results (
              id,
              time_ms,
              status
            )
          )
        )
      `)
      .eq('event_id', currentEvent.id)
      .order('order_no', { ascending: true });

    if (compEvents) {
      // Kumpulkan seluruh heat_assignment_id untuk memastikan query results 100% akurat & terhubung langsung
      const allAssignIds: string[] = [];
      compEvents.forEach((ce) => {
        const rawHeats = Array.isArray(ce.heats) ? ce.heats : [];
        rawHeats.forEach((h: any) => {
          const rawAssigns = Array.isArray(h.heat_assignments) ? h.heat_assignments : [];
          rawAssigns.forEach((ha: any) => {
            if (ha.id) allAssignIds.push(ha.id);
          });
        });
      });

      const directResultsMap: Record<string, { time_ms: number | null; status: string }> = {};
      if (allAssignIds.length > 0) {
        const { data: dbResults } = await supabase
          .from('results')
          .select('heat_assignment_id, time_ms, status')
          .in('heat_assignment_id', allAssignIds);

        if (dbResults) {
          dbResults.forEach((r) => {
            directResultsMap[r.heat_assignment_id] = {
              time_ms: r.time_ms,
              status: r.status,
            };
          });
        }
      }

      bukuEvents = compEvents.map((ce) => {
        const rawHeats = Array.isArray(ce.heats) ? ce.heats : [];
        const sortedHeats = [...rawHeats].sort((a, b) => a.heat_number - b.heat_number);

        return {
          id: ce.id,
          orderNo: ce.order_no,
          name: ce.name || `${ce.distance_meters}m ${ce.stroke}`,
          stroke: ce.stroke,
          distanceMeters: ce.distance_meters,
          gender: ce.gender,
          heats: sortedHeats.map((h) => {
            const rawAssigns = Array.isArray(h.heat_assignments) ? h.heat_assignments : [];
            const sortedAssigns = [...rawAssigns].sort((a, b) => a.lane_number - b.lane_number);

            return {
              id: h.id,
              heatNumber: h.heat_number,
              assignments: sortedAssigns.map((ha) => {
                const rawReg = Array.isArray(ha.registrations) ? ha.registrations[0] : ha.registrations;
                const rawAth = Array.isArray(rawReg?.athletes) ? rawReg?.athletes[0] : rawReg?.athletes;
                const rawSchool = Array.isArray(rawAth?.schools) ? rawAth?.schools[0] : rawAth?.schools;
                const rawRes = Array.isArray((ha as any).results) ? (ha as any).results[0] : (ha as any).results;
                const directRes = directResultsMap[ha.id];

                const finalTimeMs = directRes !== undefined ? directRes.time_ms : (rawRes?.time_ms ?? null);
                const resultStatus = directRes !== undefined ? directRes.status : (rawRes?.status ?? null);

                return {
                  id: ha.id,
                  laneNumber: ha.lane_number,
                  athleteName: rawAth?.full_name || '—',
                  athleteNumber: rawAth?.athlete_number || '—',
                  schoolName: rawSchool?.name || '—',
                  seedTimeMs: rawReg?.seed_time_ms ?? null,
                  finalTimeMs,
                  resultStatus,
                };
              }),
            };
          }),
        };
      });
    }
  }

  const formattedEvent = currentEvent
    ? {
        id: currentEvent.id,
        name: currentEvent.name,
        organizer: currentEvent.organizer || 'Panitia Pelaksana SCMS',
        location: currentEvent.location || 'Kolam Renang Resmi',
        startDate: currentEvent.start_date,
        endDate: currentEvent.end_date,
        poolType: currentEvent.pool_type || 'Olympic 50m',
        poolLengthMeters: currentEvent.pool_length_meters || 50,
        laneCount: currentEvent.lane_count || 8,
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Buku Acara (Start List)' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Buku Acara Perlombaan (Start List)"
          description="Cetak dokumen resmi susunan seri & lintasan (start list) seluruh acara lomba dengan logo sponsorship resmi."
          icon={<BookOpen className="h-6 w-6" />}
        />
      </div>

      <BukuAcaraManager
        event={formattedEvent}
        eventsList={(events || []).map((e) => ({ id: e.id, name: e.name }))}
        bukuEvents={bukuEvents}
        sponsors={sponsorList}
      />
    </div>
  );
}
