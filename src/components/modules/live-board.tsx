'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Waves, Clock, Activity, RefreshCcw } from 'lucide-react';

export interface LiveRow {
  rank: number | null;
  lane: number;
  swimmer: string;
  school: string | null;
  finish: number | null;
  isRecord: boolean;
  status: string | null;
}

export interface LiveOption {
  id: string;
  label: string;
}

function fmt(ms: number | null): string {
  if (ms === null || ms <= 0) return '--:--.--';
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${s}` : s;
}

export function LiveBoard({
  eventName,
  compEventName,
  heatLabel,
  rows,
  eventOpts,
  compOpts,
  heatOpts,
  currentEvent,
  currentCe,
  currentHeat,
}: {
  eventName: string;
  compEventName: string;
  heatLabel: string;
  rows: LiveRow[];
  eventOpts: LiveOption[];
  compOpts: LiveOption[];
  heatOpts: LiveOption[];
  currentEvent: string;
  currentCe: string;
  currentHeat: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState('');
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-GB'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hasRecord = rows.some((r) => r.isRecord);

  const go = (e: string, c: string, h: string) =>
    router.push(`/live?event=${e}&ce=${c}&heat=${h}`);

  return (
    <div className="min-h-screen bg-white text-[var(--m-ink)]">
      {/* Header */}
      <header className="border-b border-[var(--m-border)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Live Board</h1>
              <p className="text-xs text-[var(--m-muted)]">Hasil langsung · Rajendra Meet</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m-aqua-soft)] px-2.5 py-1 font-semibold text-[var(--m-aqua-ink)]">
              <Activity className="h-3.5 w-3.5" /> Live
            </span>
            <span className="flex items-center gap-1 font-mono text-[var(--m-muted)]">
              <Clock className="h-3.5 w-3.5" /> {now || '--:--:--'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Selector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--m-muted)]">Event</p>
              <select
                className="h-10 w-full rounded-xl border border-[var(--m-border)] bg-[var(--m-surface)] px-3 text-sm font-semibold text-[var(--m-ink)] shadow-sm"
                value={currentEvent}
                onChange={(e) => go(e.target.value, compOpts[0]?.id ?? '', heatOpts[0]?.id ?? '')}
              >
                {eventOpts.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--m-muted)]">Acara</p>
              <select
                className="h-10 w-full rounded-xl border border-[var(--m-border)] bg-[var(--m-surface)] px-3 text-sm font-semibold text-[var(--m-ink)] shadow-sm"
                value={currentCe}
                onChange={(e) => go(currentEvent, e.target.value, heatOpts[0]?.id ?? '')}
              >
                {compOpts.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--m-muted)]">Heat</p>
              <select
                className="h-10 w-full rounded-xl border border-[var(--m-border)] bg-[var(--m-surface)] px-3 text-sm font-semibold text-[var(--m-ink)] shadow-sm"
                value={currentHeat}
                onChange={(e) => go(currentEvent, currentCe, e.target.value)}
              >
                {heatOpts.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--m-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--m-ink)] shadow-sm transition-colors hover:border-[var(--m-aqua)]"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Context */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">
              {compEventName || 'Pilih nomor lomba'}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--m-ink)]">{eventName || 'Live Board'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--m-aqua-soft)] px-3 py-1 text-xs font-semibold text-[var(--m-aqua-ink)]">
              Heat {heatLabel || '-'}
            </span>
          </div>
        </div>

        {/* Record */}
        {hasRecord && (
          <div className="mt-5 rounded-2xl border border-[var(--m-aqua)]/40 bg-[var(--m-aqua-soft)] px-5 py-4 text-[var(--m-aqua-ink)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <h3 className="text-lg font-bold uppercase">Rekor Baru</h3>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums">
                {fmt(rows.find((r) => r.isRecord)?.finish ?? null)}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--m-border)] bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-2 border-b border-[var(--m-border)] bg-[var(--m-soft)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--m-muted)]">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-1 text-center">Ln</div>
            <div className="col-span-4">Atlet</div>
            <div className="col-span-3">Sekolah</div>
            <div className="col-span-3 text-right">Waktu</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-10 text-center text-[var(--m-muted)]">
                <Waves className="h-8 w-8 text-[var(--m-aqua)]" />
                <p className="text-sm font-medium">Belum ada hasil untuk heat ini.</p>
              </div>
            ) : (
              rows.map((r, i) => (
                <div
                  key={i}
                  className={
                    'grid grid-cols-12 items-center gap-2 border-b border-[var(--m-border)] px-4 py-3 text-sm transition-colors ' +
                    (r.isRecord ? 'bg-[var(--m-aqua-soft)]' : 'hover:bg-[var(--m-soft)]')
                  }
                >
                  <div className="col-span-1 text-center font-bold text-[var(--m-ink)]">{r.rank ?? '-'}</div>
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={
                        'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ' +
                        (r.isRecord ? 'bg-[var(--m-aqua)] text-white' : 'bg-[var(--m-soft)] text-[var(--m-muted)]')
                      }
                    >
                      {r.lane}
                    </span>
                  </div>
                  <div className="col-span-4 font-medium text-[var(--m-ink)]">{r.swimmer}</div>
                  <div className="col-span-3 text-[var(--m-muted)]">{r.school ?? '—'}</div>
                  <div className="col-span-3 flex items-center justify-end gap-1 font-mono text-base font-bold tabular-nums text-[var(--m-ink)]">
                    {fmt(r.finish)}
                    {r.isRecord && <span className="text-[var(--m-aqua-ink)]">⭐</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
