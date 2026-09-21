'use client';

import { useState, useMemo } from 'react';
import { Search, X, Waves, FileText, Check, Sparkles } from 'lucide-react';
import { PrintButton } from '@/components/modules/print-button';

export interface ProgramCompEvent {
  id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: string;
  age_group: string;
  session_no: number;
  order_no: number;
  heats: {
    heat_number: number;
    heat_assignments: {
      lane_number: number;
      registrations: {
        seed_time_ms: number | null;
        athletes: {
          athlete_number?: string | null;
          full_name: string;
          schools?: { name: string } | null;
        } | null;
      } | null;
      results?: {
        time_ms: number | null;
        status: string;
      } | { time_ms: number | null; status: string }[] | null;
    }[] | null;
  }[] | null;
}

interface PublicProgramViewerProps {
  currentEvent: {
    id: string;
    name: string;
    location: string | null;
    start_date: string;
    end_date: string;
  };
  events: Array<{
    id: string;
    name: string;
  }>;
  compEvents: ProgramCompEvent[];
}

function fmtSeed(ms: number | null): string {
  if (!ms || ms <= 0) return '-';
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${s}` : s;
}

/**
 * Komponen pembantu untuk menyorot teks yang cocok dengan kata kunci pencarian
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <span>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="rounded bg-amber-200 px-1 py-0.5 font-bold text-amber-950 shadow-xs"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export function PublicProgramViewer({
  currentEvent,
  events,
  compEvents,
}: PublicProgramViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<number | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'only_matches' | 'highlight_all'>('only_matches');

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Daftar semua sesi unik
  const availableSessions = useMemo(() => {
    const s = new Set<number>();
    compEvents.forEach((ce) => s.add(ce.session_no || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [compEvents]);

  // Statistik pencarian
  const searchStats = useMemo(() => {
    if (!cleanQuery) return { matchedLanes: 0, matchedEvents: 0, matchedAthletes: new Set<string>() };

    let lanesCount = 0;
    let eventsCount = 0;
    const athleteNames = new Set<string>();

    compEvents.forEach((ce) => {
      let eventHasMatch = false;
      const eventNameMatches = ce.name.toLowerCase().includes(cleanQuery);

      ce.heats?.forEach((h) => {
        h.heat_assignments?.forEach((ha) => {
          const athleteName = ha.registrations?.athletes?.full_name?.toLowerCase() || '';
          const schoolName = ha.registrations?.athletes?.schools?.name?.toLowerCase() || '';
          const athleteNo = ha.registrations?.athletes?.athlete_number?.toLowerCase() || '';

          if (
            athleteName.includes(cleanQuery) ||
            schoolName.includes(cleanQuery) ||
            athleteNo.includes(cleanQuery) ||
            eventNameMatches
          ) {
            lanesCount++;
            eventHasMatch = true;
            if (ha.registrations?.athletes?.full_name) {
              athleteNames.add(ha.registrations.athletes.full_name);
            }
          }
        });
      });

      if (eventHasMatch) eventsCount++;
    });

    return {
      matchedLanes: lanesCount,
      matchedEvents: eventsCount,
      matchedAthletes: athleteNames,
    };
  }, [compEvents, cleanQuery]);

  // Pengelompokan & Filter data lomba
  const processedSessions = useMemo(() => {
    const bySession: Record<number, ProgramCompEvent[]> = {};

    compEvents.forEach((ce) => {
      const sessionNo = ce.session_no || 1;

      // Filter sesi jika bukan 'all'
      if (selectedSession !== 'all' && sessionNo !== selectedSession) return;

      // Jika ada kata kunci pencarian
      if (cleanQuery && filterMode === 'only_matches') {
        const eventNameMatches = ce.name.toLowerCase().includes(cleanQuery);

        // Filter heats yang memuat atlet yang cocok
        const matchingHeats = (ce.heats || []).filter((h) => {
          if (eventNameMatches) return true;
          return h.heat_assignments?.some((ha) => {
            const athleteName = ha.registrations?.athletes?.full_name?.toLowerCase() || '';
            const schoolName = ha.registrations?.athletes?.schools?.name?.toLowerCase() || '';
            const athleteNo = ha.registrations?.athletes?.athlete_number?.toLowerCase() || '';
            return (
              athleteName.includes(cleanQuery) ||
              schoolName.includes(cleanQuery) ||
              athleteNo.includes(cleanQuery)
            );
          });
        });

        if (matchingHeats.length > 0) {
          (bySession[sessionNo] ||= []).push({
            ...ce,
            heats: matchingHeats,
          });
        }
      } else {
        (bySession[sessionNo] ||= []).push(ce);
      }
    });

    return bySession;
  }, [compEvents, selectedSession, cleanQuery, filterMode]);

  const sessionKeys = Object.keys(processedSessions)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* ===== ACTION & EVENT BAR (NO-PRINT) ===== */}
      <div className="no-print space-y-4">
        {/* Switcher Event & Tombol Cetak */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {events.map((e) => (
              <a
                key={e.id}
                href={`/program?event=${e.id}`}
                className={
                  e.id === currentEvent.id
                    ? 'rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all'
                    : 'rounded-full border border-border bg-card px-4 py-1.5 text-sm text-[var(--m-muted)] transition-all hover:border-primary hover:text-primary'
                }
              >
                {e.name}
              </a>
            ))}
          </div>
          <PrintButton />
        </div>

        {/* ===== SEARCH BAR NAMA ATLET (FITUR UTAMA) ===== */}
        <div className="pub-card relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Input Pencarian */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atlet (contoh: Budi, Nadine, dsb)..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-10 text-sm font-medium text-[var(--m-ink)] placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Sesi & Toggle Mode */}
            <div className="flex flex-wrap items-center gap-2">
              {availableSessions.length > 1 && (
                <div className="flex items-center rounded-xl border border-border bg-background p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSelectedSession('all')}
                    className={`rounded-lg px-2.5 py-1 transition-colors ${
                      selectedSession === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Semua Sesi
                  </button>
                  {availableSessions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSession(s)}
                      className={`rounded-lg px-2.5 py-1 transition-colors ${
                        selectedSession === s
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Sesi {s}
                    </button>
                  ))}
                </div>
              )}

              {cleanQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setFilterMode((m) =>
                      m === 'only_matches' ? 'highlight_all' : 'only_matches'
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    filterMode === 'only_matches'
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {filterMode === 'only_matches' ? 'Hanya Yang Cocok' : 'Tampilkan Semua'}
                </button>
              )}
            </div>
          </div>

          {/* Indikator Hasil Pencarian */}
          {cleanQuery && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
              <div className="flex items-center gap-2">
                {searchStats.matchedLanes > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Ditemukan {searchStats.matchedLanes} lintasan pada{' '}
                    {searchStats.matchedEvents} nomor acara untuk &quot;{searchQuery}&quot;
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                    <X className="h-3.5 w-3.5 text-amber-600" />
                    Tidak ada atlet atau acara yang cocok dengan &quot;{searchQuery}&quot;
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== PRINTABLE DOCUMENT AREA ===== */}
      <div className="printable-area rounded-2xl border border-border bg-card shadow-sm">
        {/* Header Dokumen Buku Acara */}
        <header className="flex flex-col gap-3 border-b-2 border-primary bg-[#0f1f3d] p-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              BUKU ACARA (EVENT PROGRAM)
            </h1>
            <p className="mt-1 text-sm text-white/70">{currentEvent.name}</p>
            {currentEvent.location && (
              <p className="mt-1 text-xs text-white/50">
                {currentEvent.location} · {currentEvent.start_date} s/d {currentEvent.end_date}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-primary-foreground">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-semibold">Rajendra Meet</span>
          </div>
        </header>

        {/* Konten Sesi & Nomor Acara */}
        <div className="space-y-10 p-6">
          {sessionKeys.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
              <h3 className="mt-3 text-base font-semibold text-[var(--m-ink)]">
                {cleanQuery
                  ? `Tidak ada hasil untuk kata kunci "${searchQuery}"`
                  : 'Belum ada nomor acara pada sesi yang dipilih.'}
              </h3>
              {cleanQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="pub-btn-ghost mt-4 inline-flex text-xs"
                >
                  Tampilkan Seluruh Buku Acara
                </button>
              )}
            </div>
          ) : (
            sessionKeys.map((sessionNo) => (
              <section key={sessionNo} className="print-break-inside-avoid">
                {/* Judul Sesi */}
                <div className="mb-4 flex items-center justify-between bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary">
                  <span>Sesi {sessionNo}</span>
                  <span className="text-xs font-normal lowercase text-[var(--m-muted)]">
                    {processedSessions[sessionNo].length} nomor acara
                  </span>
                </div>

                {/* Daftar Nomor Lomba */}
                <div className="space-y-8">
                  {processedSessions[sessionNo].map((ce) => {
                    return (
                      <div
                        key={ce.id}
                        className="print-break-inside-avoid border-l-2 border-primary/30 pl-4"
                      >
                        {/* Header Nomor Lomba */}
                        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-semibold text-[var(--m-ink)]">
                            <HighlightText text={ce.name} query={searchQuery} />
                          </h3>
                          <span className="font-mono text-xs text-[var(--m-muted)]">
                            {ce.gender}
                            {ce.age_group ? ` · ${ce.age_group}` : ''}
                          </span>
                        </div>

                        {!ce.heats || ce.heats.length === 0 ? (
                          <p className="text-sm italic text-[var(--m-muted)]">
                            Belum ada heat (pembagian lintasan menyusul).
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[...ce.heats]
                              .sort((a, b) => a.heat_number - b.heat_number)
                              .map((heat) => {
                                const rows = (heat.heat_assignments ?? [])
                                  .slice()
                                  .sort((a, b) => a.lane_number - b.lane_number);

                                const fastest = rows.reduce<number | null>((best, r) => {
                                  const t = r.registrations?.seed_time_ms ?? null;
                                  if (t && t > 0 && (best === null || t < best)) return t;
                                  return best;
                                }, null);

                                const eventNameMatches =
                                  cleanQuery && ce.name.toLowerCase().includes(cleanQuery);

                                const heatHasMatch =
                                  cleanQuery &&
                                  rows.some((r) => {
                                    const athleteName =
                                      r.registrations?.athletes?.full_name?.toLowerCase() || '';
                                    const schoolName =
                                      r.registrations?.athletes?.schools?.name?.toLowerCase() || '';
                                    const athleteNo =
                                      r.registrations?.athletes?.athlete_number?.toLowerCase() || '';
                                    return (
                                      athleteName.includes(cleanQuery) ||
                                      schoolName.includes(cleanQuery) ||
                                      athleteNo.includes(cleanQuery) ||
                                      eventNameMatches
                                    );
                                  });

                                return (
                                  <div
                                    key={heat.heat_number}
                                    className={`overflow-hidden rounded-lg border transition-all ${
                                      heatHasMatch
                                        ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-1 ring-amber-300'
                                        : 'border-border'
                                    }`}
                                  >
                                    <div
                                      className={`flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase ${
                                        heatHasMatch
                                          ? 'bg-amber-100 text-amber-900'
                                          : 'bg-[var(--m-aqua-soft)] text-primary'
                                      }`}
                                    >
                                      <span>Heat {heat.heat_number}</span>
                                      <div className="flex items-center gap-1.5">
                                        {heatHasMatch && (
                                          <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-950">
                                            HASIL PENCARIAN
                                          </span>
                                        )}
                                        <span className="font-normal text-[var(--m-muted)]">
                                          {rows.length} lintasan
                                        </span>
                                      </div>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-[var(--m-soft)] text-[11px] uppercase text-[var(--m-muted)]">
                                        <tr>
                                          <th className="w-10 px-2 py-1 text-center">Ln</th>
                                          <th className="px-2 py-1">Nama Atlet</th>
                                          <th className="w-18 px-2 py-1 text-right">Seed</th>
                                          <th className="w-18 px-2 py-1 text-right">Final</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border">
                                        {rows.map((r) => {
                                          const rawName =
                                            r.registrations?.athletes?.full_name ?? '—';
                                          const schoolName =
                                            r.registrations?.athletes?.schools?.name ?? null;
                                          const seed =
                                            r.registrations?.seed_time_ms ?? null;
                                          const resObj = Array.isArray(r.results)
                                            ? r.results[0]
                                            : r.results;
                                          const finalTime = resObj?.time_ms ?? null;
                                          const resultStatus = resObj?.status ?? null;

                                          const isTop =
                                            seed !== null &&
                                            seed > 0 &&
                                            seed === fastest;

                                          const isNameMatched =
                                            cleanQuery &&
                                            (rawName.toLowerCase().includes(cleanQuery) ||
                                              (schoolName &&
                                                schoolName.toLowerCase().includes(cleanQuery)));

                                          return (
                                            <tr
                                              key={r.lane_number}
                                              className={
                                                isNameMatched
                                                  ? 'bg-amber-100/70 font-semibold text-amber-950 transition-colors'
                                                  : isTop
                                                  ? 'bg-orange-50'
                                                  : 'hover:bg-[var(--m-soft)]'
                                              }
                                            >
                                              <td className="px-2 py-1 text-center">
                                                <span
                                                  className={
                                                    isNameMatched
                                                      ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white'
                                                      : isTop
                                                      ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-orange)] text-[11px] font-bold text-[var(--primary-foreground)]'
                                                      : 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-soft)] text-[11px] text-[var(--m-muted)]'
                                                  }
                                                >
                                                  {r.lane_number}
                                                </span>
                                              </td>
                                              <td className="px-2 py-1">
                                                <div className="flex flex-col">
                                                  <span
                                                    className={
                                                      isNameMatched
                                                        ? 'font-bold text-amber-950'
                                                        : isTop
                                                        ? 'font-bold text-[var(--m-ink)]'
                                                        : 'text-[var(--m-ink)]'
                                                    }
                                                  >
                                                    <HighlightText
                                                      text={rawName}
                                                      query={searchQuery}
                                                    />
                                                  </span>
                                                  {schoolName && (
                                                    <span className="text-[11px] text-[var(--m-muted)]">
                                                      <HighlightText
                                                        text={schoolName}
                                                        query={searchQuery}
                                                      />
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-2 py-1 text-right font-mono text-xs text-[var(--m-muted)]">
                                                {fmtSeed(seed)}
                                              </td>
                                              <td className="px-2 py-1 text-right font-mono text-xs">
                                                {finalTime ? (
                                                  <span className="font-bold text-emerald-700">
                                                    {fmtSeed(finalTime)}
                                                  </span>
                                                ) : resultStatus && resultStatus !== 'finished' ? (
                                                  <span className="rounded bg-rose-100 px-1 py-0.5 text-[10px] font-black uppercase text-rose-800">
                                                    {resultStatus}
                                                  </span>
                                                ) : (
                                                  <span className="text-muted-foreground/60 print:inline-block print:w-12 print:border-b print:border-slate-400">
                                                    —
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Footer Buku Acara */}
        <footer className="printable-area flex items-center justify-between border-t border-border px-6 py-3 text-xs text-[var(--m-muted)]">
          <span>Powered by Rajendra Meet SCMS</span>
          <span className="font-mono">Program resmi · Cetak mandiri</span>
        </footer>
      </div>
    </div>
  );
}
