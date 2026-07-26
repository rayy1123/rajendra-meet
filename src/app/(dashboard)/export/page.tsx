import { createClient } from '@/lib/supabase/server';
import { ExportView } from '@/components/modules/export-view';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
  let exportData: any[] = [];

  if (activeEventId) {
    const { data: compEvents } = await supabase
      .from('competition_events')
      .select(`
        id,
        event_number,
        name,
        gender,
        age_group,
        heat_assignments (
          heat_number,
          lane_number,
          registrations (
            seed_time_ms,
            athletes (
              full_name,
              schools (name)
            )
          )
        )
      `)
      .eq('event_id', activeEventId)
      .order('event_number', { ascending: true });

    if (compEvents) {
      exportData = compEvents;
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      {/* Header (Disembunyikan saat cetak PDF) */}
      <div className="border-b pb-5 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" /> Cetak & Ekspor Laporan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Unduh lembar susunan seri/lintasan dalam bentuk Excel atau cetak langsung menjadi PDF untuk panitia/juri.
          </p>
        </div>
      </div>

      {!events || events.length === 0 ? (
        <Card className="p-12 text-center border-dashed print:hidden">
          <Printer className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Belum Ada Event</h3>
          <p className="text-sm text-muted-foreground mt-1">Silakan buat event terlebih dahulu.</p>
        </Card>
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