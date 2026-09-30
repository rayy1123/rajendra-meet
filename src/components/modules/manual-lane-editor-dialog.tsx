'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Layers,
  ArrowRightLeft,
  UserPlus,
  Trash2,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface LaneAssignmentData {
  id: string; // heat_assignment_id
  heat_id: string;
  lane_number: number;
  registration_id: string;
  athlete_name: string;
  athlete_number?: string;
  school_name?: string;
  seed_time_ms?: number | null;
}

export interface HeatWithLanes {
  id: string;
  heat_number: number;
  lanes: Record<number, LaneAssignmentData | null>;
}

export interface UnassignedAthlete {
  registration_id: string;
  athlete_name: string;
  athlete_number?: string;
  school_name?: string;
  seed_time_ms?: number | null;
}

interface ManualLaneEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  compEventId: string;
  compEventName: string;
  laneCount?: number;
  onChanged?: () => void;
}

export function ManualLaneEditorDialog({
  isOpen,
  onClose,
  compEventId,
  compEventName,
  laneCount = 8,
  onChanged,
}: ManualLaneEditorDialogProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [heats, setHeats] = useState<HeatWithLanes[]>([]);
  const [unassignedAthletes, setUnassignedAthletes] = useState<UnassignedAthlete[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Swap / Move State
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<LaneAssignmentData | null>(null);
  const [targetHeatId, setTargetHeatId] = useState<string>('');
  const [targetLaneNumber, setTargetLaneNumber] = useState<number>(1);

  // Add Athlete to Lane State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetAssignHeatId, setTargetAssignHeatId] = useState<string>('');
  const [targetAssignLane, setTargetAssignLane] = useState<number>(1);
  const [selectedRegId, setSelectedRegId] = useState<string>('');

  // Fetch data
  const fetchData = async () => {
    if (!compEventId) return;
    setLoading(true);

    try {
      // 1. Ambil seluruh heats & assignments
      const { data: dbHeats, error: heatsErr } = await supabase
        .from('heats')
        .select(`
          id,
          heat_number,
          heat_assignments (
            id,
            heat_id,
            lane_number,
            registration_id,
            registrations (
              seed_time_ms,
              athletes (
                id,
                full_name,
                athlete_number,
                schools (name)
              )
            )
          )
        `)
        .eq('competition_event_id', compEventId)
        .order('heat_number', { ascending: true });

      if (heatsErr) throw heatsErr;

      // 2. Ambil seluruh pendaftaran di nomor lomba ini
      const { data: dbRegs, error: regsErr } = await supabase
        .from('registrations')
        .select(`
          id,
          seed_time_ms,
          athletes (
            id,
            full_name,
            athlete_number,
            schools (name)
          )
        `)
        .eq('competition_event_id', compEventId);

      if (regsErr) throw regsErr;

      const assignedRegIds = new Set<string>();

      // Format heats & lanes
      const formattedHeats: HeatWithLanes[] = (dbHeats || []).map((h: any) => {
        const laneMap: Record<number, LaneAssignmentData | null> = {};
        for (let l = 1; l <= laneCount; l++) {
          laneMap[l] = null;
        }

        const rawAssigns = Array.isArray(h.heat_assignments) ? h.heat_assignments : [];
        rawAssigns.forEach((ha: any) => {
          assignedRegIds.add(ha.registration_id);
          const athlete = ha.registrations?.athletes;
          laneMap[ha.lane_number] = {
            id: ha.id,
            heat_id: h.id,
            lane_number: ha.lane_number,
            registration_id: ha.registration_id,
            athlete_name: athlete?.full_name || 'Tanpa Nama',
            athlete_number: athlete?.athlete_number,
            school_name: athlete?.schools?.name || 'Umum',
            seed_time_ms: ha.registrations?.seed_time_ms,
          };
        });

        return {
          id: h.id,
          heat_number: h.heat_number,
          lanes: laneMap,
        };
      });

      // Filter atlet yang belum terdaftar di lintasan manapun
      const unassigned: UnassignedAthlete[] = [];
      (dbRegs || []).forEach((reg: any) => {
        if (!assignedRegIds.has(reg.id)) {
          unassigned.push({
            registration_id: reg.id,
            athlete_name: reg.athletes?.full_name || 'Tanpa Nama',
            athlete_number: reg.athletes?.athlete_number,
            school_name: reg.athletes?.schools?.name || 'Umum',
            seed_time_ms: reg.seed_time_ms,
          });
        }
      });

      setHeats(formattedHeats);
      setUnassignedAthletes(unassigned);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat susunan seri & lintasan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, compEventId]);

  // 1. Eksekusi Pindah / Tukar Atlet
  const handleExecuteMoveOrSwap = async () => {
    if (!selectedSource || !targetHeatId) return;
    setSubmitting(true);

    try {
      // Cek apakah lintasan target ada isinya (apakah harus swap)
      const targetHeat = heats.find((h) => h.id === targetHeatId);
      const targetLaneItem = targetHeat?.lanes[targetLaneNumber];

      const res = await fetch('/api/heats/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move_or_swap',
          sourceAssignmentId: selectedSource.id,
          targetHeatId,
          targetLaneNumber,
          targetAssignmentId: targetLaneItem?.id || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memindahkan atlet');

      toast.success(json.message);
      setMoveModalOpen(false);
      setSelectedSource(null);
      await fetchData();
      onChanged?.();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal melakukan perpindahan.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Eksekusi Tambah Atlet ke Lintasan Kosong
  const handleExecuteAssignAthlete = async () => {
    if (!targetAssignHeatId || !selectedRegId) {
      toast.error('Silakan pilih atlet yang akan ditugaskan.');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/heats/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_athlete',
          heatId: targetAssignHeatId,
          laneNumber: targetAssignLane,
          registrationId: selectedRegId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menambahkan atlet');

      toast.success(json.message);
      setAssignModalOpen(false);
      setSelectedRegId('');
      await fetchData();
      onChanged?.();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menugaskan atlet.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Eksekusi Kosongkan Lintasan (Scratch)
  const handleRemoveFromLane = async (assignmentId: string, athleteName: string) => {
    if (!confirm(`Keluarkan ${athleteName} dari lintasan ini? Atlet akan berstatus belum ditugaskan.`)) {
      return;
    }

    try {
      const res = await fetch('/api/heats/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_athlete',
          assignmentId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengeluarkan atlet');

      toast.success(json.message);
      await fetchData();
      onChanged?.();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses penghapusan.');
    }
  };

  // 4. Tambah Seri Baru (Heat)
  const handleAddNewHeat = async () => {
    const nextNumber = heats.length > 0 ? Math.max(...heats.map((h) => h.heat_number)) + 1 : 1;
    try {
      const res = await fetch('/api/heats/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_heat',
          compEventId,
          heatNumber: nextNumber,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menambah seri');

      toast.success(json.message);
      await fetchData();
      onChanged?.();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah seri.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border border-[var(--m-border)] bg-white z-50">
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border-[var(--m-aqua)] font-bold text-xs">
                Editor Manual Starting List
              </Badge>
              <span className="text-xs text-[var(--m-muted)]">
                Kapasitas {laneCount} Lintasan Kolam
              </span>
            </div>
            <DialogTitle className="text-lg font-black text-[var(--m-ink)]">
              {compEventName}
            </DialogTitle>
          </div>
          <Button
            size="sm"
            onClick={handleAddNewHeat}
            className="gap-1.5 rounded-xl bg-[var(--m-aqua)] hover:bg-[var(--m-aqua-ink)] text-white text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Seri (Heat) Baru
          </Button>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <BrandedSpinner className="h-7 w-7 text-primary" />
              <p className="text-xs font-semibold text-slate-500">Memuat susunan lintasan...</p>
            </div>
          ) : heats.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
              <Layers className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-bold text-sm text-slate-800">Belum ada seri (heat) pada nomor ini.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tambahkan seri manual dengan tombol di atas atau gunakan fitur <b>Auto-Generate Acara</b> untuk membagi peserta otomatis.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unassigned Athletes Alert */}
              {unassignedAthletes.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        Ada {unassignedAthletes.length} Atlet Terdaftar Belum Mendapat Lintasan:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {unassignedAthletes.slice(0, 8).map((u) => (
                          <span
                            key={u.registration_id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-300 text-[11px] font-medium text-slate-800"
                          >
                            <b>{u.athlete_name}</b> ({u.school_name}) • {u.seed_time_ms ? formatMsToTime(u.seed_time_ms) : 'NT'}
                          </span>
                        ))}
                        {unassignedAthletes.length > 8 && (
                          <span className="text-[11px] text-amber-800 font-bold self-center">
                            +{unassignedAthletes.length - 8} atlet lainnya...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Heats and Lanes Grid */}
              {heats.map((heat) => (
                <div
                  key={heat.id}
                  className="rounded-2xl border border-[var(--m-border)] bg-white overflow-hidden shadow-2xs"
                >
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-[var(--m-aqua)] text-white text-xs font-black flex items-center justify-center">
                        {heat.heat_number}
                      </span>
                      <h4 className="text-sm font-bold text-[var(--m-ink)]">
                        Seri {heat.heat_number}
                      </h4>
                    </div>
                    <span className="text-xs text-[var(--m-muted)] font-medium">
                      {Object.values(heat.lanes).filter(Boolean).length} / {laneCount} Lintasan Terisi
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {Array.from({ length: laneCount }, (_, i) => i + 1).map((laneNo) => {
                      const item = heat.lanes[laneNo];
                      return (
                        <div
                          key={laneNo}
                          className={cn(
                            'px-4 py-2.5 flex items-center justify-between text-xs transition-colors',
                            item ? 'hover:bg-slate-50/70' : 'bg-slate-50/30'
                          )}
                        >
                          {/* Lane Number & Athlete Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                'h-7 w-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 border',
                                item
                                  ? 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border-[var(--m-aqua)]'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              )}
                            >
                              {laneNo}
                            </span>

                            {item ? (
                              <div className="truncate">
                                <p className="font-bold text-[var(--m-ink)] text-xs md:text-sm truncate">
                                  {item.athlete_name}
                                </p>
                                <p className="text-[11px] text-[var(--m-muted)] truncate">
                                  {item.school_name} {item.athlete_number && `• #${item.athlete_number}`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">
                                Lintasan Kosong (Empty Lane)
                              </span>
                            )}
                          </div>

                          {/* Time & Action Buttons */}
                          <div className="flex items-center gap-3 shrink-0">
                            {item ? (
                              <>
                                <span className="font-mono font-bold text-xs tabular-nums text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {item.seed_time_ms ? formatMsToTime(item.seed_time_ms) : 'NT'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSource(item);
                                      setTargetHeatId(item.heat_id);
                                      setTargetLaneNumber(item.lane_number);
                                      setMoveModalOpen(true);
                                    }}
                                    className="h-7 px-2 text-[11px] font-semibold gap-1 text-[var(--m-aqua-ink)] border-[var(--m-border)] hover:bg-[var(--m-soft)]"
                                    title="Pindahkan atau tukar lintasan"
                                  >
                                    <ArrowRightLeft className="h-3 w-3" />
                                    Pindah / Tukar
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromLane(item.id, item.athlete_name)}
                                    className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center transition-colors"
                                    title="Keluarkan dari lintasan"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTargetAssignHeatId(heat.id);
                                  setTargetAssignLane(laneNo);
                                  setSelectedRegId(unassignedAthletes[0]?.registration_id || '');
                                  setAssignModalOpen(true);
                                }}
                                className="h-7 px-2.5 text-[11px] font-semibold gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              >
                                <UserPlus className="h-3 w-3" />
                                + Isi Lintasan
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Tutup Editor
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Sub-Modal: Move or Swap Athlete */}
      {moveModalOpen && selectedSource && (
        <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
          <DialogContent className="max-w-md rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-pop space-y-4 z-50">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-[var(--m-ink)]">
                Pindahkan / Tukar Lintasan Atlet
              </DialogTitle>
            </DialogHeader>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Atlet yang Dipindahkan:</span>
              <p className="font-bold text-sm text-[var(--m-ink)]">{selectedSource.athlete_name}</p>
              <p className="text-slate-600">
                Posisi Saat Ini: Seri {heats.find((h) => h.id === selectedSource.heat_id)?.heat_number} • Lintasan {selectedSource.lane_number}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Pilih Seri Tujuan:</label>
                <select
                  value={targetHeatId}
                  onChange={(e) => setTargetHeatId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-[var(--m-border)] bg-white px-2.5 text-xs text-[var(--m-ink)] outline-none"
                >
                  {heats.map((h) => (
                    <option key={h.id} value={h.id}>
                      Seri {h.heat_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Lintasan Tujuan:</label>
                <select
                  value={targetLaneNumber}
                  onChange={(e) => setTargetLaneNumber(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-[var(--m-border)] bg-white px-2.5 text-xs text-[var(--m-ink)] outline-none"
                >
                  {Array.from({ length: laneCount }, (_, i) => i + 1).map((l) => {
                    const targetHeat = heats.find((h) => h.id === targetHeatId);
                    const isOccupied = Boolean(targetHeat?.lanes[l]);
                    const occName = targetHeat?.lanes[l]?.athlete_name;
                    return (
                      <option key={l} value={l}>
                        Lintasan {l} {isOccupied ? `(Terisi: ${occName?.slice(0, 14)}...)` : '(Kosong)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Note on swap */}
            <p className="text-[11px] text-slate-500 italic">
              Jika lintasan tujuan sudah terisi atlet lain, sistem otomatis akan <b>menukar posisi kedua atlet</b>.
            </p>

            <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMoveModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={submitting}
                onClick={handleExecuteMoveOrSwap}
                className="text-xs rounded-xl bg-[var(--m-aqua)] hover:bg-[var(--m-aqua-ink)] text-white"
              >
                {submitting ? <BrandedSpinner className="h-3.5 w-3.5 text-white" /> : 'Simpan Perpindahan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Sub-Modal: Assign Unassigned Athlete to Lane */}
      {assignModalOpen && (
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="max-w-md rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-pop space-y-4 z-50">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-[var(--m-ink)]">
                Tugaskan Atlet ke Lintasan {targetAssignLane}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Pilih Atlet Terdaftar:</label>
              {unassignedAthletes.length === 0 ? (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 italic">
                  Tidak ada atlet terdaftar yang belum teralokasi di nomor ini.
                </div>
              ) : (
                <select
                  value={selectedRegId}
                  onChange={(e) => setSelectedRegId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[var(--m-border)] bg-white px-2.5 text-xs text-[var(--m-ink)] outline-none"
                >
                  {unassignedAthletes.map((u) => (
                    <option key={u.registration_id} value={u.registration_id}>
                      {u.athlete_name} ({u.school_name}) • {u.seed_time_ms ? formatMsToTime(u.seed_time_ms) : 'NT'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={submitting || unassignedAthletes.length === 0}
                onClick={handleExecuteAssignAthlete}
                className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? <BrandedSpinner className="h-3.5 w-3.5 text-white" /> : 'Tugaskan Atlet'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
