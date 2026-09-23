'use client';

import { useRouter } from 'next/navigation';
import { Trophy, CalendarDays, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface ExportEventOption {
  id: string;
  name: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export function ExportEventToolbar({
  events,
  currentEventId,
  totalEvents,
}: {
  events: ExportEventOption[];
  currentEventId: string;
  totalEvents: number;
}) {
  const router = useRouter();

  const handleEventChange = (val: string) => {
    router.push(`/export?eventId=${val}`);
  };

  const active = events.find((e) => e.id === currentEventId) || events[0];

  return (
    <div className="no-print rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
          <Trophy className="h-4 w-4 text-primary" /> Pilih Kejuaraan:
        </span>
        <Select value={currentEventId} onValueChange={handleEventChange}>
          <SelectTrigger className="h-9 w-full sm:w-[320px] text-xs font-bold bg-slate-50 border-slate-200 text-slate-900">
            <SelectValue placeholder="Pilih Kejuaraan" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id} className="text-xs font-semibold">
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
        {active?.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {active.location}
          </span>
        )}
        <span>•</span>
        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-bold text-xs">
          {totalEvents} Nomor Acara Terdaftar
        </Badge>
      </div>
    </div>
  );
}
