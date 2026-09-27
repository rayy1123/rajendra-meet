'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Lock, Unlock, Clock, ChevronDown, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResultsVisibilityMode,
  checkEventResultsVisibility,
} from '@/lib/data/live-scoreboard-settings';
import { toast } from 'sonner';

interface EventResultsToggleProps {
  eventId: string;
  initialMode?: ResultsVisibilityMode;
  event: {
    start_date?: string | null;
    end_date?: string | null;
  };
  compact?: boolean;
}

export function EventResultsToggle({
  eventId,
  initialMode = 'auto',
  event,
  compact = false,
}: EventResultsToggleProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ResultsVisibilityMode>(initialMode);
  const [loading, setLoading] = useState(false);

  const status = checkEventResultsVisibility(event, { resultsMode: mode });

  const handleSelectMode = async (newMode: ResultsVisibilityMode) => {
    if (newMode === mode) return;
    setLoading(true);

    try {
      const res = await fetch('/api/scoreboard/live-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, resultsMode: newMode }),
      });

      if (res.ok) {
        setMode(newMode);
        toast.success(
          newMode === 'open'
            ? 'Hasil lomba resmi dibuka untuk publik!'
            : newMode === 'closed'
            ? 'Hasil lomba ditutup sementara dari publik.'
            : 'Hasil lomba diatur otomatis sesuai jadwal kejuaraan.'
        );
        router.refresh();
      } else {
        toast.error('Gagal memperbarui status hasil lomba.');
      }
    } catch (e) {
      console.error('Failed to update results visibility:', e);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className={`gap-2 text-xs font-bold transition-all shadow-xs rounded-xl cursor-pointer ${
              status.isVisible
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900'
                : 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950'
            }`}
          >
            {loading ? (
              <BrandedSpinner className="h-3.5 w-3.5" />
            ) : status.isVisible ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-600" />
            )}

            <span>
              Hasil Lomba: {status.isVisible ? 'DIBUKA (Publik)' : 'DITUTUP'}
            </span>

            {!compact && (
              <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 font-normal">
                {mode === 'auto' ? 'Otomatis' : mode === 'open' ? 'Paksa Buka' : 'Paksa Tutup'}
              </Badge>
            )}

            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-2 z-50">
          <DropdownMenuLabel className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            Otoritas Publikasi Hasil Lomba
          </DropdownMenuLabel>
          <p className="text-[11px] text-muted-foreground px-2 pb-2 leading-relaxed">
            Atur kapan catatan waktu, peringkat resmi, dan pemenang nomor lomba dapat dilihat oleh peserta &amp; publik:
          </p>
          <DropdownMenuSeparator />

          {/* Mode 1: Buka Sekarang (Publikasikan Hasil) */}
          <DropdownMenuItem
            onClick={() => handleSelectMode('open')}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <Unlock className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="text-emerald-700 font-bold">Buka Sekarang (Publikasikan)</span>
                {mode === 'open' && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Hasil lomba langsung dibuka &amp; bisa dilihat oleh peserta di menu Hasil Lomba / Perangkingan.
              </p>
            </div>
          </DropdownMenuItem>

          {/* Mode 2: Tutup Sementara (Sembunyikan dari Publik) */}
          <DropdownMenuItem
            onClick={() => handleSelectMode('closed')}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs mt-1"
          >
            <Lock className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="text-amber-800 font-bold">Tutup Sementara (Sembunyikan)</span>
                {mode === 'closed' && <Check className="h-4 w-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Sembunyikan hasil dari publik selama proses verifikasi juri, rekonsiliasi nilai, atau pemeriksaan DQ.
              </p>
            </div>
          </DropdownMenuItem>

          {/* Mode 3: Otomatis Sesuai Jadwal */}
          <DropdownMenuItem
            onClick={() => handleSelectMode('auto')}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs mt-1"
          >
            <Clock className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Otomatis (Sesuai Jadwal Lomba)</span>
                {mode === 'auto' && <Check className="h-4 w-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Buka otomatis saat hari perlombaan tiba dan setelah kejuaraan selesai.
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
