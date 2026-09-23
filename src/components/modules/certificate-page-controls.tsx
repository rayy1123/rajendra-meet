'use client';

import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Award } from 'lucide-react';
import { PrintButton } from '@/components/modules/print-button';

interface CertificatePageControlsProps {
  events: { id: string; name: string }[];
  compEvents: { id: string; label: string }[];
  currentEventId: string;
  currentCeId: string;
}

export function CertificatePageControls({
  events,
  compEvents,
  currentEventId,
  currentCeId,
}: CertificatePageControlsProps) {
  const router = useRouter();

  const handleEventChange = (eId: string) => {
    router.push(`/sertifikat?event=${eId}`);
  };

  const handleCeChange = (cId: string) => {
    router.push(`/sertifikat?event=${currentEventId}&ce=${cId}`);
  };

  return (
    <div className="no-print rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        {/* Dropdown 1: Kejuaraan */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
            <Trophy className="h-3 w-3 text-primary" /> Kejuaraan:
          </label>
          <Select value={currentEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="h-9 w-full sm:w-[260px] text-xs font-bold bg-slate-50 border-slate-200 text-slate-900">
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

        {/* Dropdown 2: Nomor Lomba */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
            <Award className="h-3 w-3 text-indigo-600" /> Nomor Lomba:
          </label>
          <Select
            value={currentCeId || compEvents[0]?.id || ''}
            onValueChange={handleCeChange}
            disabled={compEvents.length === 0}
          >
            <SelectTrigger className="h-9 w-full sm:w-[260px] text-xs font-bold bg-slate-50 border-slate-200 text-slate-900">
              <SelectValue placeholder={compEvents.length === 0 ? 'Belum ada nomor lomba' : 'Pilih Nomor Lomba'} />
            </SelectTrigger>
            <SelectContent>
              {compEvents.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 sm:pt-4">
        <PrintButton />
      </div>
    </div>
  );
}
