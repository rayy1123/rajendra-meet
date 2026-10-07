'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radio,
  Trophy,
  BookOpen,
  Phone,
  Sparkles,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingActionDock() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Tampilkan setelah user scroll sedikit (60px)
      if (window.scrollY > 60) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const waUrl = `https://wa.me/628877151189?text=${encodeURIComponent(
    'Halo Panitia Rajendra Swim System! Saya ingin menanyakan informasi pendaftaran kejuaraan renang & jadwal acara. Terima kasih!'
  )}`;

  const isScoreboard = pathname?.startsWith('/scoreboard') || pathname?.startsWith('/live');
  const isDaftar = pathname?.startsWith('/daftar-lomba');
  const isProgram = pathname?.startsWith('/program') || pathname?.startsWith('/buku-acara');

  if (!visible) return null;

  return (
    <>
      {/* ── 1. MOBILE DOCK (LAYAR SMARTPHONE < 768px) ── */}
      <div
        className="fixed bottom-3 inset-x-3 z-40 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none print:hidden"
        aria-label="Aksi Cepat Kejuaraan"
      >
        <div className="mx-auto max-w-md rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl pointer-events-auto flex items-center justify-between gap-1.5 ring-1 ring-slate-900/10">
          {/* Tombol 1: Live Scoreboard (Pulsing Red) */}
          <Link
            href="/scoreboard"
            className={cn(
              'flex-1 py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all shadow-2xs group',
              isScoreboard
                ? 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                : 'bg-slate-900 active:bg-slate-800 text-white'
            )}
          >
            <div className="flex items-center gap-1 leading-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className={cn('text-[9px] font-black tracking-wider uppercase', isScoreboard ? 'text-white' : 'text-rose-400')}>
                LIVE
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-white mt-0.5 tracking-tight truncate">
              Scoreboard
            </span>
          </Link>

          {/* Tombol 2: DAFTAR LOMBA (Primary Centerpiece Highlight) */}
          <Link
            href="/daftar-lomba"
            className={cn(
              'flex-[1.5] py-2 px-2.5 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all text-center',
              isDaftar
                ? 'bg-gradient-to-r from-blue-700 via-sky-700 to-blue-800 ring-2 ring-sky-400/50'
                : 'bg-gradient-to-r from-[#0284c7] via-sky-600 to-[#0369a1] active:opacity-90 shadow-sky-500/25'
            )}
          >
            <Trophy className="h-4 w-4 text-amber-300 shrink-0" />
            <div className="leading-tight text-left">
              <span className="block text-[8px] font-bold uppercase tracking-widest text-cyan-200">
                REGISTRASI
              </span>
              <span className="block text-xs font-black tracking-tight text-white">
                Daftar Lomba
              </span>
            </div>
          </Link>

          {/* Tombol 3: Buku Acara / Start List */}
          <Link
            href="/program"
            className={cn(
              'flex-1 py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border',
              isProgram
                ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 border-slate-200/80'
            )}
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
            <span className="text-[10px] font-bold text-slate-700 leading-tight truncate">
              Buku Acara
            </span>
          </Link>

          {/* Tombol 4: WhatsApp Panitia */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 shrink-0 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
            title="Chat WhatsApp Panitia"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* ── 2. DESKTOP FLOATING BAR (LAYAR >= 768px) ── */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/10 animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden"
        aria-label="Aksi Cepat Kejuaraan Desktop"
      >
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Rajendra Swim System"
            className="h-6 w-auto object-contain"
          />
          <span className="font-heading font-black text-xs text-slate-900 uppercase tracking-tight">
            Rajendra <span className="text-blue-600">Meet Center</span>
          </span>
        </div>

        {/* Live Score Link */}
        <Link
          href="/scoreboard"
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-2xs',
            isScoreboard ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400/50' : 'bg-slate-900 hover:bg-slate-800'
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span>Live Scoreboard</span>
        </Link>

        {/* Buku Acara */}
        <Link
          href="/program"
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all',
            isProgram
              ? 'border-blue-400 bg-blue-50 text-blue-900 shadow-2xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          )}
        >
          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
          <span>Buku Acara &amp; Start List</span>
        </Link>

        {/* Daftar Lomba (Primary Action) */}
        <Link
          href="/daftar-lomba"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all hover:scale-105"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-300" />
          <span>Daftar Lomba</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {/* Chat WA Panitia */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
          title="Konsultasi Panitia via WhatsApp"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Bantuan Panitia</span>
        </a>
      </div>
    </>
  );
}
