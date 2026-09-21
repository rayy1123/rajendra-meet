import { createClient } from '@/lib/supabase/server';
import { ExportView, type ExportCompEvent } from '@/components/modules/export-view';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // 1. Ambil daftar event
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('created_at', { ascending: false });

  const activeEventId = params.eventId || events?.[0]?.id || '';

  // 2. Ambil data nomor lomba & susunan seri/lintasan untuk diekspor
  let exportData: ExportCompEvent[] = [];

  if (activeEventId) {
    const { data: compEvents } = await supabase
      .from('competition_events')
      .select(`
        id,
        order_no,
        name,
        gender,
        age_group,
        heats (
          heat_number,
          heat_assignments (
            lane_number,
            registrations (
              seed_time_ms,
              athletes (
                full_name,
                schools (name)
              )
            )
          )
        )
      `)
      .eq('event_id', activeEventId)
      .order('order_no', { ascending: true });

    if (compEvents) {
      // Ratakan struktur heats -> heat_assignments agar sesuai bentuk ExportCompEvent
      exportData = compEvents.map((ce) => {
        const heats = (ce.heats ?? []) as Array<{
          heat_number: number;
          heat_assignments?: Array<Record<string, unknown>> | null;
        }>;
        const heat_assignments = heats.flatMap((h) =>
          (h.heat_assignments ?? []).map((ha) => ({
            ...(ha as object),
            heat_number: h.heat_number,
          })),
        );
        return {
          id: ce.id,
          order_no: ce.order_no,
          name: ce.name,
          gender: ce.gender,
          age_group: ce.age_group,
          heat_assignments,
        } as ExportCompEvent;
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-0 print:m-0">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Cetak & Ekspor' }]} className="mb-2" />
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <FileSpreadsheet className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-gradient-hero">Cetak & Ekspor Laporan</h1>
            <p className="text-sm text-[var(--m-muted)]">
              Unduh lembar susunan seri/lintasan dalam bentuk Excel atau cetak langsung menjadi PDF untuk panitia/juri.
            </p>
          </div>
        </div>
      </div>

      {!events || events.length === 0 ? (
        <EmptyState
          icon={<Printer className="h-6 w-6" />}
          title="Belum Ada Event"
          description="Silakan buat event terlebih dahulu untuk dapat mencetak atau mengekspor laporan."
          className="print:hidden"
        />
      ) : (
        <ExportView
          events={events}
          initialEventId={activeEventId}
          exportData={exportData}
        />
      )}
    </div>
  );
}