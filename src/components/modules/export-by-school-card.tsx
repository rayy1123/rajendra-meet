'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, Filter, School, Loader2, Trophy, Printer } from 'lucide-react';
import { formatMsToTime } from '@/lib/utils';

interface EventItem {
  id: string;
  name: string;
}

interface SchoolItem {
  id: string;
  name: string;
}

export function ExportBySchoolCard({
  events,
  schools,
  initialEventId,
}: {
  events: EventItem[];
  schools: SchoolItem[];
  initialEventId: string;
}) {
  const supabase = createClient();
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || events[0]?.id || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadExcel = async () => {
    if (!selectedEventId) {
      toast.error('Pilih kejuaraan terlebih dahulu.');
      return;
    }

    setDownloading(true);
    try {
      // 1. Query registrations dengan join athletes, schools, competition_events, payment_verifications
      let query = supabase
        .from('registrations')
        .select(`
          id,
          seed_time_ms,
          created_at,
          athletes!inner (
            id,
            athlete_number,
            full_name,
            gender,
            age_group,
            school_id,
            schools ( id, name )
          ),
          competition_events!inner (
            id,
            order_no,
            name,
            stroke,
            distance_meters,
            event_id
          ),
          payment_verifications (
            status,
            amount_due
          )
        `)
        .eq('competition_events.event_id', selectedEventId);

      // Filter per Cabang (Sekolah / Klub)
      if (selectedSchoolId !== 'all') {
        query = query.eq('athletes.school_id', selectedSchoolId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let regRows = (data || []) as unknown as Array<{
        id: string;
        seed_time_ms?: number | null;
        athletes?: {
          full_name?: string;
          athlete_number?: string;
          gender?: string;
          age_group?: string;
          schools?: { name?: string };
        } | null;
        competition_events?: {
          order_no?: number;
          name?: string;
          stroke?: string;
          distance_meters?: number;
        } | null;
        payment_verifications?:
          | { status?: string; amount_due?: number }
          | Array<{ status?: string; amount_due?: number }>
          | null;
      }>;

      // Filter Status Pembayaran
      if (selectedPaymentStatus !== 'all') {
        regRows = regRows.filter((r) => {
          const rawPay = r.payment_verifications as unknown as
            | { status?: string }
            | Array<{ status?: string }>
            | null;
          const status = (Array.isArray(rawPay) ? rawPay[0]?.status : rawPay?.status) || 'pending';
          return status === selectedPaymentStatus;
        });
      }

      if (!regRows || regRows.length === 0) {
        toast.warning('Tidak ada data pendaftaran yang sesuai dengan filter yang dipilih.');
        return;
      }

      const activeEventName = events.find((e) => e.id === selectedEventId)?.name || 'Kejuaraan';
      const activeSchoolName =
        selectedSchoolId === 'all'
          ? 'Semua_Cabang'
          : schools.find((s) => s.id === selectedSchoolId)?.name || 'Cabang';

      // 2. Bangun Workbook ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Rajendra SCMS';
      workbook.created = new Date();

      const ws = workbook.addWorksheet('Pendaftar_Cabang', {
        views: [{ showGridLines: true }],
      });

      // Title & Subtitle
      ws.mergeCells('A1:K1');
      const titleCell = ws.getCell('A1');
      titleCell.value = `REKAPITULASI PENDAFTARAN PESERTA PER CABANG / KLUB`;
      titleCell.font = { bold: true, size: 14, color: { argb: '0F172A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
      ws.getRow(1).height = 26;

      ws.mergeCells('A2:K2');
      const subCell = ws.getCell('A2');
      subCell.value = `Event: ${activeEventName} | Cabang / Klub: ${activeSchoolName.replace(/_/g, ' ')} | Filter Status: ${selectedPaymentStatus.toUpperCase()} | Waktu Unduh: ${new Date().toLocaleString('id-ID')}`;
      subCell.font = { italic: true, size: 10, color: { argb: '475569' } };
      ws.getRow(2).height = 18;

      ws.addRow([]); // Baris 3 spacer

      // Headers
      const headers = [
        'No',
        'Nama Atlet',
        'ID / NISN',
        'Gender',
        'KU',
        'Cabang / Sekolah / Klub',
        'Nomor Lomba',
        'Gaya',
        'Jarak',
        'Seed Time',
        'Status Bayar',
      ];

      const headerRow = ws.addRow(headers);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0F172A' },
        };
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'CBD5E1' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          bottom: { style: 'medium', color: { argb: '0284C7' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } },
        };
      });

      // Rows
      regRows.forEach((row, index: number) => {
        const athlete = row.athletes;
        const compEvent = row.competition_events;

        const rawPay = row.payment_verifications as unknown as
          | { status?: string }
          | Array<{ status?: string }>
          | null;
        const payStatus = (Array.isArray(rawPay) ? rawPay[0]?.status : rawPay?.status) || 'pending';

        const rowData = [
          index + 1,
          athlete?.full_name || '–',
          athlete?.athlete_number || '–',
          athlete?.gender === 'female' ? 'Putri' : 'Putra',
          athlete?.age_group || '–',
          athlete?.schools?.name || 'Umum / Perorangan',
          compEvent?.name || '–',
          compEvent?.stroke || '–',
          compEvent?.distance_meters ? `${compEvent.distance_meters}m` : '–',
          formatMsToTime(row.seed_time_ms),
          payStatus.toUpperCase(),
        ];

        const insertedRow = ws.addRow(rowData);
        insertedRow.height = 20;

        // Zebra striping
        if (index % 2 === 1) {
          insertedRow.eachCell((c) => {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          });
        }

        // Alignments & borders
        insertedRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
        insertedRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };
        insertedRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'left' };
        insertedRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };
        insertedRow.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };

        // Highlight status
        if (payStatus === 'verified') {
          insertedRow.getCell(11).font = { bold: true, color: { argb: '15803D' } };
        } else if (payStatus === 'rejected') {
          insertedRow.getCell(11).font = { bold: true, color: { argb: 'B91C1C' } };
        } else {
          insertedRow.getCell(11).font = { color: { argb: 'D97706' } };
        }

        insertedRow.eachCell((c) => {
          c.border = {
            top: { style: 'thin', color: { argb: 'E2E8F0' } },
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } },
          };
        });
      });

      // Auto column widths
      const colWidths = [8, 28, 16, 12, 12, 30, 26, 14, 12, 14, 16];
      colWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });

      // Unduh file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const cleanEvent = activeEventName.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const cleanSchool = activeSchoolName.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const fileName = `Pendaftar_${cleanSchool}_${cleanEvent}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Berhasil mengunduh rekap ${data.length} pendaftar!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh Excel pendaftar.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="shadow-xs border-primary/20 bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Ekspor Pendaftar per Cabang / Klub
          </CardTitle>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Format Excel (.xlsx)
          </span>
        </div>
        <CardDescription className="text-xs">
          Unduh data pendaftaran lomba yang difilter khusus berdasarkan cabang (sekolah / klub renang) dan status pembayaran.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter 1: Event */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-primary" /> Pilih Kejuaraan
            </label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih Event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter 2: Cabang (Sekolah / Klub) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-primary" /> Cabang / Klub
            </label>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger className="h-9 text-xs font-medium">
                <SelectValue placeholder="Semua Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold text-primary">
                  ⭐ Semua Cabang / Klub
                </SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter 3: Status Pembayaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" /> Status Pembayaran
            </label>
            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Status
                </SelectItem>
                <SelectItem value="verified" className="text-xs text-emerald-600 font-semibold">
                  Lunas / Verified
                </SelectItem>
                <SelectItem value="pending" className="text-xs text-amber-600 font-semibold">
                  Menunggu Verifikasi (Pending)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
          {selectedEventId && (
            <Link href={`/events/${selectedEventId}/rekap-klub`} target="_blank">
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                Cetak PDF Lembar Rekap per Klub
              </Button>
            </Link>
          )}

          <Button
            onClick={handleDownloadExcel}
            disabled={downloading || !selectedEventId}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Excel (.xlsx) per Cabang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
