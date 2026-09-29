'use client';

import { useState, useTransition, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  formatMsToTime,
  formatMsToFinalTime,
  formatTimeToMs,
  parseSwimTimeInput,
} from '@/lib/utils';
import { formatCompEventSubtitle } from '@/lib/age-category';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Save,
  CheckCircle2,
  BookOpen,
  Trophy,
  ArrowRight,
  Filter,
  Check,
  Clock,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  const [selectedHeatFilter, setSelectedHeatFilter] = useState<string>('all');
  const [timeInputs, setTimeInputs] = useState<Record<string, string>>({});
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Input refs for automatic lane-to-lane focus jumping on Enter
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  // Cek kelengkapan setiap Heat (apakah semua lintasan sudah terisi waktu/status selesai)
  const getHeatCompletionStatus = (heat: HeatRow) => {
    const assigns = heat.heat_assignments || [];
    if (assigns.length === 0) {
      return { total: 0, filled: 0, isComplete: false };
    }

    let filledCount = 0;
    assigns.forEach((a) => {
      const existing = a.results?.[0];
      const curTime = timeInputs[a.id];
      const curStatus = statusInputs[a.id] || existing?.status || 'finished';

      if (curStatus !== 'finished') {
        filledCount++; // DNS, DNF, DSQ, SCR counts as completed input
      } else if (curTime !== undefined) {
        if (curTime && curTime !== '-' && curTime.trim() !== '' && curTime.trim() !== '00.00.00') {
          filledCount++;
        }
      } else if (existing?.time_ms && existing.time_ms > 0) {
        filledCount++;
      }
    });

    const isComplete = filledCount === assigns.length && assigns.length > 0;
    return { total: assigns.length, filled: filledCount, isComplete };
  };

  // Filter heat sesuai pilihan operator (Semua Seri vs Seri Tertentu)
  const filteredHeats = useMemo(() => {
    if (selectedHeatFilter === 'all') return heatsData;
    return heatsData.filter((h) => h.id === selectedHeatFilter);
  }, [heatsData, selectedHeatFilter]);

  // Urutan seluruh assignment secara linier untuk auto-focus enter ke lane berikutnya
  const orderedAssignmentIds = useMemo(() => {
    return (filteredHeats || []).flatMap((h) =>
      [...(h.heat_assignments || [])]
        .sort((a, b) => a.lane_number - b.lane_number)
        .map((a) => a.id)
    );
  }, [filteredHeats]);

  // Simpan/Update/Kosongkan Hasil Waktu & Status Lomba per Lintasan
  const handleSaveResult = async (
    assignmentId: string,
    resultId?: string,
    defaultStatus: string = 'finished',
    existingTimeMs?: number | null,
    overrideTimeStr?: string
  ) => {
    const rawTime = overrideTimeStr !== undefined ? overrideTimeStr : (timeInputs[assignmentId] ?? '');
    const status = statusInputs[assignmentId] || defaultStatus;

    // JIKA OPERATOR MENGOSONGKAN WAKTU (string kosong, "-", atau "00.00.00")
    const isClearing =
      status === 'finished' &&
      (!rawTime ||
        rawTime.trim() === '' ||
        rawTime.trim() === '-' ||
        rawTime.trim() === '0' ||
        rawTime.trim() === '00.00.00');

    if (isClearing) {
      if (resultId) {
        setSavingMap((prev) => ({ ...prev, [assignmentId]: true }));
        try {
          const { error } = await supabase.from('results').delete().eq('id', resultId);
          if (error) throw error;
          setTimeInputs((prev) => ({ ...prev, [assignmentId]: '' }));
          toast.success('Hasil catatan waktu lintasan berhasil dikosongkan.');
          router.refresh();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Gagal mengosongkan hasil');
        } finally {
          setSavingMap((prev) => ({ ...prev, [assignmentId]: false }));
        }
        return;
      } else {
        setTimeInputs((prev) => ({ ...prev, [assignmentId]: '' }));
        toast.info('Catatan waktu dikosongkan.');
        return;
      }
    }

    let timeMs: number | null = null;

    // Waktu hanya diisi untuk status 'finished' (selesai)
    if (status === 'finished') {
      const parsed = parseSwimTimeInput(rawTime);
      const sourceMs = parsed.timeMs;

      if (!sourceMs || isNaN(sourceMs) || sourceMs <= 0) {
        toast.error('Masukkan waktu terlebih dahulu (contoh: 00.20.21 atau ketik 002021)');
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

      toast.success('Catatan waktu berhasil disimpan!');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan hasil');
    } finally {
      setSavingMap((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  // Fungsi Instan Mengosongkan Hasil Lintasan
  const handleClearResult = async (assignmentId: string, resultId?: string) => {
    if (!resultId) {
      setTimeInputs((prev) => ({ ...prev, [assignmentId]: '' }));
      toast.info('Input waktu dikosongkan.');
      return;
    }

    setSavingMap((prev) => ({ ...prev, [assignmentId]: true }));
    try {
      const { error } = await supabase.from('results').delete().eq('id', resultId);
      if (error) throw error;
      setTimeInputs((prev) => ({ ...prev, [assignmentId]: '' }));
      toast.success('Hasil catatan waktu lintasan berhasil dikosongkan.');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengosongkan hasil');
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

        const isClearing =
          status === 'finished' &&
          (!rawTime || rawTime.trim() === '' || rawTime.trim() === '00.00.00' || rawTime.trim() === '-');

        if (isClearing) {
          if (existingResult?.id) {
            await supabase.from('results').delete().eq('id', existingResult.id);
            savedCount++;
          }
          continue;
        }

        let timeMs: number | null = null;
        if (status === 'finished') {
          const parsed = rawTime ? parseSwimTimeInput(rawTime) : null;
          const sourceMs = parsed?.timeMs ?? existingResult?.time_ms;
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
          `${savedCount} hasil lintasan Seri ${heat.heat_number} berhasil disimpan & disinkronkan ke Buku Acara!`
        );
        router.refresh();
      } else {
        toast.info('Belum ada waktu tempuh baru yang diisi pada Seri ini.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan hasil batch');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Handle Input Ketik Waktu (Auto-Format 002021 -> 00.20.21 & Enter -> Simpan & Pindah ke Lane Berikutnya)
  const handleTimeChange = (assignId: string, val: string) => {
    // Jika operator mengetik 6 digit angka tanpa titik (e.g. "002021"), langsung format ke "00.20.21"
    if (/^\d{6}$/.test(val)) {
      const autoFormatted = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4, 6)}`;
      setTimeInputs((prev) => ({ ...prev, [assignId]: autoFormatted }));
      return;
    }

    setTimeInputs((prev) => ({ ...prev, [assignId]: val }));
  };

  const handleTimeBlur = (assignId: string) => {
    const raw = timeInputs[assignId];
    if (raw && raw !== '-' && raw.trim() !== '') {
      const parsed = parseSwimTimeInput(raw);
      if (parsed.formatted) {
        setTimeInputs((prev) => ({ ...prev, [assignId]: parsed.formatted }));
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentAssignId: string,
    existingResult?: { id: string; time_ms?: number | null; status?: string }
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const raw =
        timeInputs[currentAssignId] ??
        (existingResult?.time_ms ? formatMsToFinalTime(existingResult.time_ms) : '');

      let formattedTime = raw;
      if (raw && raw !== '-' && raw.trim() !== '') {
        const parsed = parseSwimTimeInput(raw);
        if (parsed.formatted) {
          formattedTime = parsed.formatted;
          setTimeInputs((prev) => ({ ...prev, [currentAssignId]: parsed.formatted }));
        }
      }

      // 1. Simpan data lintasan saat ini
      handleSaveResult(
        currentAssignId,
        existingResult?.id,
        existingResult?.status || 'finished',
        existingResult?.time_ms,
        formattedTime
      );

      // 2. Cari index assignment berikutnya dan pindahkan fokus kursor secara instan
      const currentIndex = orderedAssignmentIds.indexOf(currentAssignId);
      if (currentIndex >= 0 && currentIndex < orderedAssignmentIds.length - 1) {
        const nextAssignId = orderedAssignmentIds[currentIndex + 1];
        const nextInputEl = inputRefs.current[nextAssignId];
        if (nextInputEl) {
          nextInputEl.focus();
          nextInputEl.select();
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Koneksi Langsung ke Buku Acara */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-950">
              Terhubung Langsung ke Buku Acara (Start List &amp; Hasil)
            </h4>
            <p className="text-xs text-blue-800/80">
              Format final time standar 3 grup: <b>00.20.21</b> (Menit.Detik.Milidetik). Ketik <code>002021</code> lalu tekan <b>Enter</b> untuk auto-save dan pindah ke lintasan berikutnya.
            </p>
          </div>
        </div>

        <Link href={`/buku-acara?event=${selectedEventId}`}>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer">
            <BookOpen className="h-4 w-4" /> Buka Buku Acara <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Filter Bar (Event & Nomor Lomba) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-2xl border">
        <div className="space-y-1">
          <label className="text-xs font-semibold">Pilih Kejuaraan / Event</label>
          <Select value={selectedEventId} onValueChange={handleEventChange} disabled={isPending}>
            <SelectTrigger className="bg-background rounded-xl">
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
            <SelectTrigger className="bg-background rounded-xl">
              <SelectValue placeholder="Pilih Nomor Lomba" />
            </SelectTrigger>
            <SelectContent>
              {compEvents.map((ce) => (
                <SelectItem key={ce.id} value={ce.id}>
                  {formatCompEventSubtitle(ce.name, ce.grade_level)} ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── TOOLBAR SELEKSI SERI / HEAT DENGAN INDIKATOR CENTANG LENGKAP (✓) ── */}
      {heatsData && heatsData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Pilihan Seri / Heat:</span>
            </span>

            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              {heatsData.filter((h) => getHeatCompletionStatus(h).isComplete).length} / {heatsData.length} Seri Tuntas Selesai
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedHeatFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                selectedHeatFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              )}
            >
              Semua Seri ({heatsData.length})
            </button>

            {heatsData.map((heat) => {
              const { total, filled, isComplete } = getHeatCompletionStatus(heat);
              const isSelected = selectedHeatFilter === heat.id;

              return (
                <button
                  key={heat.id}
                  type="button"
                  onClick={() => setSelectedHeatFilter(heat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs',
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700'
                      : isComplete
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <span>Seri {heat.heat_number}</span>
                  {isComplete ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-black',
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
                      )}
                    >
                      <Check className="h-3 w-3 stroke-[3]" /> Selesai
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'text-[10px] font-mono font-normal',
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      )}
                    >
                      ({filled}/{total})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Render Daftar Heat & Lane */}
      {!filteredHeats || filteredHeats.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed rounded-2xl">
          Belum ada Acara yang dibuat untuk nomor ini. Buat acara di modul <b>Acara</b> terlebih dahulu.
        </Card>
      ) : (
        filteredHeats.map((heat) => {
          const { total, filled, isComplete } = getHeatCompletionStatus(heat);

          return (
            <Card
              key={heat.id}
              className={cn(
                'border-t-4 rounded-2xl overflow-hidden shadow-xs transition-all',
                isComplete ? 'border-t-emerald-500 border-emerald-200' : 'border-t-blue-600'
              )}
            >
              <CardHeader className="py-3 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b">
                <div className="flex items-center gap-2.5">
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <span>Acara / Seri {heat.heat_number}</span>
                  </CardTitle>

                  {/* Indikator Ceklis Selesai di Header Card */}
                  {isComplete ? (
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-xs flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Selesai Diisi (Semua Lintasan Lengkap ✓)</span>
                    </Badge>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {filled} dari {total} Lintasan Terisi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveAllInHeat(heat)}
                    disabled={isSavingAll}
                    className="h-8 gap-1.5 text-xs font-bold border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Simpan Semua Lintasan
                  </Button>
                  <Link href={`/buku-acara?event=${selectedEventId}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer"
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

                      // Default value format 3 grup "00.20.21"
                      const currentDisplayTime =
                        timeInputs[assign.id] !== undefined
                          ? timeInputs[assign.id]
                          : existingResult?.time_ms
                          ? formatMsToFinalTime(existingResult.time_ms)
                          : '';

                      const currentStatus =
                        statusInputs[assign.id] || existingResult?.status || 'finished';

                      return (
                        <div
                          key={assign.id}
                          className={cn(
                            'p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors',
                            existingResult?.time_ms ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-muted/10'
                          )}
                        >
                          {/* Lane & Athlete Info */}
                          <div className="flex items-stretch gap-3">
                            <span className="flex w-9 shrink-0 self-center flex-col items-center justify-center rounded-xl bg-primary/10 py-1 text-primary shadow-2xs">
                              <span className="text-[9px] font-semibold uppercase leading-none">Lane</span>
                              <span className="text-base font-black leading-none">{assign.lane_number}</span>
                            </span>
                            <div className="min-w-0 self-center">
                              <p className="font-bold text-sm text-slate-900 leading-tight">
                                {athlete?.full_name || 'Tidak ada atlet'}
                              </p>
                              <p className="truncate text-xs text-muted-foreground mt-0.5">
                                {school?.name || 'Klub / Kontingen Mandiri'}
                              </p>
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
                              <SelectTrigger className="w-28 text-xs font-semibold h-9 rounded-xl bg-white">
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
                                {/* Input Waktu 3-Digit Grup (MM.SS.MS: 00.20.21) */}
                                <Input
                                  ref={(el) => {
                                    inputRefs.current[assign.id] = el;
                                  }}
                                  placeholder="00.20.21"
                                  className="w-36 text-center font-mono font-bold text-base h-9 rounded-xl bg-white shadow-2xs border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-100"
                                  disabled={currentStatus !== 'finished'}
                                  value={
                                    currentStatus !== 'finished'
                                      ? '-'
                                      : currentDisplayTime
                                  }
                                  onChange={(e) => handleTimeChange(assign.id, e.target.value)}
                                  onBlur={() => handleTimeBlur(assign.id)}
                                  onKeyDown={(e) => handleKeyDown(e, assign.id, existingResult)}
                                  title="Format 00.20.21 (Tekan Enter untuk simpan & pindah ke lintasan berikutnya)"
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
                                  className="gap-1 min-w-[80px] h-9 rounded-xl cursor-pointer"
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

                                {(existingResult || currentDisplayTime) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleClearResult(assign.id, existingResult?.id)}
                                    disabled={savingMap[assign.id]}
                                    className="h-9 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                                    title="Kosongkan catatan waktu lintasan ini"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>

                              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Seed: {assign.registrations?.seed_time_ms ? formatMsToFinalTime(assign.registrations.seed_time_ms) : 'NT'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
