'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radio, CalendarDays, MapPin, Waves, BookOpen, UserPlus, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

import { LiveActiveResult, LiveScoreboardMode } from '@/lib/data/live-scoreboard-settings';

interface LiveClosedCardProps {
  event: {
    id: string;
    name: string;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    pool_type?: string | null;
    lane_count?: number | null;
  };
  reason: LiveActiveResult['reason'];
  mode?: LiveScoreboardMode;
  isAdmin?: boolean;
}

export function LiveClosedCard({ event, reason, mode = 'auto', isAdmin = false }: LiveClosedCardProps) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const handleOpenNow = async () => {
    setOpening(true);
    try {
      const res = await fetch('/api/scoreboard/live-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, mode: 'open' }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOpening(false);
    }
  };

  const isManualClosed = reason === 'manual_closed' || mode === 'closed';

  return (
    <div className="pub-card relative overflow-hidden border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white p-8 sm:p-12 text-center shadow-sm">
      {/* Decorative background glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-amber-300 bg-amber-100/80 text-amber-900 text-xs font-bold uppercase tracking-wider"
          >
            <Lock className="h-3.5 w-3.5 text-amber-700" />
            {isManualClosed ? 'Live Scoreboard Ditutup Panitia' : 'Kejuaraan Belum Berjalan'}
          </Badge>
        </div>

        {/* Icon & Title */}
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100/90 text-amber-700 shadow-inner">
            <Radio className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--m-ink)]">
            Live Scoreboard Belum Dibuka
          </h2>
          <p className="text-sm sm:text-base text-[var(--m-muted)] leading-relaxed">
            {isManualClosed ? (
              <>Papan skor langsung untuk kejuaraan <strong>&ldquo;{event.name}&rdquo;</strong> saat ini sengaja ditutup sementara oleh panitia pelaksana perlombaan.</>
            ) : (
              <>Papan skor langsung untuk kejuaraan <strong>&ldquo;{event.name}&rdquo;</strong> belum aktif. Papan skor akan otomatis dibuka saat perlombaan resmi dimulai di kolam renang.</>
            )}
          </p>
        </div>

        {/* Informasi Jadwal Event */}
        <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-xs space-y-2 shadow-xs text-left">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Informasi Kejuaraan:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            {event.start_date && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Mulai:{' '}
                  <strong>
                    {new Date(event.start_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.lane_count && (
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-primary shrink-0" />
                <span>{event.lane_count} Lintasan · {event.pool_type || 'Standard'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={event?.id ? `/program?event=${event.id}` : '/program'}
            className="pub-btn-primary gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 shadow-sm"
          >
            <BookOpen className="h-4 w-4" /> Lihat Buku Acara & Jadwal
          </Link>
          <Link
            href="/daftar-lomba"
            className="pub-btn-ghost gap-2 text-xs sm:text-sm font-semibold px-5 py-2.5 border border-slate-200"
          >
            <UserPlus className="h-4 w-4" /> Informasi Pendaftaran
          </Link>
        </div>

        {/* Admin Shortcut if Admin is logged in */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-dashed border-amber-200 flex flex-col items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              Akses Khusus Admin / Panitia:
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenNow}
              disabled={opening}
              className="gap-1.5 text-xs font-bold border-emerald-500 text-emerald-700 hover:bg-emerald-50"
            >
              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
              {opening ? 'Membuka...' : 'Buka Live Scoreboard Sekarang'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
