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
import { Save, CheckCircle2, Loader2 } from 'lucide-react';

interface ResultInputOperatorProps {
  events: any[];
  compEvents: any[];
  initialEventId: string;
  initialCompEventId: string;
  heatsData: any[];
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

  // Simpan/Update Hasil Waktu & Status Lomba
  const handleSaveResult = async (
    assignmentId: string,
    resultId?: string,
    defaultStatus: string = 'OK'
  ) => {
    const rawTime = timeInputs[assignmentId];
    const status = statusInputs[assignmentId] || defaultStatus;

    let timeMs: number | null = null;

    // Jika status OK / finished, lakukan validasi & konversi
    if (status === 'OK' || status === 'finished') {
      if (!rawTime && !resultId) {
        toast.error('Masukkan waktu terlebih dahulu');
        return;
      }

      if (rawTime) {
        const parsedMs = formatTimeToMs(rawTime);

        if (!parsedMs || isNaN(parsedMs) || parsedMs <= 0) {
          toast.error('Format waktu tidak valid (Gunakan format 28.45 atau 01:05.12)');
          return;
        }

        timeMs = parsedMs;
      }
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

      toast.success('Hasil berhasil disimpan!');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan hasil');
    } finally {
      setSavingMap((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  return (
    <div className="space-y-6">
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
          Belum ada Heat / Seri Lomba yang dibuat untuk nomor ini. Buat heat di modul <b>Heats</b> terlebih dahulu.
        </Card>
      ) : (
        heatsData.map((heat) => (
          <Card key={heat.id} className="border-t-4 border-t-primary">
            <CardHeader className="py-3 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Heat {heat.heat_number}</CardTitle>
              <span className="text-xs font-medium text-muted-foreground">
                {heat.heat_assignments?.length || 0} Lintasan
              </span>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {heat.heat_assignments &&
                [...heat.heat_assignments]
                  .sort((a: any, b: any) => a.lane_number - b.lane_number)
                  .map((assign: any) => {
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
                      statusInputs[assign.id] || existingResult?.status || 'OK';

                    return (
                      <div
                        key={assign.id}
                        className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                      >
                        {/* Lane & Athlete Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                            {assign.lane_number}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{athlete?.full_name || 'Tidak ada atlet'}</p>
                            <p className="text-xs text-muted-foreground">
                              {school?.name || 'Umum'} • Seed: {formatMsToTime(assign.registrations?.seed_time_ms)}
                            </p>
                          </div>
                        </div>

                        {/* Input Waktu & Status Lomba */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {/* Selector Status */}
                          <Select
                            value={currentStatus}
                            onValueChange={(val) =>
                              setStatusInputs((prev) => ({ ...prev, [assign.id]: val }))
                            }
                          >
                            <SelectTrigger className="w-24 text-xs font-semibold h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="DNS">DNS</SelectItem>
                              <SelectItem value="DSQ">DSQ</SelectItem>
                              <SelectItem value="DNF">DNF</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Input Waktu */}
                          <Input
                            placeholder="28.45 / 01:05.12"
                            className="w-36 text-center font-mono font-bold text-base h-9"
                            disabled={currentStatus !== 'OK' && currentStatus !== 'finished'}
                            value={
                              currentStatus !== 'OK' && currentStatus !== 'finished'
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
                                existingResult?.status
                              )
                            }
                            disabled={savingMap[assign.id]}
                            className="gap-1 min-w-[80px] h-9"
                          >
                            {savingMap[assign.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : existingResult ? (
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