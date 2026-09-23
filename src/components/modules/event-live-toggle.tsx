'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Lock, Unlock, Clock, ChevronDown, Check } from 'lucide-react';
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
import { LiveScoreboardMode, checkEventLiveStatus } from '@/lib/data/live-scoreboard-settings';

interface EventLiveToggleProps {
  eventId: string;
  initialMode?: LiveScoreboardMode;
  event: {
    start_date?: string | null;
    end_date?: string | null;
  };
}

export function EventLiveToggle({ eventId, initialMode = 'auto', event }: EventLiveToggleProps) {
  const router = useRouter();
  const [mode, setMode] = useState<LiveScoreboardMode>(initialMode);
  const [loading, setLoading] = useState(false);

  const status = checkEventLiveStatus(event, { mode });

  const handleSelectMode = async (newMode: LiveScoreboardMode) => {
    if (newMode === mode) return;
    setLoading(true);

    try {
      const res = await fetch('/api/scoreboard/live-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, mode: newMode }),
      });

      if (res.ok) {
        setMode(newMode);
        router.refresh();
      }
    } catch (e) {
      console.error('Failed to update live status:', e);
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
            className={`gap-2 text-xs font-bold transition-all shadow-xs ${
              status.isActive
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900'
                : 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950'
            }`}
          >
            {loading ? (
              <BrandedSpinner className="h-3.5 w-3.5" />
            ) : status.isActive ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-600" />
            )}

            <span>Live Scoreboard: {status.isActive ? 'BUKA / LIVE' : 'DITUTUP'}</span>
            <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 font-normal">
              {mode === 'auto' ? 'Otomatis' : mode === 'open' ? 'Paksa Buka' : 'Paksa Tutup'}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-2">
          <DropdownMenuLabel className="text-xs font-bold text-slate-800">
            Atur Akses Live Scoreboard
          </DropdownMenuLabel>
          <p className="text-[11px] text-muted-foreground px-2 pb-2">
            Pilih kapan pengunjung dapat melihat papan skor dan hasil heat kejuaraan ini:
          </p>
          <DropdownMenuSeparator />

          {/* Mode 1: Otomatis */}
          <DropdownMenuItem
            onClick={() => handleSelectMode('auto')}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <Clock className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Otomatis (Sesuai Jadwal)</span>
                {mode === 'auto' && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Buka saat tanggal kejuaraan tiba, dan tutup jika kejuaraan belum dimulai.
              </p>
            </div>
          </DropdownMenuItem>

          {/* Mode 2: Paksa Buka */}
          <DropdownMenuItem
            onClick={() => handleSelectMode('open')}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs mt-1"
          >
            <Unlock className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Buka Sekarang (Live Aktif)</span>
                {mode === 'open' && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Scoreboard langsung dibuka untuk umum (bisa untuk simulasi atau hari H).
              </p>
            </div>
          </DropdownMenuItem>

          {/* Mode 3: Paksa Tutup */}
          <DropdownMenuItem
            onClick={() => handleSelectMode('closed')}
            className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs mt-1"
          >
            <Lock className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Tutup Sementara</span>
                {mode === 'closed' && <Check className="h-4 w-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Sembunyikan papan skor dari publik sampai perlombaan resmi dimulai.
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
