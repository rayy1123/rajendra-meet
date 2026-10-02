'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MedalTallyView, type MedalRowItem } from './medal-tally-view';

interface MedalStat {
  id: string;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
}

interface MedalLeaderboardViewProps {
  events: { id: string; name: string }[];
  initialEventId: string;
  medalStats: MedalStat[];
}

// Points standard: gold 5, silver 3, bronze 1
function calcPoints(g: number, s: number, b: number) {
  return g * 5 + s * 3 + b * 1;
}

export function MedalLeaderboardView({
  events,
  initialEventId,
  medalStats,
}: MedalLeaderboardViewProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [isPending, startTransition] = useTransition();

  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    startTransition(() => {
      router.push(`/medals?eventId=${val}`);
    });
  };

  const rows: MedalRowItem[] = useMemo(() => {
    return medalStats.map((stat) => ({
      id: stat.id,
      name: stat.name,
      gold: stat.gold,
      silver: stat.silver,
      bronze: stat.bronze,
      total: stat.gold + stat.silver + stat.bronze,
      points: calcPoints(stat.gold, stat.silver, stat.bronze),
    }));
  }, [medalStats]);

  const activeEventName = events.find((e) => e.id === selectedEventId)?.name || 'Kejuaraan Renang';

  return (
    <div className="space-y-6">
      {/* Filter Event Dropdown */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs max-w-md no-print space-y-1.5">
        <label className="text-xs font-bold text-slate-800 block">Pilih Kejuaraan / Event</label>
        <Select value={selectedEventId} onValueChange={handleEventChange} disabled={isPending}>
          <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-800">
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

      {/* Modern Aquatic Glassmorphism Medal Tally View */}
      <MedalTallyView
        eventName={activeEventName}
        rows={rows}
      />
    </div>
  );
}
