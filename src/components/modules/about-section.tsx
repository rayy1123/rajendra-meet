'use client';

import {
  Users,
  Award,
  MonitorSmartphone,
  Sliders,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { type ShowcaseItem, DEFAULT_PILLARS, DEFAULT_ABOUT } from '@/lib/data/landing-showcases';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Award,
  MonitorSmartphone,
  Sliders,
  MapPin,
};

export function AboutSection({
  about = DEFAULT_ABOUT,
  pillars = DEFAULT_PILLARS,
}: {
  about?: ShowcaseItem;
  pillars?: ShowcaseItem[];
}) {
  return (
    <div className="space-y-16">
      {/* 1. Tentang Kami Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Photo */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={about.imageUrl || '/slider/about-1.jpg'}
                alt={about.title || 'Tentang Rajendra Swimming Organizer'}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Description Text */}
          <div className="space-y-4 lg:col-span-7">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--m-ink)]">
              {about.title || 'Tentang Kami'}
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-slate-700">
              {about.subtitle ||
                'Hadir sejak tahun 2023, Rajendra Swimming Organizer adalah mitra strategis dan terpercaya dalam penyelenggaraan acara olahraga renang di Indonesia. Kami berdedikasi untuk mengangkat standar setiap kompetisi.'}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600">
              {about.value ||
                'Dengan perpaduan antara manajemen event yang solid, pemahaman teknologi, dan kecintaan pada olahraga renang, kami memastikan setiap event berjalan lancar, akurat, dan berkesan bagi atlet, official, maupun penonton.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Mengapa Memilih Rajendra Swimming Organizer? */}
      <div className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[var(--m-ink)]">
            Mengapa Memilih Rajendra Swimming Organizer?
          </h3>
          <p className="text-sm sm:text-base text-slate-600">
            Kami memahami bahwa kesuksesan sebuah kompetisi renang terletak pada detail, kedisiplinan waktu, dan akurasi data. Berikut adalah pilar keunggulan kami:
          </p>
        </div>

        {/* 5 Pillar Cards: 3 on top row, 2 centered on bottom row */}
        <div className="space-y-4">
          {/* Top row (first 3) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.slice(0, 3).map((pil, idx) => {
              const IconComponent = (pil.subtitle && ICON_MAP[pil.subtitle]) || [Users, Award, MonitorSmartphone][idx % 3];
              return (
                <div
                  key={pil.id || idx}
                  className="group flex flex-col items-center rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-200"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 border border-cyan-200 text-[#18a2b8] transition-transform duration-300 group-hover:scale-110 mb-5">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--m-ink)] mb-3">{pil.title}</h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{pil.value}</p>
                </div>
              );
            })}
          </div>

          {/* Bottom row (next 2 centered) */}
          {pillars.length > 3 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mx-auto lg:max-w-4xl">
              {pillars.slice(3, 5).map((pil, idx) => {
                const IconComponent = (pil.subtitle && ICON_MAP[pil.subtitle]) || [Sliders, MapPin][idx % 2];
                return (
                  <div
                    key={pil.id || idx + 3}
                    className="group flex flex-col items-center rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-200"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 border border-cyan-200 text-[#18a2b8] transition-transform duration-300 group-hover:scale-110 mb-5">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-[var(--m-ink)] mb-3">{pil.title}</h4>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{pil.value}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
