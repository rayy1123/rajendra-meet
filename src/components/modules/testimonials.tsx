'use client';

import { useState, useMemo } from 'react';
import {
  Quote,
  Star,
  CheckCircle2,
  Users,
  Trophy,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  MessageSquareQuote,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Testimonial {
  text: string;
  name: string;
  role: string;
  category?: 'parent' | 'coach' | 'swimmer';
  event?: string;
  highlight?: string;
  rating?: number;
  club?: string;
}

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Naya Kurnia',
    role: 'Orang Tua Peserta',
    category: 'parent',
    event: 'Home Tournament Series IV',
    highlight: 'Suasana Ramah & Fun untuk Anak',
    rating: 5,
    club: 'Harahap Swimming School',
    text: 'Ini pertama kalinya anak saya ikut kompetisi yang diselenggarakan bersama Rajendra Swim System, dan saya benar-benar menikmati setiap momennya! Suasananya sangat mendukung, panitianya ramah dan informatif, serta acaranya fun banget. Anak jadi tidak trauma berlomba, malah nggak sabar mau ikut event selanjutnya!',
  },
  {
    name: 'Koko Nugroho',
    role: 'Orang Tua Peserta',
    category: 'parent',
    event: 'Kejurda Pelajar Banten 2026',
    highlight: 'Disiplin Waktu & Terorganisir Rapih',
    rating: 5,
    club: 'Klub Akuatik Tirta',
    text: 'Event lomba renang dari Rajendra Swim System sangat terorganisir dengan baik. Panggilan Call Room tertib, jadwal seri tepat waktu, dan anak saya jadi semakin percaya diri serta bersemangat berlatih renang. Suasana kompetisinya kompetitif namun tetap menyenangkan untuk anak-anak!',
  },
  {
    name: 'Willy Surya',
    role: 'Pelatih Kepala (Head Coach)',
    category: 'coach',
    event: 'Kejurnas Akuatik Seri I',
    highlight: 'Live Scoreboard Real-Time & Transparan',
    rating: 5,
    club: 'Jangkar Swimming Club',
    text: 'Sebagai pelatih, saya sangat mengapresiasi sistem Rajendra Swim System. Fasilitas pencatatan waktu memadai, integrasi touchpad presisi, dan hasil lomba langsung muncul real-time di layar arena maupun smartphone wali atlet. Ini pengalaman positif yang sangat berharga untuk pembinaan atlet muda.',
  },
  {
    name: 'Elly Anggraini',
    role: 'Wali Atlet Pemula',
    category: 'parent',
    event: 'Festival Renang Pelajar',
    highlight: 'Sertifikat & Medali Resmi Instan',
    rating: 5,
    club: 'Mandiri / Sekolah',
    text: 'Terima kasih Rajendra Swim System sudah membuat event yang penuh semangat, sportivitas, dan keceriaan. Transparansi nomor lomba sangat jelas, dan sertifikat resmi berstempel langsung siap diunduh setelah acara selesai. Sangat direkomendasikan untuk seluruh sekolah dan klub!',
  },
];

