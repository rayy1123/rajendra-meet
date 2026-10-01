'use client';

import { QrCodeSvg } from './qr-code-svg';
import { User, Building, Calendar, ShieldCheck, Waves, Award, Sparkles, MapPin, Clock } from 'lucide-react';
import type { ParticipantCardData } from './participant-card-manager';
import { formatKuDisplay } from '@/lib/age-category';

export function AthleteParticipantCard({
  data,
  isSinglePrint = false,
}: {
  data: ParticipantCardData;
  isSinglePrint?: boolean;
}) {
  const { athlete, event, races } = data;

  const verificationPayload = `RAJENDRA-MEET:PASS:${athlete.athleteNumber}:${event.id}:${races.length}RACES`;

  return (
    <div
      className={`participant-badge-card relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border-2 border-[#b48a3c] bg-white text-slate-900 shadow-lg print:max-w-none print:shadow-none print:border-slate-800 ${
        isSinglePrint ? 'print-single-card' : 'print-card-item'
      }`}
      style={{
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ── 1. ORNAMEN WATERMARK GELOMBANG AKUATIK RAJENDRA ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04] print:opacity-[0.06] z-0">
        <svg viewBox="0 0 320 320" className="h-[280px] w-[280px] text-[#0f2b5c]">
          <circle cx="160" cy="160" r="150" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 3" />
          <circle cx="160" cy="160" r="142" fill="none" stroke="#b48a3c" strokeWidth="1.5" />
          <circle cx="160" cy="160" r="110" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <g transform="translate(85, 120) scale(3.2)" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M4 6 Q 16 1, 26 6 T 48 6" />
            <path d="M4 14 Q 16 9, 26 14 T 48 14" />
            <path d="M4 22 Q 16 17, 26 22 T 48 22" />
            <path d="M4 30 Q 16 25, 26 30 T 48 30" />
          </g>
          <text x="160" y="222" textAnchor="middle" fontSize="13" fontWeight="900" letterSpacing="0.25em" fill="#0f2b5c">
            RAJENDRA SWIMSYS
          </text>
          <text x="160" y="238" textAnchor="middle" fontSize="7.5" fontWeight="800" letterSpacing="0.18em" fill="#b48a3c">
            OFFICIAL ATHLETE PASS
          </text>
        </svg>
      </div>

      {/* ── 2. BINGKAI DALAM & SUDUT EMAS ELEGAN ── */}
      <div className="absolute inset-1.5 rounded-xl border border-[#0f2b5c]/30 pointer-events-none z-10 print:border-[#0f2b5c]/40">
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#b48a3c]" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#b48a3c]" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#b48a3c]" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#b48a3c]" />
      </div>

      {/* Mockup Lubang Lanyard Badge */}
      <div className="flex justify-center pt-2.5 pb-1 print:pt-1.5 z-20 relative">
        <div className="h-2 w-16 rounded-full border-2 border-slate-300 bg-slate-100 shadow-inner" />
      </div>

      {/* ── 3. HEADER KARTU: LOGO RESMI, NAMA KEJUARAAN & VENUE ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2b5c] via-[#0284c7] to-[#0369a1] px-4 py-3 text-white z-20 mx-2 rounded-xl shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="Rajendra Swim System"
              className="h-8 w-auto object-contain bg-white/20 rounded-md p-1 backdrop-blur-xs shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1">
                <Waves className="h-3 w-3" /> RAJENDRA SWIMMING CHAMPIONSHIP
              </p>
              {/* NAMA EVENT */}
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate drop-shadow-xs">
                {event.name}
              </h2>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-white/20 border border-white/30 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-white backdrop-blur-xs">
            PASS
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-1.5 text-[10px] text-cyan-100">
          <span className="flex items-center gap-1 truncate font-medium">
            <Calendar className="h-3 w-3 shrink-0 text-cyan-300" />
            {event.startDate
              ? new Date(event.startDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Musim 2026'}
          </span>
          <span className="truncate font-semibold text-right pl-2 flex items-center gap-1 text-white">
            <MapPin className="h-3 w-3 shrink-0 text-cyan-300" />
            {event.location || 'Gelanggang Renang Resmi'}
          </span>
        </div>
      </div>

      {/* ── 4. GOLD BANNER: KARTU TANDA PESERTA ── */}
      <div className="mx-2 mt-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-3 py-1 flex items-center justify-between text-[9px] font-black tracking-widest text-slate-950 uppercase z-20 relative shadow-2xs">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-slate-900" /> KARTU TANDA PESERTA
        </span>
        <span className="font-mono tracking-wider font-extrabold text-[#0f2b5c]">
          CALL ROOM PASS
        </span>
      </div>

      {/* ── 5. PROFIL ATLET (NAMA, NOMOR ATLET, KLUB, KU) ── */}
      <div className="p-4 space-y-3.5 z-20 relative">
        <div className="flex items-start gap-3.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
          {/* Avatar / Foto Atlet */}
          <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-[#0f2b5c]/30 bg-white text-slate-400 shadow-2xs">
            <User className="h-10 w-10 text-slate-400" />
            <span
              className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[8px] font-black tracking-wider text-white uppercase ${
                athlete.gender === 'male' ? 'bg-blue-600' : 'bg-rose-600'
              }`}
            >
              {athlete.gender === 'male' ? 'PUTRA' : 'PUTRI'}
            </span>
          </div>

          {/* Info Identitas Atlet */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="inline-block rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 border border-slate-300 shadow-2xs">
                {athlete.athleteNumber}
              </span>
              <span className="rounded-md bg-blue-100 text-blue-900 px-2 py-0.5 text-[9px] font-black border border-blue-200">
                {formatKuDisplay(athlete.ageGroup)}
              </span>
            </div>

            {/* NAMA ATLET */}
            <h3 className="text-base font-black text-slate-950 uppercase tracking-tight leading-snug break-words font-heading">
              {athlete.fullName}
            </h3>

            <div className="space-y-0.5 text-[11px] text-slate-600">
              <p className="flex items-center gap-1.5 font-bold text-blue-950 truncate">
                <Building className="h-3.5 w-3.5 shrink-0 text-[#0284c7]" />
                {athlete.schoolName || 'Klub / Kontingen Mandiri'}
              </p>
              {athlete.birthDate && (
                <p className="text-[10px] text-slate-500 font-medium">
                  Tgl Lahir: {new Date(athlete.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 6. TABEL NOMOR PERLOMBAAN YANG DIIKUTI (HANYA NOMOR LOMBA & HEAT/LANE) ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] font-black text-slate-800 uppercase tracking-wide">
            <span className="flex items-center gap-1.5 text-blue-900">
              <Award className="h-3.5 w-3.5 text-[#0284c7]" /> NOMOR LOMBA DIIKUTI ({races.length})
            </span>
            <span className="text-[9px] text-slate-500 font-mono font-bold">ALOKASI SERI / HEAT</span>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5 print:max-h-none print:overflow-visible">
            {races.map((race, idx) => (
              <div
                key={race.registrationId || idx}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/80 p-2 text-[11px] border border-slate-200 hover:bg-slate-100/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f2b5c] text-[10px] font-black text-white font-mono shadow-2xs">
                      {idx + 1}
                    </span>
                    {/* NAMA NOMOR LOMBA */}
                    <p className="font-bold text-slate-950 leading-tight truncate">
                      {race.eventName}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {race.heatNumber && race.laneNumber ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 font-mono font-black text-[10px] border border-blue-200">
                      Seri {race.heatNumber} • Lnt {race.laneNumber}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[9px]">
                      Menunggu Seeding
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* ── PETUNJUK WAKTU DUDUK / LAPOR CALL ROOM (CoC RUNDOWN) ── */}
            <div className="rounded-lg bg-amber-50 p-2 border border-amber-200/90 text-[9.5px] text-amber-950 flex items-center justify-between font-mono shadow-2xs mt-2">
              <span className="font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-700 shrink-0" /> LAPOR / DUDUK CALL ROOM (CoC):
              </span>
              <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-[9px]">
                15 MENIT SEBELUM SERI
              </span>
            </div>
          </div>
        </div>

        {/* ── 7. FOOTER: QR CODE CALL ROOM & ELEMEN SANCTION RESMI ── */}
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-300 pt-2.5">
          {/* QR Code */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-slate-300 bg-white p-1 shadow-2xs">
              <QrCodeSvg value={verificationPayload} size={48} />
            </div>
            <div className="text-[9px] text-slate-500 space-y-0.5">
              <p className="font-mono font-black text-slate-900 uppercase tracking-tight">SCAN CALL ROOM</p>
              <p className="text-slate-600 font-medium">Validasi Petugas & Juri</p>
              <p className="text-[8px] text-slate-400 font-mono">Rajendra Swim System Official Pass</p>
            </div>
          </div>

          {/* Stempel Elemen Sanction Rajendra SwimSystem */}
          <div className="text-right space-y-0.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider uppercase bg-blue-50 text-blue-950 border border-blue-300 shadow-2xs">
              <ShieldCheck className="h-3 w-3 text-blue-600" /> RAJENDRA SANCTIONED
            </div>
            <p className="text-[8px] font-mono font-bold text-slate-400">
              OFFICIAL COMPETITION PASS
            </p>
          </div>
        </div>
      </div>

      {/* Security Microtext Strip di Bawah */}
      <div className="bg-slate-900 py-1 px-3 text-center text-[7.5px] font-mono font-bold tracking-widest text-slate-400 uppercase border-t border-slate-800">
        ★ RAJENDRA SWIM SYSTEM • OFFICIAL COMPETITION ID PASS ★
      </div>
    </div>
  );
}
