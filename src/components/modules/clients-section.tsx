'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { type ShowcaseItem, DEFAULT_CLIENTS } from '@/lib/data/landing-showcases';

export function ClientsSection({ clients = DEFAULT_CLIENTS }: { clients?: ShowcaseItem[] }) {
  return (
    <div className="space-y-20">
      {/* 1. Client Kami */}
      <div className="space-y-10">
        <div className="text-center">
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--m-ink)]">
            Client Kami
          </h3>
        </div>

        {/* 4 Client Logos Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {clients.map((cli, idx) => (
            <div
              key={cli.id || idx}
              className="group flex h-24 w-32 sm:h-28 sm:w-36 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cli.imageUrl || '/brand/clients/rafka-printing.png'}
                alt={cli.title}
                className="max-h-full max-w-full object-contain filter transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Ukir Prestasimu dan Jadilah Pemenang Bersama Rajendra Project */}
      <div className="mx-auto max-w-3xl text-center space-y-5">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-[var(--m-ink)]">
          Ukir Prestasimu dan Jadilah Pemenang Bersama Rajendra Project.
        </h3>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Jadilah bagian dari komunitas para juara. Ribuan talenta muda telah bergabung, kini giliranmu!
        </p>

        <div className="pt-2">
          <Link
            href="/register?for=daftar"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a2b8] px-8 py-3 text-sm font-bold text-white shadow-md shadow-[#18a2b8]/30 transition-all hover:bg-[#138496] hover:shadow-lg hover:-translate-y-0.5"
          >
            Gabung Sekarang <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 3. Community Photo Collage */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/community-team.png"
          alt="Komunitas Kejuaraan Renang Rajendra Project"
          className="h-auto w-full object-cover max-h-96"
        />
      </div>
    </div>
  );
}
