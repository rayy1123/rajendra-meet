'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import {
  Waves,
  ShieldCheck,
  Trophy,
  Timer,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
} from 'lucide-react';

interface SplitAuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  footerLinks?: { label: string; href: string }[];
}

export function SplitAuthShell({
  children,
  title,
  subtitle,
  footerLinks = [],
}: SplitAuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--m-aqua-soft),transparent_28rem)]">
      {/* ── LEFT PANEL: AUTH FORM AREA ── */}
      <div className="flex w-full flex-col bg-white/95 backdrop-blur-md lg:w-1/2 border-r border-slate-200/80">
        {/* Top bar header */}
        <header className="flex h-16 items-center justify-between px-6 sm:px-10 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="Rajendra Meet"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-heading text-sm font-black tracking-tight text-slate-950">
                RAJENDRA MEET
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-400 -mt-0.5 tracking-wider uppercase">
                Swimming Championship
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/scoreboard"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[var(--m-aqua-ink)] bg-[var(--m-aqua-soft)] hover:bg-[var(--m-aqua)] hover:text-white transition-colors"
            >
              <Timer className="h-3.5 w-3.5" /> Live Scoreboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Beranda <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Main form container */}
        <main className="flex-1 px-6 py-8 sm:px-12 sm:py-12 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {title}
              </h1>

              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Injected Form Body */}
            <div>{children}</div>
          </div>
        </main>

        {/* Bottom footer */}
        <footer className="px-6 py-4 sm:px-10 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Rajendra Sports System</span>
              <span className="text-slate-300">•</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/rajendra-organizer-logo.png"
                alt="Rajendra Project"
                className="h-3.5 w-auto object-contain opacity-75"
              />
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-slate-900 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ── RIGHT PANEL: HIGH-END AQUATIC SHOWCASE (INFORMATIVE & ATTRACTIVE) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-[#0f2b5c] via-[#0369a1] to-[#0284c7] text-white">
        {/* Background Image with Deep Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25 pointer-events-none"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Center Hero Glass Box: Platform Capabilities Showcase */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <div className="space-y-2">
            <span className="text-xs font-mono font-black tracking-widest text-cyan-300 uppercase">
              SPORT TECHNOLOGY ECOSYSTEM
            </span>
            <h2 className="font-heading text-3xl xl:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
              Platform Manajemen Kejuaraan Renang Kelas Atas
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed font-normal">
              Otomasi teknis lomba dari pendaftaran massal kontingen, pembagian nomor seri (seeding), live scoreboard sub-detik, hingga invoice resmi dalam satu platform terpadu.
            </p>
          </div>

          {/* 3 Pillar Features Cards (Glassmorphism) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm transition-transform hover:translate-x-1 duration-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-cyan-200">
                <Timer className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xs font-bold text-white uppercase tracking-wide">
                  Realtime Scoreboard &amp; Public Live Board
                </p>
                <p className="text-[11px] text-cyan-100 truncate">
                  Sinkronisasi catatan waktu perenang tanpa refresh, kompatibel layar TV arena &amp; mobile.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm transition-transform hover:translate-x-1 duration-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-amber-300">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xs font-bold text-white uppercase tracking-wide">
                  Standar Nasional &amp; Internasional FINA
                </p>
                <p className="text-[11px] text-cyan-100 truncate">
                  Penentuan juara, circular seeding babak final, rekapitulasi medali, dan buku acara cetak A4.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm transition-transform hover:translate-x-1 duration-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-emerald-300">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xs font-bold text-white uppercase tracking-wide">
                  Dukungan 1.500+ Atlet &amp; Rekap Kontingen
                </p>
                <p className="text-[11px] text-cyan-100 truncate">
                  Import Excel peserta, ID pass Call Room resmi dengan QR Code, dan rekonsiliasi kas klub.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner Card: Public Scoreboard & Technical Support */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-cyan-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Butuh bantuan pendaftaran?</span>
            <span className="text-cyan-300">• Hubungi Official Panitia</span>
          </div>
          <Link
            href="/scoreboard"
            target="_blank"
            className="inline-flex items-center gap-1 font-bold text-cyan-200 hover:text-white transition-colors"
          >
            Pantau Arena Live <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
