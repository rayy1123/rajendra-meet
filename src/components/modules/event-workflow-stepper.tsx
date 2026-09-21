'use client';

import Link from 'next/link';
import {
  Settings,
  ListOrdered,
  Users,
  Layers,
  FileText,
  Trophy,
  Award,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Clock,
  Printer,
  Radio,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExtraLink {
  label: string;
  href: string;
  target?: string;
}

interface StepItem {
  no: number;
  title: string;
  desc: string;
  icon: any;
  stat: string;
  isDone: boolean;
  href: string;
  actionLabel: string;
  color: string;
  extraLinks?: ExtraLink[];
}

interface EventWorkflowStepperProps {
  eventId: string;
  eventName: string;
  compEventCount: number;
  registrationCount: number;
  heatCount: number;
  isLiveActive: boolean;
}

export function EventWorkflowStepper({
  eventId,
  eventName,
  compEventCount,
  registrationCount,
  heatCount,
  isLiveActive,
}: EventWorkflowStepperProps) {
  const steps: StepItem[] = [
    {
      no: 1,
      title: 'Nomor Lomba & KU',
      desc: 'Susun acara lomba per gaya, jarak, dan kelompok umur',
      icon: ListOrdered,
      stat: `${compEventCount} Acara`,
      isDone: compEventCount > 0,
      href: '#atur-acara',
      actionLabel: 'Atur Acara',
      color: 'blue',
    },
    {
      no: 2,
      title: 'Pendaftaran Atlet',
      desc: 'Pendaftaran manual / import Excel & verifikasi biaya',
      icon: Users,
      stat: `${registrationCount} Atlet`,
      isDone: registrationCount > 0,
      href: `/perlombaan/partisipasi/${eventId}`,
      actionLabel: 'Kelola Peserta',
      color: 'emerald',
    },
    {
      no: 3,
      title: 'Seri & Lintasan (Heats)',
      desc: 'Bagi peserta ke dalam heat & lintasan otomatis (Spearhead)',
      icon: Layers,
      stat: `${heatCount} Seri`,
      isDone: heatCount > 0,
      href: `/heats?eventId=${eventId}`,
      actionLabel: 'Bagi Seri & Heat',
      color: 'indigo',
    },
    {
      no: 4,
      title: 'Dokumen & Buku Acara',
      desc: 'Cetak Buku Acara resmi, Juknis, dan ID Card Atlet',
      icon: FileText,
      stat: 'Siap Cetak',
      isDone: heatCount > 0 || compEventCount > 0,
      href: `/buku-acara?event=${eventId}`,
      actionLabel: 'Buka Buku Acara',
      color: 'amber',
      extraLinks: [
        { label: 'Juknis', href: `/juknis?event=${eventId}` },
        { label: 'Kartu Peserta', href: `/kartu-peserta?eventId=${eventId}` },
      ],
    },
    {
      no: 5,
      title: 'Input Hasil & Live Board',
      desc: 'Catat waktu tempuh atlet & tayangkan scoreboard realtime',
      icon: Clock,
      stat: isLiveActive ? 'Live Aktif' : 'Standby',
      isDone: false,
      href: `/results?eventId=${eventId}`,
      actionLabel: 'Input Waktu Lomba',
      color: 'cyan',
      extraLinks: [
        { label: 'Buka Live Board', href: `/public-live/${eventId}`, target: '_blank' },
      ],
    },
    {
      no: 6,
      title: 'Juara & Sertifikat',
      desc: 'Perangkingan resmi, klasemen medali, & cetak sertifikat juara',
      icon: Award,
      stat: 'Hasil & Piagam',
      isDone: false,
      href: `/rankings`,
      actionLabel: 'Perangkingan',
      color: 'purple',
      extraLinks: [
        { label: 'Medali', href: `/medals` },
        { label: 'Sertifikat', href: `/sertifikat?event=${eventId}` },
        { label: 'Ekspor', href: `/export?eventId=${eventId}` },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--m-border)] bg-white p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] font-black text-xs">
              ⚡
            </span>
            <h2 className="font-heading font-black text-base text-[var(--m-ink)] sm:text-lg">
              Alur Kerja Kejuaraan (Event Workflow)
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
              Panduan Panitia 6 Langkah
            </Badge>
          </div>
          <p className="text-xs text-[var(--m-muted)] mt-1">
            Ikuti alur terstruktur dari penyusunan acara hingga cetak piagam juara agar kejuaraan berjalan lancar dan rapi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.no}
              className={cn(
                'group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
                step.isDone
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 bg-white hover:border-[var(--m-aqua)]/60'
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white font-mono text-xs font-black">
                      {step.no}
                    </span>
                    <h3 className="font-heading font-bold text-sm text-[var(--m-ink)]">
                      {step.title}
                    </h3>
                  </div>

                  {step.isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> {step.stat}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                      {step.stat}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--m-muted)] leading-relaxed line-clamp-2">
                  {step.desc}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1 font-bold text-[var(--m-aqua-ink)] hover:text-[var(--m-aqua)] transition-colors"
                >
                  {step.actionLabel} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {step.extraLinks && step.extraLinks.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {step.extraLinks.map((extra) => (
                      <Link
                        key={extra.label}
                        href={extra.href}
                        target={extra.target}
                        className="text-slate-500 hover:text-slate-900 font-semibold underline underline-offset-2"
                      >
                        {extra.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
