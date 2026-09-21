'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime, formatTimeToMs } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, CheckCircle2, BookOpen, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HeatAssignmentRow {
  id: string;
  lane_number: number;
  registrations?: {
    seed_time_ms?: number | null;
    athletes?: { full_name?: string | null; schools?: { name?: string | null } | null } | null;
  } | null;
  results?: { id: string; time_ms?: number | null; status?: string }[] | null;
}

interface HeatRow {
  id: string;
  heat_number?: number;
  heat_assignments?: HeatAssignmentRow[] | null;
}

interface ResultInputOperatorProps {
  events: { id: string; name: string }[];
  compEvents: { id: string; name: string; grade_level?: string | null; gender?: string | null }[];
  initialEventId: string;
  initialCompEventId: string;
  heatsData: HeatRow[];
}

export function ResultInputOperator({
  events,
  compEvents,
  initialEventId,
  initialCompEventId,
  heatsData,
}: ResultInputOperatorProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();

  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedCompEventId, setSelectedCompEventId] = useState(initialCompEventId);
  const [timeInputs, setTimeInputs] = useState<Record<string, string>>({});
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Navigasi Filter Event
  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    startTransition(() => {
      router.push(`/results?eventId=${val}`);
    });
  };

  const handleCompEventChange = (val: string) => {
    setSelectedCompEventId(val);
    startTransition(() => {
      router.push(`/results?eventId=${selectedEventId}&compEventId=${val}`);
    });
  };

  // Peta label tampilan -> nilai enum DB (result_status)
  const STATUS_OPTIONS = [
    { value: 'finished', label: 'Selesai' },
    { value: 'dns', label: 'DNS' },
    { value: 'dnf', label: 'DNF' },
    { value: 'dq', label: 'DSQ' },
    { value: 'scr', label: 'SCR' },
  ] as const;

  // Simpan/Update Hasil Waktu & Status Lomba per Lintasan
  const handleSaveResult = async (
    assignmentId: string,
    resultId?: string,
    defaultStatus: string = 'finished',
    existingTimeMs?: number | null
  ) => {
    const rawTime = timeInputs[assignmentId];
    const status = statusInputs[assignmentId] || defaultStatus;

    let timeMs: number | null = null;

    // Waktu hanya diisi untuk status 'finished' (selesai)
    if (status === 'finished') {
      const sourceMs = rawTime ? formatTimeToMs(rawTime) : existingTimeMs;

      if (!sourceMs || isNaN(sourceMs) || sourceMs <= 0) {
        toast.error('Masukkan waktu terlebih dahulu (format 28.45 atau 01:05.12)');
        return;
      }

      timeMs = sourceMs;
    }

    setSavingMap((prev) => ({ ...prev, [assignmentId]: true }));

    try {
      const payload = {
        heat_assignment_id: assignmentId,
        time_ms: timeMs,
        status: status,
      };

      if (resultId) {
        const { error } = await supabase
          .from('results')
          .update(payload)
          .eq('id', resultId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('results')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Hasil lomba berhasil disimpan & terhubung ke Buku Acara!', {
        action: {
          label: 'Buka Buku Acara',
          onClick: () => router.push(`/buku-acara?event=${selectedEventId}`),
        },
      });
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan hasil');
    } finally {
      setSavingMap((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  // Simpan Seluruh Lintasan di Seri / Heat Sekaligus (Batch Save)
  const handleSaveAllInHeat = async (heat: HeatRow) => {
    if (!heat.heat_assignments || heat.heat_assignments.length === 0) return;

    setIsSavingAll(true);
    let savedCount = 0;

    try {
      for (const assign of heat.heat_assignments) {
        const rawTime = timeInputs[assign.id];
        const existingResult = assign.results?.[0];
        const status = statusInputs[assign.id] || existingResult?.status || 'finished';

        let timeMs: number | null = null;
        if (status === 'finished') {
          const sourceMs = rawTime ? formatTimeToMs(rawTime) : existingResult?.time_ms;
          if (sourceMs && !isNaN(sourceMs) && sourceMs > 0) {
            timeMs = sourceMs;
          }
        }

        if (timeMs !== null || status !== 'finished') {
          const payload = {
            heat_assignment_id: assign.id,
            time_ms: timeMs,
            status: status,
          };

          if (existingResult?.id) {
            await supabase.from('results').update(payload).eq('id', existingResult.id);
          } else {
            await supabase.from('results').insert(payload);
          }
          savedCount++;
        }
      }

      if (savedCount > 0) {
        toast.success(
          `${savedCount} hasil lintasan Acara ${heat.heat_number} berhasil disimpan & disinkronkan ke Buku Acara!`,
          {
            action: {
              label: 'Buka Buku Acara',
              onClick: () => router.push(`/buku-acara?event=${selectedEventId}`),
            },
          }
        );
        router.refresh();
      } else {
        toast.info('Belum ada waktu tempuh baru yang diisi pada Acara ini.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan hasil batch');
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Koneksi Langsung ke Buku Acara */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-950">
              Terhubung Langsung ke Buku Acara (Start List & Hasil)
            </h4>
            <p className="text-xs text-blue-800/80">
              Setiap waktu tempuh yang Anda simpan di sini akan otomatis terisi pada kolom <b>Final Time</b> & <b>Peringkat Juara</b> di Buku Acara resmi.
            </p>
          </div>
        </div>

        <Link href={`/buku-acara?event=${selectedEventId}`}>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shrink-0">
            <BookOpen className="h-4 w-4" /> Buka Buku Acara <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
        <div className="space-y-1">
          <label className="text-xs font-semibold">Pilih Kejuaraan / Event</label>
          <Select value={selectedEventId} onValueChange={handleEventChange} disabled={isPending}>
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

        <div className="space-y-1">
          <label className="text-xs font-semibold">Pilih Nomor Lomba</label>
          <Select value={selectedCompEventId} onValueChange={handleCompEventChange} disabled={isPending}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Pilih Nomor Lomba" />
            </SelectTrigger>
            <SelectContent>
              {compEvents.map((ce) => (
                <SelectItem key={ce.id} value={ce.id}>
                  {ce.name} - {ce.grade_level} ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Render Daftar Heat & Lane */}
      {!heatsData || heatsData.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          Belum ada Acara yang dibuat untuk nomor ini. Buat acara di modul <b>Acara</b> terlebih dahulu.
        </Card>
      ) : (
        heatsData.map((heat) => (
          <Card key={heat.id} className="border-t-4 border-t-primary">
            <CardHeader className="py-3 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold">Acara {heat.heat_number}</CardTitle>
                <span className="text-xs font-medium text-muted-foreground">
                  ({heat.heat_assignments?.length || 0} Lintasan)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveAllInHeat(heat)}
                  disabled={isSavingAll}
                  className="h-8 gap-1.5 text-xs font-bold border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Semua Lintasan
                </Button>
                <Link href={`/buku-acara?event=${selectedEventId}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Buku Acara »
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {heat.heat_assignments &&
                [...heat.heat_assignments]
                  .sort((a, b) => a.lane_number - b.lane_number)
                  .map((assign) => {
                    const athlete = assign.registrations?.athletes;
                    const school = athlete?.schools;
                    const existingResult = assign.results?.[0];

                    const currentDisplayTime =
                      timeInputs[assign.id] !== undefined
                        ? timeInputs[assign.id]
                        : existingResult?.time_ms
                        ? formatMsToTime(existingResult.time_ms)
                        : '';

                    const currentStatus =
                      statusInputs[assign.id] || existingResult?.status || 'finished';

                    return (
                      <div
                        key={assign.id}
                        className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                      >
                        {/* Lane & Athlete Info */}
                        <div className="flex items-stretch gap-3">
                          <span className="flex w-9 shrink-0 self-center flex-col items-center justify-center rounded-lg bg-primary/10 py-1 text-primary">
                            <span className="text-[9px] font-semibold uppercase leading-none">Lane</span>
                            <span className="text-base font-black leading-none">{assign.lane_number}</span>
                          </span>
                          <div className="min-w-0 self-center">
                            <p className="font-bold text-sm">{athlete?.full_name || 'Tidak ada atlet'}</p>
                            <p className="truncate text-xs text-muted-foreground">{school?.name || 'Umum'}</p>
                          </div>
                        </div>

                        {/* Input Waktu & Status Lomba */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Selector Status */}
                          <Select
                            value={currentStatus}
                            onValueChange={(val) =>
                              setStatusInputs((prev) => ({ ...prev, [assign.id]: val }))
                            }
                          >
                            <SelectTrigger className="w-28 text-xs font-semibold h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-2">
                              {/* Input Waktu */}
                              <Input
                                placeholder="28.45 / 01:05.12"
                                className="w-36 text-center font-mono font-bold text-base h-9"
                                disabled={currentStatus !== 'finished'}
                                value={
                                  currentStatus !== 'finished'
                                    ? '-'
                                    : currentDisplayTime
                                }
                                onChange={(e) =>
                                  setTimeInputs((prev) => ({
                                    ...prev,
                                    [assign.id]: e.target.value,
                                  }))
                                }
                              />

                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSaveResult(
                                    assign.id,
                                    existingResult?.id,
                                    existingResult?.status,
                                    existingResult?.time_ms
                                  )
                                }
                                disabled={savingMap[assign.id]}
                                className="gap-1 min-w-[80px] h-9"
                              >
                                {existingResult ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Edit
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" /> Simpan
                                  </>
                                )}
                              </Button>
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Seed {formatMsToTime(assign.registrations?.seed_time_ms)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
