'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-[#0b1c30] font-sans text-white">
      {/* Header */}
      <header className="flex h-24 items-center justify-between border-b border-white/15 px-8">
        <div className="flex items-center gap-4">
          <span className="text-4xl text-[#38bdf8]">🌊</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rajendra SCMS</h1>
            <p className="text-sm text-white/60">Live Public Scoreboard</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-white/50">Current Time</div>
          <div className="font-mono text-3xl font-semibold tabular-nums">{now || '14:32:45'}</div>
        </div>
      </header>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 border-b border-white/10 px-8 py-3">
        <select
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
          value={currentEvent}
          onChange={(e) => go(e.target.value, compOpts[0]?.id ?? '', heatOpts[0]?.id ?? '')}
        >
          {eventOpts.map((o) => (
            <option key={o.id} value={o.id} className="text-black">
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
          value={currentCe}
          onChange={(e) => go(currentEvent, e.target.value, heatOpts[0]?.id ?? '')}
        >
          {compOpts.map((o) => (
            <option key={o.id} value={o.id} className="text-black">
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none"
          value={currentHeat}
          onChange={(e) => go(currentEvent, currentCe, e.target.value)}
        >
          {heatOpts.map((o) => (
            <option key={o.id} value={o.id} className="text-black">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <main className="flex flex-col gap-6 p-8">
        {/* Event / Heat info */}
        <div className="flex flex-wrap items-end justify-between rounded-xl border border-white/10 bg-white/5 p-6">
          <div>
            <div className="mb-2">
              <span className="rounded bg-[#006780] px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                {compEventName || '—'}
              </span>
            </div>
            <h2 className="text-4xl font-bold">{eventName || 'Pilih nomor lomba'}</h2>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-white/50">Heat</div>
            <div className="font-mono text-3xl font-semibold text-[#38bdf8] tabular-nums">
              {heatLabel || '-'}
            </div>
          </div>
        </div>

        {/* New Record banner */}
        {hasRecord && (
          <div className="flex items-center justify-between rounded-lg border-2 border-[#F97316] bg-[#ffdbca] p-4 text-[#341100] shadow-[0_0_0_0_rgba(249,115,22,0.7)] animate-[pulse-border_2s_infinite]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <h3 className="text-xl font-bold uppercase">New Meet Record!</h3>
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums">
              {fmt(rows.find((r) => r.isRecord)?.finish ?? null)}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-12 gap-2 border-b border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase text-white/60">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-1 text-center">Lane</div>
            <div className="col-span-4">Swimmer</div>
            <div className="col-span-3">School</div>
            <div className="col-span-3 text-right">Finish</div>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {rows.length === 0 ? (
              <div className="p-8 text-center text-white/50">Belum ada hasil untuk heat ini.</div>
            ) : (
              rows.map((r, i) => (
                <div
                  key={i}
                  className={
                    'grid grid-cols-12 items-center gap-2 border-b border-white/10 px-4 py-3 text-sm ' +
                    (r.isRecord ? 'bg-[#ffb690]/20' : 'hover:bg-white/5')
                  }
                >
                  <div className="col-span-1 text-center font-semibold text-white">
                    {r.rank ?? '-'}
                  </div>
                  <div className="col-span-1 text-center">
                    <span
                      className={
                        'inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold ' +
                        (r.isRecord ? 'bg-[#F97316] text-white' : 'bg-white/15 text-white')
                      }
                    >
                      {r.lane}
                    </span>
                  </div>
                  <div className="col-span-4 font-medium">{r.swimmer}</div>
                  <div className="col-span-3 text-white/60">{r.school ?? '—'}</div>
                  <div className="col-span-3 flex items-center justify-end gap-1 font-mono text-lg font-bold tabular-nums">
                    {fmt(r.finish)}
                    {r.isRecord && <span className="text-[#F97316]">⭐</span>}
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
