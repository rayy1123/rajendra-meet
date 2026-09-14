'use client';

import { formatMsToTime } from '@/lib/utils';
import { QrCodeSvg } from './qr-code-svg';
import { User, Building, Calendar, ShieldCheck, CheckCircle2, Clock, Waves, Award } from 'lucide-react';
import type { ParticipantCardData } from './participant-card-manager';

export function AthleteParticipantCard({
  data,
  isSinglePrint = false,
}: {
  data: ParticipantCardData;
  isSinglePrint?: boolean;
}) {
  const { athlete, event, races, allVerified } = data;

  const verificationPayload = `SCMS:PASS:${athlete.athleteNumber}:${event.id}:${races.length}RACES`;

  return (
    <div
      className={`participant-badge-card relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border-2 border-slate-300 bg-white text-slate-900 shadow-md print:max-w-none print:shadow-none print:border-slate-400 ${
        isSinglePrint ? 'print-single-card' : 'print-card-item'
      }`}
      style={{
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Mockup Lubang Lanyard Badge */}
      <div className="flex justify-center pt-2 pb-1 print:pt-1">
        <div className="h-2 w-16 rounded-full border-2 border-slate-300 bg-slate-100 shadow-inner" />
      </div>

      {/* Header Kartu Peserta */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-xs">
              <Waves className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
                SCMS AQUATIC EVENT
              </p>
              <h2 className="text-xs font-black uppercase tracking-tight text-white line-clamp-1">
                {event.name}
              </h2>
            </div>
          </div>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-white backdrop-blur-xs">
            PASS
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-1.5 text-[10px] text-cyan-100">
          <span className="flex items-center gap-1 line-clamp-1">
            <Calendar className="h-3 w-3 shrink-0" />
            {event.startDate ? new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Event 2026'}
          </span>
          <span className="line-clamp-1 font-medium text-right">
            {event.location || 'Kolam Renang Standar FINA'}
          </span>
        </div>
      </div>

      {/* Label Dokumen Resmi */}
      <div className="bg-slate-900 px-4 py-1 text-center text-[10px] font-black tracking-widest text-white uppercase">
        KARTU TANDA PESERTA / OFFICIAL ATHLETE ID PASS
      </div>

      {/* Profil Atlet */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3.5">
          {/* Avatar / Foto Atlet */}
          <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100 text-slate-400">
            <User className="h-10 w-10 text-slate-400" />
            <span className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[8px] font-black tracking-wider text-white uppercase ${
              athlete.gender === 'male' ? 'bg-blue-600' : 'bg-rose-600'
            }`}>
              {athlete.gender === 'male' ? 'PUTRA' : 'PUTRI'}
            </span>
          </div>

          {/* Info Identitas Atlet */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="inline-block rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 border border-slate-200">
                {athlete.athleteNumber}
              </span>
              <span className="rounded-sm bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200">
                KU {athlete.ageGroup || 'Umum'}
              </span>
            </div>

            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug break-words">
              {athlete.fullName}
            </h3>

            <div className="space-y-0.5 text-[11px] text-slate-600">
              <p className="flex items-center gap-1 font-medium line-clamp-1">
                <Building className="h-3 w-3 shrink-0 text-slate-400" />
                {athlete.schoolName || 'Klub / Kontingen Mandiri'}
              </p>
              {athlete.birthDate && (
                <p className="text-[10px] text-slate-500">
                  Lahir: {new Date(athlete.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Nomor Perlombaan yang Diikuti (Menyesuaikan dengan yang diikuti) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px] font-bold text-slate-700 uppercase">
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3 text-primary" /> Nomor Lomba Diikuti ({races.length})
            </span>
            <span className="text-[9px] text-slate-500">Seed Time / Heat</span>
          </div>

          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5 print:max-h-none print:overflow-visible">
            {races.map((race, idx) => (
              <div
                key={race.registrationId || idx}
                className="flex items-center justify-between gap-2 rounded-lg bg-white p-1.5 text-[11px] border border-slate-200/80 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <p className="font-bold text-slate-900 leading-tight line-clamp-1">
                      {race.eventName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pl-5 text-[9px] text-slate-500">
                    <span>KU: {race.ageGroup}</span>
                    <span>·</span>
                    {race.heatNumber && race.laneNumber ? (
                      <span className="font-bold text-indigo-700">
                        Seri {race.heatNumber} / Lintasan {race.laneNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400">Seri TBA</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-[10px] text-slate-800">
                    {race.seedTimeMs ? formatMsToTime(race.seedTimeMs) : 'NT'}
                  </p>
                  <span className={`inline-block text-[8px] font-bold px-1 rounded-sm ${
                    race.isVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {race.isVerified ? 'LUNAS' : 'MENUNGGU'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bagian Bawah: QR Code & Stempel Verifikasi */}
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-300 pt-2.5">
          {/* QR Code */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-slate-300 bg-white p-1 shadow-2xs">
              <QrCodeSvg value={verificationPayload} size={54} />
            </div>
            <div className="text-[9px] text-slate-500 space-y-0.5">
              <p className="font-mono font-bold text-slate-700">SCAN VERIFIKASI</p>
              <p>Call Room & Petugas</p>
              <p className="text-[8px] text-slate-400">Kejuaraan Resmi SCMS</p>
            </div>
          </div>

          {/* Stempel Status Digital */}
          <div className="text-right">
            {allVerified ? (
              <div className="inline-flex flex-col items-center rounded-xl border-2 border-emerald-600 bg-emerald-50 px-2.5 py-1 text-emerald-800">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> TERVERIFIKASI
                </div>
                <span className="text-[8px] font-semibold text-emerald-700">SIAP BERTANDING</span>
              </div>
            ) : (
              <div className="inline-flex flex-col items-center rounded-xl border border-amber-500 bg-amber-50 px-2.5 py-1 text-amber-800">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider">
                  <Clock className="h-3 w-3 text-amber-600" /> PENDING BAYAR
                </div>
                <span className="text-[8px] font-medium text-amber-700">Perlu Verifikasi</span>
              </div>
            )}
          </div>
        </div>

        {/* Petunjuk Pemanggilan Call Room */}
        <div className="rounded-lg bg-slate-100 p-2 text-[9px] text-slate-600 leading-normal">
          <p className="font-bold text-slate-800 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-slate-600 shrink-0" />
            Tata Tertib Atlet di Meja Panggilan (Call Room):
          </p>
          <ul className="mt-0.5 list-disc pl-3.5 space-y-0.5 text-slate-600">
            <li>Tunjukkan kartu peserta fisik / digital ini saat pemanggilan nomor lomba.</li>
            <li>Hadir di Call Room minimal 20 menit sebelum acara lomba dimulai.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
