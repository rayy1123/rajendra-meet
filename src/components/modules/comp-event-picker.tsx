'use client';

import { useMemo, useState } from 'react';
import { Waves } from 'lucide-react';
import { LeaderboardView, type CompEvent } from '@/components/modules/leaderboard-view';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Urutkan nomor lomba supaya tersusun rapi: jarak -> gender -> kelompok -> gaya
function sortCompEvents(list: CompEvent[]): CompEvent[] {
  const genderOrder: Record<string, number> = { Putra: 0, Putri: 1, Campur: 2 };
  const safe = (v: string | null | undefined) => v ?? '';
  const num = (v: number | null | undefined) => v ?? 0;
  return [...list].sort((a, b) => {
    if (num(a.distance_meters) !== num(b.distance_meters))
      return num(a.distance_meters) - num(b.distance_meters);
    const ga = genderOrder[safe(a.gender)] ?? 9;
    const gb = genderOrder[safe(b.gender)] ?? 9;
    if (ga !== gb) return ga - gb;
    if (safe(a.grade_level) !== safe(b.grade_level))
      return safe(a.grade_level).localeCompare(safe(b.grade_level));
    return safe(a.stroke).localeCompare(safe(b.stroke));
  });
}

export function CompEventPicker({
  eventId,
  compEvents,
}: {
  eventId: string;
  compEvents: CompEvent[];
}) {
  const sorted = useMemo(() => sortCompEvents(compEvents), [compEvents]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    sorted.length ? sorted[0].id : undefined
  );

  if (sorted.length === 0) {
    return (
      <p className="mt-3 rounded-xl bg-[var(--m-aqua-soft)] px-3 py-2 text-xs text-[var(--m-aqua-ink)]">
        Nomor lomba belum disusun.
      </p>
    );
  }

  const selected = sorted.find((e) => e.id === selectedId) ?? sorted[0];

  return (
    <div className="mt-3 space-y-3">
      <Select value={selected.id} onValueChange={setSelectedId}>
        <SelectTrigger className="w-full">
          <Waves className="mr-2 h-4 w-4 text-[var(--m-aqua)]" />
          <SelectValue placeholder="Pilih nomor lomba (acara)" />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((ce, idx) => (
            <SelectItem key={ce.id} value={ce.id}>
              <span className="tabular-nums text-muted-foreground">{String(idx + 1).padStart(2, '0')}.</span>{' '}
              {ce.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-2xl border border-[var(--m-border)] bg-[var(--m-surface)] p-4">
        <LeaderboardView
          eventId={eventId}
          compEvents={[selected]}
          embedded
          showHeatTab={false}
          showEventTabs={false}
        />
      </div>
    </div>
  );
}
