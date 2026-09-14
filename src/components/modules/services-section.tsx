'use client';

import { useState } from 'react';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import { type ShowcaseItem, DEFAULT_SERVICES } from '@/lib/data/landing-showcases';
import { cn } from '@/lib/utils';

export function ServicesSection({ services = DEFAULT_SERVICES }: { services?: ShowcaseItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeService = services[selectedIndex] || services[0] || DEFAULT_SERVICES[0];

  // Parse facilities from imageUrl or default
  const facilities = activeService.imageUrl
    ? activeService.imageUrl.split(';').map((s) => s.trim()).filter(Boolean)
    : [
        'Tenaga IT',
        'Tenaga Admin Pendaftaran',
        'Tenaga Admin Penginputan Hasil',
        'Print Out Buku Acara',
        'Print Out Form Timer',
        'PDF Rekap Keuangan',
        'PDF Hasil Register',
      ];

  // Parse terms from linkUrl or default
  const terms = activeService.linkUrl && activeService.linkUrl.includes(';')
    ? activeService.linkUrl.split(';').map((s) => s.trim()).filter(Boolean)
    : [
        'Jika event diluar Jabodetabek dikenakan biaya Akomodasi dan Transportasi',
        'Penyelenggara wajib menyediakan konsumsi untuk tim berupa 2x Snack dan 2x Makan per hari',
        'Biaya wajib dibayarkan paling lambat 1 pekan sebelum pelaksanaan',
        'Maksimal jam kerja adalah s/d Jam 17.00 per hari',
      ];

  const waLink = `https://wa.me/628877151189?text=${encodeURIComponent(
    `Halo Rajendra Swimming Organizer, saya tertarik dengan ${activeService.title}. Mohon informasi detailnya.`,
  )}`;

  return (
    <div className="space-y-8">
      {/* Pills Filter / Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {services.map((srv, idx) => (
          <button
            key={srv.id || idx}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            className={cn(
              'rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 border',
              selectedIndex === idx
                ? 'bg-[#18a2b8] text-white border-[#18a2b8] shadow-md shadow-[#18a2b8]/30 scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
            )}
          >
            {srv.title}
          </button>
        ))}
      </div>

      {/* Main Service Card */}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl">
        {/* Card Header (Cyan / Aqua gradient bar matching screenshot) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#17a2b8] to-[#138496] p-6 sm:p-8 text-white">
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{activeService.title}</h3>
            <p className="text-xs sm:text-sm text-cyan-50 font-medium">
              {activeService.subtitle || 'Jasa manajemen sistem teknologi informasi untuk event renang Anda'}
            </p>
          </div>
          <div className="rounded-2xl bg-white/20 backdrop-blur-md px-5 py-3 text-right self-start sm:self-auto border border-white/20">
            <div className="text-xl sm:text-2xl font-black tracking-tight">{activeService.value}</div>
            <div className="text-[11px] text-cyan-100 font-medium">biaya layanan</div>
          </div>
        </div>

        {/* Card Body (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-6 sm:p-8 gap-8">
          {/* Facilities Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              FASILITAS MELIPUTI:
            </h4>
            <ul className="space-y-3">
              {facilities.map((fac, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#18a2b8] mt-0.5" />
                  <span>{fac}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms Column */}
          <div className="space-y-4 md:pl-8 pt-6 md:pt-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CATATAN & KETENTUAN:
            </h4>
            <ul className="space-y-3">
              {terms.map((term, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-2" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card Footer (CTA) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 p-5 sm:px-8">
          <p className="text-xs sm:text-sm text-slate-600">
            Tertarik dengan layanan ini? Hubungi tim kami untuk informasi lebih lanjut.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a2b8] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#138496] hover:shadow-md shrink-0"
          >
            <MessageCircle className="h-4 w-4" /> Hubungi Kami <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
