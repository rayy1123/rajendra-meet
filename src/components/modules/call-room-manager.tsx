'use client';

import { useState, useMemo, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  Printer,
  ChevronRight,
  ChevronLeft,
  XCircle,
  Flame,
  Volume2,
  Radio,
  Layers,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  UserX,
  Megaphone,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMsToTime, cn } from '@/lib/utils';
import { formatCompEventSubtitle } from '@/lib/age-category';
import { printElement } from '@/lib/utils/print-helper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { CallRoomCheckinItem, CallRoomStatus } from '@/lib/data/call-room-server';

export interface CallRoomAthleteAssignment {
  assignment_id: string;
  lane_number: number;
  heat_id: string;
  heat_number: number;
  competition_event_id: string;
  competition_event_name: string;
  event_id: string;
  athlete_id?: string;
  athlete_name: string;
  athlete_number?: string;
  school_name?: string;
  seed_time_ms?: number | null;
  result_status?: string | null;
}

export interface CallRoomHeatData {
  id: string;
  heat_number: number;
  competition_event_id: string;
  assignments: CallRoomAthleteAssignment[];
}

interface CallRoomManagerProps {
  events: { id: string; name: string }[];
  compEvents: { id: string; name: string; grade_level?: string | null; gender?: string | null; order_no?: number }[];
  activeEventId: string;
  activeCompEventId: string;
  heats: CallRoomHeatData[];
  initialCheckins: Record<string, CallRoomCheckinItem>;
  operatorName?: string;
}

