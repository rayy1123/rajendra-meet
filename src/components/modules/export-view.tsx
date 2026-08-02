'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Printer, Download } from 'lucide-react';
import { exportToExcel, printPage } from '@/lib/utils/export';
import { formatMsToTime } from '@/lib/utils';

interface ExportViewProps {
  events: any[];
  initialEventId: string;
  exportData: any[];
}

export function ExportView({ events, initialEventId, exportData }: ExportViewProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);

  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    router.push(`/export?eventId=${val}`, { scroll: false });
  };

  // Format data untuk ekspor Excel
  const handleExportExcel = async () => {
    const flatRows: any[] = [];

    exportData.forEach((ce) => {
      ce.heat_assignments?.forEach((ha: any) => {
        flatRows.push({
          'No Acara': ce.event_number || '-',
          'Nomor Lomba': ce.name || '-',
          Kategori: `${ce.gender || '-'} - ${ce.age_group || '-'}`,
          Seri: ha.heat_number,
          Lintasan: ha.lane_number,
          'Nama Atlet': ha.registrations?.athletes?.full_name || '-',
          'Klub / Sekolah': ha.registrations?.athletes?.schools?.name || 'Perorangan',
          'Waktu Entry': formatMsToTime(ha.registrations?.seed_time_ms),
        });
      });
    });

    const activeEventName = events.find((e) => e.id === selectedEventId)?.name || 'Buku_Acara';
    await exportToExcel(flatRows, `Buku_Acara_${activeEventName.replace(/\s+/g, '_')}`);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Disembunyikan saat cetak PDF / Print) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-muted/40 p-4 rounded-xl border print:hidden">
        <div className="w-full sm:w-72">
          <label className="text-xs font-semibold block mb-1">Pilih Kejuaraan / Event</label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Pilih Event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            <Download className="w-4 h-4" /> Export Excel (.xlsx)
          </Button>
          <Button onClick={printPage} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4" /> Cetak / Save PDF
          </Button>
        </div>
      </div>

      {/* Tampilan Cetak Lembar Buku Acara (A4 Printer Friendly) */}
      <div className="space-y-8 print:space-y-6">
        {exportData.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground print:hidden">
            Belum ada data susunan seri/lintasan untuk diekspor. Pastikan Anda telah menjalankan <b>Auto-Heat Generator</b>.
          </Card>
        ) : (
          exportData.map((ce) => (
            <div
              key={ce.id}
              className="bg-background border p-6 rounded-lg print:border-black print:p-0 print:rounded-none break-inside-avoid print:break-inside-avoid"
            >
              <div className="border-b-2 border-primary pb-2 mb-4 flex justify-between items-baseline print:border-black">
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    ACARA {ce.event_number}: {ce.name?.toUpperCase()}
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold print:text-black">
                    Kategori: {ce.gender} | Kelompok Umur: {ce.age_group}
                  </p>
                </div>
              </div>

              {/* Tabel Seri & Lintasan */}
              <table className="w-full text-sm text-left border-collapse border border-slate-300 print:border-black">
                <thead>
                  <tr className="bg-muted/50 print:bg-slate-100">
                    <th className="border border-slate-300 print:border-black px-3 py-1.5 text-center w-12 font-bold">
                      Seri
                    </th>
                    <th className="border border-slate-300 print:border-black px-3 py-1.5 text-center w-16 font-bold">
                      Ltsn
                    </th>
                    <th className="border border-slate-300 print:border-black px-3 py-1.5 font-bold">
                      Nama Atlet
                    </th>
                    <th className="border border-slate-300 print:border-black px-3 py-1.5 font-bold">
                      Sekolah / Klub
                    </th>
                    <th className="border border-slate-300 print:border-black px-3 py-1.5 text-center w-28 font-bold">
                      Seed Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ce.heat_assignments && ce.heat_assignments.length > 0 ? (
                    [...ce.heat_assignments]
                      .sort((a: any, b: any) => a.heat_number - b.heat_number || a.lane_number - b.lane_number)
                      .map((ha: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="border border-slate-300 print:border-black px-3 py-1 text-center font-bold">
                            {ha.heat_number}
                          </td>
                          <td className="border border-slate-300 print:border-black px-3 py-1 text-center font-semibold">
                            {ha.lane_number}
                          </td>
                          <td className="border border-slate-300 print:border-black px-3 py-1 font-medium">
                            {ha.registrations?.athletes?.full_name || '-'}
                          </td>
                          <td className="border border-slate-300 print:border-black px-3 py-1 text-muted-foreground print:text-black">
                            {ha.registrations?.athletes?.schools?.name || 'Perorangan'}
                          </td>
                          <td className="border border-slate-300 print:border-black px-3 py-1 text-center font-mono text-xs">
                            {formatMsToTime(ha.registrations?.seed_time_ms)}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-2 text-xs text-muted-foreground border border-slate-300">
                        Belum ada susunan lintasan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}