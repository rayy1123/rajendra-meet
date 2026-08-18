'use client';

import { useRouter } from 'next/navigation';

export interface Opt {
  id: string;
  label: string;
}

export function HeatLaneSelectors({
  eventOpts,
  compOpts,
  heatOpts,
  currentEvent,
  currentCe,
  currentHeat,
}: {
  eventOpts: Opt[];
  compOpts: Opt[];
  heatOpts: Opt[];
  currentEvent: string;
  currentCe: string;
  currentHeat: string;
}) {
  const router = useRouter();
  const go = (e: string, c: string, h: string) =>
    router.push(`/heat-lane?event=${e}&ce=${c}&heat=${h}`);

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <select
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        value={currentEvent}
        onChange={(e) => go(e.target.value, compOpts[0]?.id ?? '', heatOpts[0]?.id ?? '')}
      >
        {eventOpts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        value={currentCe}
        onChange={(e) => go(currentEvent, e.target.value, heatOpts[0]?.id ?? '')}
      >
        {compOpts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        value={currentHeat}
        onChange={(e) => go(currentEvent, currentCe, e.target.value)}
      >
        {heatOpts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
