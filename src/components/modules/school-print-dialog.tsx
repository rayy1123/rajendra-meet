'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  School,
  Trophy,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface SchoolPrintDialogProps {
  events: { id: string; name: string }[];
  schools: { id: string; name: string }[];
  initialSchoolId?: string;
  trigger?: React.ReactNode;
}

export function SchoolPrintDialog({
  events,
  schools,
  initialSchoolId,
  trigger,
}: SchoolPrintDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState(initialSchoolId || 'all');

  const handleOpenReport = () => {
    if (!selectedEventId) {
      toast.error('Silakan pilih kejuaraan terlebih dahulu.');
      return;
    }
    setOpen(false);
    router.push(`/events/${selectedEventId}/rekap-klub`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <Printer className="h-4 w-4" /> Cetak PDF Rekap per Klub
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading font-black text-base text-slate-950">
            <Printer className="h-5 w-5 text-blue-600" />
            Cetak Rekap Atlet & Status Bayar per Klub
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Pilih kejuaraan dan klub renang untuk mencetak lembar rekapitulasi resmi atlet (daftar nomor lomba yang diikuti & status pembayarannya).
          </p>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> 1. Pilih Kejuaraan
            </label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih Kejuaraan" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-indigo-600" /> 2. Pilih Klub / Kontingen
            </label>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Klub" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold text-blue-700">
                  ⭐ Semua Klub (Cetak Massal)
                </SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleOpenReport}
              disabled={!selectedEventId}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Buka Lembar Rekap <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