export function CallRoomManager({
  events,
  compEvents,
  activeEventId,
  activeCompEventId,
  heats,
  initialCheckins,
  operatorName = 'Call Room Marshall',
}: CallRoomManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedEventId, setSelectedEventId] = useState(activeEventId);
  const [selectedCompEventId, setSelectedCompEventId] = useState(activeCompEventId);
  const [selectedHeatFilter, setSelectedHeatFilter] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<'all' | 'waiting' | 'called' | 'cleared' | 'scratched'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bibScanInput, setBibScanInput] = useState('');

  // Local checkins map
  const [checkins, setCheckins] = useState<Record<string, CallRoomCheckinItem>>(initialCheckins);
  const [busyAssignments, setBusyAssignments] = useState<Record<string, boolean>>({});

  // Scratch Modal State
  const [scratchTarget, setScratchTarget] = useState<CallRoomAthleteAssignment | null>(null);
  const [scratchReason, setScratchReason] = useState('Tidak Hadir (No Show)');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Switch Event
  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    startTransition(() => {
      router.push(`/call-room?eventId=${val}`);
    });
  };

  // Switch Competition Event
  const handleCompEventChange = (val: string) => {
    setSelectedCompEventId(val);
    startTransition(() => {
      router.push(`/call-room?eventId=${selectedEventId}&compEventId=${val}`);
    });
  };

  // Update Status per Lintasan
  const handleStatusChange = async (
    assignment: CallRoomAthleteAssignment,
    newStatus: CallRoomStatus,
    reason?: string
  ) => {
    const aid = assignment.assignment_id;
    setBusyAssignments((prev) => ({ ...prev, [aid]: true }));

    // Optimistic UI update
    const previousItem = checkins[aid];
    const now = new Date().toISOString();
    const optimistic: CallRoomCheckinItem = {
      id: aid,
      assignment_id: aid,
      heat_id: assignment.heat_id,
      competition_event_id: assignment.competition_event_id,
      event_id: assignment.event_id,
      lane_number: assignment.lane_number,
      athlete_id: assignment.athlete_id,
      athlete_name: assignment.athlete_name,
      athlete_number: assignment.athlete_number,
      school_name: assignment.school_name,
      status: newStatus,
      checked_in_at: newStatus === 'called' || newStatus === 'cleared' ? now : null,
      checked_in_by: operatorName,
      scratch_reason: reason || null,
      notes: '',
      updated_at: now,
    };

    setCheckins((prev) => ({ ...prev, [aid]: optimistic }));

    try {
      const res = await fetch('/api/call-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          assignmentId: aid,
          status: newStatus,
          heatId: assignment.heat_id,
          competitionEventId: assignment.competition_event_id,
          eventId: assignment.event_id,
          laneNumber: assignment.lane_number,
          athleteName: assignment.athlete_name,
          athleteNumber: assignment.athlete_number,
          schoolName: assignment.school_name,
          scratchReason: reason,
          operatorName,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Gagal menyimpan status');

      if (newStatus === 'cleared') {
        toast.success(`Lintasan ${assignment.lane_number}: ${assignment.athlete_name} siap ke kolam.`);
      } else if (newStatus === 'called') {
        toast.info(`Lintasan ${assignment.lane_number}: ${assignment.athlete_name} dipanggil ke Call Room.`);
      } else if (newStatus === 'scratched') {
        toast.warning(`Lintasan ${assignment.lane_number}: ${assignment.athlete_name} ditandai Scratch (${reason}).`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status');
      if (previousItem) {
        setCheckins((prev) => ({ ...prev, [aid]: previousItem }));
      }
    } finally {
      setBusyAssignments((prev) => ({ ...prev, [aid]: false }));
    }
  };

  // Bulk Heat Action
  const handleBulkHeatStatus = async (heat: CallRoomHeatData, targetStatus: CallRoomStatus) => {
    if (heat.assignments.length === 0) return;

    const toastMsg =
      targetStatus === 'called'
        ? `Memanggil seluruh atlet Seri ${heat.heat_number}...`
        : targetStatus === 'cleared'
        ? `Melepas seluruh atlet Seri ${heat.heat_number} menuju arena kolam...`
        : `Mereset status Seri ${heat.heat_number}...`;

    toast.info(toastMsg);

    try {
      const payloadAssignments = heat.assignments.map((a) => ({
        assignment_id: a.assignment_id,
        heat_id: a.heat_id,
        competition_event_id: a.competition_event_id,
        event_id: a.event_id,
        lane_number: a.lane_number,
        athlete_name: a.athlete_name,
        athlete_number: a.athlete_number,
        school_name: a.school_name,
      }));

      const res = await fetch('/api/call-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_heat',
          heatId: heat.id,
          assignments: payloadAssignments,
          targetStatus,
          operatorName,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      // Update local checkins
      setCheckins((prev) => {
        const next = { ...prev };
        (json.data || []).forEach((item: CallRoomCheckinItem) => {
          next[item.assignment_id] = item;
        });
        return next;
      });

      toast.success(`Seri ${heat.heat_number} berhasil diperbarui.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses bulk update');
    }
  };

  // Barcode / Nomor Dada Scanner
  const handleBibScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = bibScanInput.trim().toLowerCase();
    if (!query) return;

    // Cari atlet di semua heat
    let foundAssignment: CallRoomAthleteAssignment | null = null;
    for (const h of heats) {
      for (const a of h.assignments) {
        if (
          (a.athlete_number && a.athlete_number.toLowerCase() === query) ||
          a.athlete_name.toLowerCase().includes(query)
        ) {
          foundAssignment = a;
          break;
        }
      }
      if (foundAssignment) break;
    }

    if (!foundAssignment) {
      toast.error(`Tidak ditemukan atlet dengan No. Dada / Nama "${bibScanInput}".`);
      return;
    }

    const currentStatus = checkins[foundAssignment.assignment_id]?.status || 'waiting';
    let nextStatus: CallRoomStatus = 'called';
    if (currentStatus === 'called') nextStatus = 'cleared';
    else if (currentStatus === 'cleared') nextStatus = 'called';

    handleStatusChange(foundAssignment, nextStatus);
    setBibScanInput('');
  };

  // Heats data filtered
  const filteredHeats = useMemo(() => {
    return (heats || []).filter((h) => {
      if (selectedHeatFilter !== 'all' && h.id !== selectedHeatFilter) return false;
      return true;
    });
  }, [heats, selectedHeatFilter]);

  // Total summary counts across all active heats
  const allAssignments = useMemo(() => {
    return heats.flatMap((h) => h.assignments);
  }, [heats]);

  const statusCounts = useMemo(() => {
    let waiting = 0;
    let called = 0;
    let cleared = 0;
    let scratched = 0;

    allAssignments.forEach((a) => {
      const st = checkins[a.assignment_id]?.status || (a.result_status === 'scr' || a.result_status === 'dns' ? 'scratched' : 'waiting');
      if (st === 'waiting') waiting++;
      else if (st === 'called') called++;
      else if (st === 'cleared') cleared++;
      else if (st === 'scratched' || st === 'no_show') scratched++;
    });

    return {
      total: allAssignments.length,
      waiting,
      called,
      cleared,
      scratched,
    };
  }, [allAssignments, checkins]);

  const activeEventName = events.find((e) => e.id === selectedEventId)?.name || 'Kejuaraan Renang';
  const activeCompEvent = compEvents.find((ce) => ce.id === selectedCompEventId);

  return (
    <div className="space-y-6">
      {/* ── Header Filter & Scanner Bar ── */}
      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Event & Competition Event Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kejuaraan Aktif</label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nomor Acara Lomba</label>
              <select
                value={selectedCompEventId}
                onChange={(e) => handleCompEventChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {compEvents.map((ce) => (
                  <option key={ce.id} value={ce.id}>
                    {ce.order_no ? `Acara ${ce.order_no} - ` : ''}
                    {formatCompEventSubtitle(ce.name, ce.grade_level, ce.gender)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Scanner / Bib Search Input */}
          <div className="w-full lg:w-80">
            <form onSubmit={handleBibScan} className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-blue-600" />
                <span>Pindai Barcode / No. Dada Atlet</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Ketik / Scan No. Dada (mis: 104)"
                  value={bibScanInput}
                  onChange={(e) => setBibScanInput(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-blue-50/50 border-blue-200 focus-visible:ring-blue-500 font-mono"
                />
                <Button type="submit" size="sm" className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3">
                  Check-in
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Status Summary & Quick Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                statusTab === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Semua ({statusCounts.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('waiting')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                statusTab === 'waiting'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Clock className="h-3 w-3" /> Menunggu ({statusCounts.waiting})
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('called')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                statusTab === 'called'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              )}
            >
              <Megaphone className="h-3 w-3" /> Di Call Room ({statusCounts.called})
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('cleared')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                statusTab === 'cleared'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              )}
            >
              <CheckCircle2 className="h-3 w-3" /> Siap ke Kolam ({statusCounts.cleared})
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('scratched')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                statusTab === 'scratched'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
              )}
            >
              <UserX className="h-3 w-3" /> Scratch ({statusCounts.scratched})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (printAreaRef.current) {
                  printElement(printAreaRef.current, {
                    title: `Call-Room-Marshalling-Acara-${activeCompEvent?.order_no || 'Lomba'}`,
                    isLandscape: false,
                  });
                } else {
                  window.print();
                }
              }}
              className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" /> Cetak Lembar Marshalling
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Content: Heat List & Checkin Grid ── */}
      <div ref={printAreaRef} className="space-y-6">
        {/* Printable Official Header */}
        <div className="only-print p-6 space-y-3">
          <div className="bg-[#1b2e4b] text-white p-5 rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-base font-bold uppercase tracking-tight">LEMBAR KENDALI CALL ROOM (MARSHALLING SHEET)</h1>
              <p className="text-xs text-slate-200">{activeEventName}</p>
              <p className="text-xs text-cyan-200 font-bold">
                {activeCompEvent?.order_no ? `Acara ${activeCompEvent.order_no}: ` : ''}
                {formatCompEventSubtitle(activeCompEvent?.name, activeCompEvent?.grade_level, activeCompEvent?.gender)}
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-300">
              <p>Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-white uppercase mt-0.5">Petugas: {operatorName}</p>
            </div>
          </div>
        </div>

        {filteredHeats.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-3">
            <Users className="h-10 w-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-700">Belum Ada Seri / Heat pada Nomor Ini</p>
              <p className="text-xs text-slate-400">
                Silakan lakukan generate heat terlebih dahulu di menu Buku Acara &amp; Seeding.
              </p>
            </div>
            <Link
              href="/buku-acara"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              Buka Buku Acara &rarr;
            </Link>
          </div>
        ) : (
          filteredHeats.map((heat) => {
            const heatAssignments = heat.assignments.sort((a, b) => a.lane_number - b.lane_number);

            // Hitung statistik status per Seri
            const heatClearedCount = heatAssignments.filter(
              (a) => checkins[a.assignment_id]?.status === 'cleared'
            ).length;
            const heatCalledCount = heatAssignments.filter(
              (a) => checkins[a.assignment_id]?.status === 'called'
            ).length;
            const heatScratchCount = heatAssignments.filter((a) => {
              const st = checkins[a.assignment_id]?.status;
              return st === 'scratched' || st === 'no_show' || a.result_status === 'scr' || a.result_status === 'dns';
            }).length;

            const isAllCleared = heatClearedCount === heatAssignments.length && heatAssignments.length > 0;

            return (
              <Card
                key={heat.id}
                className={cn(
                  'overflow-hidden border transition-all rounded-2xl print:border-slate-400 print:shadow-none',
                  isAllCleared ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/90 bg-white'
                )}
              >
                {/* Heat Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 print:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      #{heat.heat_number}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Seri (Heat) {heat.heat_number}</span>
                        {isAllCleared ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Lengkap Menuju Kolam
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-normal">
                            ({heatClearedCount}/{heatAssignments.length} Siap)
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {activeCompEvent?.name} &bull; {heatAssignments.length} Perenang Terdaftar
                      </p>
                    </div>
                  </div>

                  {/* Bulk Actions for this Heat */}
                  <div className="flex items-center gap-2 print:hidden flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkHeatStatus(heat, 'called')}
                      className="rounded-xl h-8 text-xs font-bold gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    >
                      <Megaphone className="h-3 w-3" /> Panggil Seri {heat.heat_number}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleBulkHeatStatus(heat, 'cleared')}
                      className="rounded-xl h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Lepas ke Kolam
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleBulkHeatStatus(heat, 'waiting')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 hover:underline"
                      title="Reset status check-in seri ini"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Lanes Grid */}
                <div className="divide-y divide-slate-100 text-xs">
                  {heatAssignments.map((assignment) => {
                    const checkin = checkins[assignment.assignment_id];
                    const currentStatus: CallRoomStatus =
                      checkin?.status ||
                      (assignment.result_status === 'scr' || assignment.result_status === 'dns'
                        ? 'scratched'
                        : 'waiting');

                    // Filter tab check
                    if (statusTab !== 'all') {
                      if (statusTab === 'scratched' && currentStatus !== 'scratched' && currentStatus !== 'no_show') {
                        return null;
                      }
                      if (statusTab !== 'scratched' && currentStatus !== statusTab) {
                        return null;
                      }
                    }

                    const isBusy = busyAssignments[assignment.assignment_id];

                    return (
                      <div
                        key={assignment.assignment_id}
                        className={cn(
                          'p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                          currentStatus === 'cleared'
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                            : currentStatus === 'called'
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : currentStatus === 'scratched' || currentStatus === 'no_show'
                            ? 'bg-rose-50/40 opacity-75'
                            : 'hover:bg-slate-50/70'
                        )}
                      >
                        {/* Athlete Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0',
                              currentStatus === 'cleared'
                                ? 'bg-emerald-600 text-white'
                                : currentStatus === 'called'
                                ? 'bg-amber-500 text-white'
                                : currentStatus === 'scratched'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            )}
                          >
                            L{assignment.lane_number}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {assignment.athlete_name}
                              </p>
                              {assignment.athlete_number && (
                                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  #{assignment.athlete_number}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {assignment.school_name || 'Klub Independen'} &bull; Seed:{' '}
                              {assignment.seed_time_ms ? formatMsToTime(assignment.seed_time_ms) : 'NT'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                              currentStatus === 'cleared'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : currentStatus === 'called'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : currentStatus === 'scratched' || currentStatus === 'no_show'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                          >
                            {currentStatus === 'cleared' ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600 stroke-[3]" /> Siap ke Kolam
                              </>
                            ) : currentStatus === 'called' ? (
                              <>
                                <Megaphone className="h-3 w-3 text-amber-600" /> Di Call Room
                              </>
                            ) : currentStatus === 'scratched' || currentStatus === 'no_show' ? (
                              <>
                                <XCircle className="h-3 w-3 text-rose-600" />{' '}
                                {checkin?.scratch_reason ? `Batal (${checkin.scratch_reason})` : 'Scratch'}
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 text-slate-400" /> Menunggu
                              </>
                            )}
                          </span>

                          {/* Print Marshall Checkbox Column (Only visible when printing) */}
                          <div className="only-print text-center w-24">
                            <span className="inline-block h-4 w-4 border border-slate-500 rounded" />
                          </div>

                          {/* Interactive Action Buttons */}
                          <div className="flex items-center gap-1.5 print:hidden">
                            {currentStatus === 'waiting' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(assignment, 'called')}
                                className="h-7.5 px-2.5 text-xs font-bold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 rounded-lg"
                              >
                                Panggil
                              </Button>
                            )}

                            {currentStatus === 'called' && (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(assignment, 'cleared')}
                                className="h-7.5 px-2.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-2xs"
                              >
                                Siap ke Kolam &rarr;
                              </Button>
                            )}

                            {currentStatus === 'cleared' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(assignment, 'waiting')}
                                className="h-7.5 px-2 text-[11px] text-slate-400 hover:text-slate-700"
                              >
                                Batal Cleared
                              </Button>
                            )}

                            {currentStatus !== 'scratched' && currentStatus !== 'no_show' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setScratchTarget(assignment);
                                  setScratchReason('Tidak Hadir (No Show)');
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Tandai Scratch / Mengundurkan Diri"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(assignment, 'waiting')}
                                className="h-7.5 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                              >
                                Pulihkan Lintasan
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}

        {/* Printable Signature Footer for Marshall */}
        <div className="only-print pt-8 grid grid-cols-2 text-center text-xs text-slate-800">
          <div className="space-y-16">
            <p className="font-semibold">Petugas Call Room / Marshall</p>
            <p className="font-bold border-t border-slate-400 max-w-[200px] mx-auto pt-1">
              ( {operatorName} )
            </p>
          </div>
          <div className="space-y-16">
            <p className="font-semibold">Technical Delegate (TD) / Referee</p>
            <p className="font-bold border-t border-slate-400 max-w-[200px] mx-auto pt-1">
              ( .................................................. )
            </p>
          </div>
        </div>
      </div>

      {/* ── Scratch / No-Show Confirmation Dialog ── */}
      <Dialog open={!!scratchTarget} onOpenChange={(open) => !open && setScratchTarget(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-900 flex items-center gap-2">
              <UserX className="h-5 w-5 text-rose-600" />
              Konfirmasi Scratch / Pembatalan Lintasan
            </DialogTitle>
          </DialogHeader>

          {scratchTarget && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">
                  {scratchTarget.athlete_name} (Lintasan {scratchTarget.lane_number} &bull; Seri {scratchTarget.heat_number})
                </p>
                <p className="text-slate-500">Klub: {scratchTarget.school_name || '-'}</p>
                <p className="text-slate-500">Nomor: {scratchTarget.competition_event_name}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Alasan Pembatalan (Scratch):</label>
                <select
                  value={scratchReason}
                  onChange={(e) => setScratchReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Tidak Hadir (No Show)">Tidak Hadir (No Show / DNS)</option>
                  <option value="Sakit / Cedera">Sakit / Cedera</option>
                  <option value="Mundur Strategis Klub">Mundur Strategis Klub (Scratch Resmi)</option>
                  <option value="Salah Nomor Lomba">Salah Nomor Lomba</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                Pemberitahuan ini akan otomatis mengosongkan lintasan di buku juri dan mencatat status DNS/SCR pada hasil resmi.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setScratchTarget(null)} className="rounded-xl">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (scratchTarget) {
                  handleStatusChange(scratchTarget, 'scratched', scratchReason);
                  setScratchTarget(null);
                }
              }}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Tandai Scratch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