export function Testimonials({
  items = DEFAULT_TESTIMONIALS,
  className = '',
}: {
  items?: Testimonial[];
  className?: string;
}) {
  const [filter, setFilter] = useState<'all' | 'parent' | 'coach' | 'swimmer'>('all');

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((t) => t.category === filter);
  }, [items, filter]);

  return (
    <div className={cn('space-y-10', className)}>
      {/* ── 1. HEADER SECTION & VALUE PROPOSITION (SESUAI RAJENDRARENANG.COM) ── */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border border-[var(--m-aqua)]/20 shadow-2xs">
            <Sparkles className="h-3 w-3 text-[var(--m-aqua)]" />
            TESTIMONI &amp; KEPUASAN PESERTA
          </span>
        </div>

        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
          Prioritas Utama Kami Adalah Kepuasan Anda.
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Jangan hanya dengar dari kami. Lihat apa kata orang tua, pelatih klub, dan perenang tentang pengalaman nyata berlomba di ekosistem kejuaraan renang Rajendra Swim System.
        </p>
      </div>

      {/* ── 2. TRUST & PROOF METRICS BAR (INFORMATIF) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <p className="font-heading font-black text-xl sm:text-2xl text-slate-900 font-mono">4.9 / 5.0</p>
          <p className="text-[11px] text-slate-500 font-medium">Rating Kepuasan Peserta</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <Users className="h-4 w-4" />
          </div>
          <p className="font-heading font-black text-xl sm:text-2xl text-slate-900 font-mono">1.500+</p>
          <p className="text-[11px] text-slate-500 font-medium">Atlet &amp; Orang Tua Puas</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
          <div className="flex items-center justify-center text-indigo-600 mb-1">
            <Trophy className="h-4 w-4" />
          </div>
          <p className="font-heading font-black text-xl sm:text-2xl text-slate-900 font-mono">150+</p>
          <p className="text-[11px] text-slate-500 font-medium">Klub Akuatik Terdaftar</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-xs">
          <div className="flex items-center justify-center text-emerald-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="font-heading font-black text-xl sm:text-2xl text-slate-900 font-mono">100%</p>
          <p className="text-[11px] text-slate-500 font-medium">Catatan Waktu Tervalidasi</p>
        </div>
      </div>

      {/* ── 3. FILTER PILLS (INTERAKTIF) ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border',
            filter === 'all'
              ? 'bg-[#0f2b5c] text-white border-[#0f2b5c] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          Semua Ulasan ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('parent')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border',
            filter === 'parent'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          Orang Tua Atlet ({items.filter((t) => t.category === 'parent').length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('coach')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border',
            filter === 'coach'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          Pelatih &amp; Official ({items.filter((t) => t.category === 'coach').length})
        </button>
      </div>

      {/* ── 4. STAGGERED 2X2 CARDS GRID (AQUATIC GLASSMORPHISM) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
        {filteredItems.map((t, idx) => (
          <div
            key={idx}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-300"
          >
            {/* Background Soft Glow */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-100/50 blur-2xl group-hover:bg-cyan-200/50 transition-colors" />

            {/* Decorative Quote Icon */}
            <Quote className="absolute right-6 top-6 h-8 w-8 text-slate-200/70 pointer-events-none group-hover:text-cyan-200 transition-colors" />

            <div className="relative z-10 space-y-4">
              {/* Star Rating & Verified Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current drop-shadow-2xs" />
                  ))}
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Peserta Terverifikasi
                </span>
              </div>

              {/* Highlight Tag */}
              {t.highlight && (
                <div className="w-fit">
                  <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-900 border border-blue-200">
                    &ldquo;{t.highlight}&rdquo;
                  </span>
                </div>
              )}

              {/* Quote Body */}
              <blockquote className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal italic">
                &ldquo;{t.text}&rdquo;
              </blockquote>
            </div>

            {/* Author Profile Footer */}
            <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f2b5c] to-[#0284c7] font-heading font-black text-xs text-white shadow-2xs">
                  {t.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h4 className="font-heading font-black text-sm text-slate-900 leading-snug truncate">
                    {t.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 truncate">
                    {t.role} {t.club ? `• ${t.club}` : ''}
                  </p>
                </div>
              </div>

              {t.event && (
                <span className="text-[10px] font-mono text-slate-400 font-bold hidden sm:inline-block shrink-0 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  {t.event}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── 5. BOTTOM CTA BANNER (KONSULTASI & DAFTAR) ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <p className="font-heading font-black text-sm text-slate-900">
            Ingin kejuaraan renang Anda berjalan lancar &amp; memuaskan?
          </p>
          <p className="text-xs text-slate-500">
            Konsultasikan penyelenggaraan event, pengadaan timing system, atau pendaftaran klub Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://wa.me/628877151189"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 shadow-xs transition-colors"
          >
            <HeartHandshake className="h-4 w-4" /> Hubungi Tim Kami
          </a>
        </div>
      </div>
    </div>
  );
}
