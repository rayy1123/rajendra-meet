'use client';

import React from 'react';
import { QrCodeSvg } from './qr-code-svg';
import { Award, Trophy, Star, Sparkles, ShieldCheck } from 'lucide-react';
import type { CertificateRecipient, CertificateSettings } from './certificate-manager';
import type { SponsorItem } from '@/lib/data/sponsors';
import { SponsorLogosStrip } from './sponsor-logos-strip';
import { formatCompEventLabel } from '@/lib/utils';

export const RECORD_BADGES: Record<string, { label: string; cls: string }> = {
  pribadi: { label: 'REKOR PRIBADI (PB)', cls: 'bg-cyan-700 text-white border-cyan-400 shadow-2xs' },
  games: { label: 'REKOR GAMES (KEJUARAAN)', cls: 'bg-rose-700 text-white border-rose-400 shadow-2xs' },
  daerah: { label: 'REKOR DAERAH (REGIONAL)', cls: 'bg-purple-700 text-white border-purple-400 shadow-2xs' },
  nasional: { label: 'REKOR NASIONAL (NATIONAL)', cls: 'bg-amber-600 text-white border-amber-300 shadow-2xs' },
};

export function CertificateCard({
  recipient,
  settings,
  sponsors = [],
  isPrintOnly = false,
}: {
  recipient: CertificateRecipient;
  settings: CertificateSettings;
  sponsors?: SponsorItem[];
  isPrintOnly?: boolean;
}) {
  const isMedalist = recipient.rank <= 3;
  const isGold = recipient.rank === 1;
  const isSilver = recipient.rank === 2;
  const isBronze = recipient.rank === 3;

  const medalLabel = isGold
    ? 'JUARA 1 (MEDALI EMAS)'
    : isSilver
    ? 'JUARA 2 (MEDALI PERAK)'
    : isBronze
    ? 'JUARA 3 (MEDALI PERUNGGU)'
    : `PERINGKAT KE-${recipient.rank}`;

  const certNumber = settings.skNumber?.includes('/')
    ? settings.skNumber
    : `No. ${settings.skNumber || '0545/Koni-JakartaPusat/PORKOT/26/VII/2026'}`;

  const verificationPayload = typeof window !== 'undefined'
    ? `${window.location.origin}/verifikasi/${recipient.id}`
    : `https://scms-app-umber.vercel.app/verifikasi/${recipient.id}`;

  const formattedEventTitle = formatCompEventLabel(
    {
      name: recipient.competitionEventName,
      order_no: recipient.orderNo,
      gender: recipient.gender,
      stroke: recipient.stroke,
      distance_meters: recipient.distanceMeters,
      age_group: recipient.ageGroup,
    },
    false
  );

  const isAbrisamStyle = settings.templateLayout !== 'royal_gold';

  return (
    <div
      className={`certificate-sheet relative mx-auto bg-white text-slate-900 rounded-2xl print:rounded-none print:shadow-none print:m-0 print:border-0 ${
        isPrintOnly ? 'print:block' : 'print:break-after-page print:break-inside-avoid'
      }`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: isPrintOnly ? '297mm' : '980px',
        height: isPrintOnly ? '210mm' : 'auto',
        minHeight: isPrintOnly ? '210mm' : '650px',
        maxHeight: isPrintOnly ? '210mm' : 'none',
        padding: '24px 38px 20px 38px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        pageBreakAfter: 'always',
        breakAfter: 'page',
        background: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── 0. CUSTOM BACKGROUND IMAGE ── */}
      {settings.customBackgroundImage && (
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          style={{ opacity: (settings.backgroundOpacity ?? 100) / 100 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.customBackgroundImage}
            alt="Custom Background"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* ── 1. DYNAMIC NAVY & GOLD CORNER SWASHES (STYLE EXACT ABRISAM PDF) ── */}
      {settings.showCornerRibbons !== false && (
        <>
          {/* Top-Right Navy & Gold Ribbon Sweep */}
          <div className="absolute top-0 right-0 w-56 sm:w-72 h-36 sm:h-44 pointer-events-none z-10">
            <svg viewBox="0 0 280 170" fill="none" className="w-full h-full">
              {/* Outer Deep Navy */}
              <path d="M 280 0 L 100 0 C 140 25 190 70 280 150 Z" fill="#0f2b5c" />
              {/* Mid Gold Foil */}
              <path d="M 280 0 L 140 0 C 175 25 215 65 280 125 Z" fill="#c59b27" opacity="0.95" />
              {/* Inner Royal Navy */}
              <path d="M 280 0 L 180 0 C 205 20 235 50 280 95 Z" fill="#061426" />
            </svg>
          </div>

          {/* Bottom-Left Navy & Gold Ribbon Sweep */}
          <div className="absolute bottom-0 left-0 w-56 sm:w-72 h-36 sm:h-44 pointer-events-none z-10">
            <svg viewBox="0 0 280 170" fill="none" className="w-full h-full">
              {/* Outer Deep Navy */}
              <path d="M 0 170 L 180 170 C 140 145 90 100 0 20 Z" fill="#0f2b5c" />
              {/* Mid Gold Foil */}
              <path d="M 0 170 L 140 170 C 105 145 65 105 0 45 Z" fill="#c59b27" opacity="0.95" />
              {/* Inner Royal Navy */}
              <path d="M 0 170 L 100 170 C 75 150 45 120 0 75 Z" fill="#061426" />
            </svg>
          </div>

          {/* Red Flag Strip Accent on Right Border (Exact Abrisam PDF) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-20 bg-[#c53030] pointer-events-none z-10" />
        </>
      )}

      {/* ── 2. OUTER ELEGANT DIPLOMA FRAMING BORDER ── */}
      <div className="absolute inset-2 sm:inset-3 border border-slate-300 rounded-xl pointer-events-none z-10" />

      {/* ── 3. HEADER SECTION: 3 LOGOS + TOP CENTER GOLD MEDALLION RIBBON ── */}
      <div className="relative z-20">
        <div className="flex items-start justify-between px-2 pt-1">
          {/* 3 Logos in a Row (Left) */}
          <div className="flex items-center gap-3.5 sm:gap-5">
            {/* Logo 1: Organisasi / RSS */}
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.leftLogoUrl || '/brand/logo.png'}
                alt={settings.leftLogoTitle || 'Logo 1'}
                className="h-11 sm:h-13 w-auto object-contain shrink-0 drop-shadow-2xs"
              />
              <span className="text-[7.5px] font-black tracking-tight text-[#0f2b5c] uppercase mt-0.5">
                {settings.leftLogoTitle || 'RAJENDRA'}
              </span>
            </div>

            {/* Logo 2: Dispora / Sponsor Utama */}
            <div className="flex flex-col items-center">
              {settings.mainSponsorLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.mainSponsorLogoUrl}
                  alt={settings.mainSponsorTitle || 'Logo 2'}
                  className="h-11 sm:h-13 w-auto object-contain shrink-0 drop-shadow-2xs"
                />
              ) : (
                <div className="h-11 w-11 rounded-full border-2 border-rose-600 bg-rose-50 flex items-center justify-center text-rose-700 font-black text-[9px] shadow-2xs">
                  DISPORA
                </div>
              )}
              <span className="text-[7.5px] font-black tracking-tight text-slate-600 uppercase mt-0.5">
                {settings.mainSponsorTitle || 'DISPORA'}
              </span>
            </div>

            {/* Logo 3: Akuatik Indonesia / Organizer */}
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.rightLogoUrl || '/brand/rajendra-organizer-logo.png'}
                alt={settings.rightLogoTitle || 'Logo 3'}
                className="h-11 sm:h-13 w-auto object-contain shrink-0 drop-shadow-2xs"
              />
              <div className="text-center leading-none mt-0.5">
                <span className="text-[7px] font-black text-[#0f2b5c] block uppercase">
                  AKUATIK INDONESIA
                </span>
                <span className="text-[6px] font-semibold text-slate-500 block">
                  {settings.issuedCity || 'Jakarta Pusat'}
                </span>
              </div>
            </div>
          </div>

          {/* Top Center-Right: 3D Golden Medallion Ribbon (Exact Abrisam Style) */}
          {settings.showRibbonSeal !== false && (
            <div className="pr-12 sm:pr-16">
              <div className="relative flex flex-col items-center">
                <svg viewBox="0 0 80 95" className="h-16 sm:h-20 w-auto drop-shadow-md">
                  {/* Hanging Gold Ribbons */}
                  <path d="M 28 42 L 20 88 L 32 78 L 40 88 L 36 42 Z" fill="#b38728" />
                  <path d="M 52 42 L 60 88 L 48 78 L 40 88 L 44 42 Z" fill="#d4af37" />
                  {/* Outer Scalloped / Starburst Gold Seal */}
                  <circle cx="40" cy="38" r="28" fill="url(#gold3DGrad)" stroke="#8a671c" strokeWidth="1.2" />
                  <circle cx="40" cy="38" r="23" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" />
                  <circle cx="40" cy="38" r="19" fill="#c59b27" opacity="0.35" />
                  {/* Star Emblem */}
                  <polygon points="40,24 44,32 53,33 46,39 48,48 40,43 32,48 34,39 27,33 36,32" fill="#8a671c" opacity="0.85" />
                  <defs>
                    <radialGradient id="gold3DGrad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#fff6d6" />
                      <stop offset="40%" stopColor="#f5d77f" />
                      <stop offset="70%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#99731e" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. TITLE: PIAGAM PENGHARGAAN & NOMOR RESMI ── */}
        <div className="pt-2 text-center space-y-1">
          <h1
            className="text-3xl sm:text-[38px] font-black uppercase tracking-[0.16em] leading-none"
            style={{
              color: '#8a671c',
              textShadow: '0 1px 1px rgba(0,0,0,0.05)',
              fontFamily: "'Cinzel', 'Times New Roman', Times, serif",
            }}
          >
            {settings.headerTitle || 'PIAGAM PENGHARGAAN'}
          </h1>

          <p className="text-xs sm:text-[13px] font-medium text-slate-700 tracking-wide font-sans">
            {certNumber}
          </p>

          <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.22em] text-slate-800 pt-1">
            {settings.presentedText || 'DIBERIKAN KEPADA'}
          </p>
        </div>
      </div>

      {/* ── 5. ATHLETE RECIPIENT NAME (GRAND UNDERLINED HERO TYPOGRAPHY) ── */}
      <div className="relative z-20 text-center my-1">
        <div className="inline-block relative">
          <h2
            className="text-3xl sm:text-[38px] font-black tracking-wide text-slate-900 uppercase leading-tight px-6"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: '0.04em',
            }}
          >
            {recipient.swimmerName}
          </h2>
          {/* Subtle Underline Line (Exact Abrisam Style) */}
          <div className="h-[2px] w-full bg-slate-400 mt-1" />
        </div>

        <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.2em] text-slate-700 mt-2">
          {settings.achievementText || 'SEBAGAI'}
        </p>
      </div>

      {/* ── 6. ACHIEVEMENT / JUARA & EVENT DETAILS ── */}
      <div className="relative z-20 text-center space-y-1.5 max-w-3xl mx-auto px-4">
        {/* Main Achievement Header (Royal Blue Bold) */}
        <h3
          className="text-lg sm:text-[21px] font-black uppercase tracking-wider leading-snug"
          style={{ color: '#034694' }}
        >
          {medalLabel} {formattedEventTitle}
        </h3>

        {/* Event Context & Date Range Description */}
        <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
          <p>
            Pada Kejuaraan <b>{recipient.eventName}</b> yang diselenggarakan pada
          </p>
          <p className="font-semibold text-slate-800">
            {settings.eventDateRangeText || `${recipient.eventLocation} • ${settings.issuedDate || '2026'}`}
          </p>
        </div>

        {/* Time Pill Badge */}
        {recipient.formattedTime && recipient.formattedTime !== 'NT' && (
          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold text-slate-900 shadow-2xs">
              <span className="text-slate-500 font-semibold text-[10.5px]">Waktu Resmi:</span>
              <b className="font-mono font-black">{recipient.formattedTime} detik</b>
              {recipient.isNewRecord && (
                <span className="ml-1 text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded uppercase">
                  ★ Rekor Baru
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── 7. DATE & 3 OFFICIAL SIGNATURES WITH AUTHENTIC SEALS (EXACT ABRISAM STYLE) ── */}
      <div className="relative z-20 pt-2 border-t border-slate-200">
        {/* Date line (Top Center of Signatures) */}
        <div className="text-center mb-1">
          <p className="text-xs sm:text-[13px] font-semibold text-slate-800">
            {settings.issuedCity || 'Jakarta'}, {settings.issuedDate || '26 Juli 2026'}
          </p>
        </div>

        {/* 3 Signatures Columns in a Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end text-center text-xs">
          {/* 1. SIGNER KIRI (Mengetahui / Kadispora) */}
          <div className="space-y-0.5 flex flex-col items-center">
            <p className="text-[10px] text-slate-600 font-semibold">
              {settings.firstSignerRole || 'Mengetahui'}
            </p>
            <p className="text-[10.5px] font-bold text-slate-800 leading-tight max-w-[200px]">
              {settings.firstSignerTitle || 'Kepala Suku Dinas Pemuda dan Olahraga'}
            </p>
            {settings.firstSignerOrg && (
              <p className="text-[9.5px] text-slate-500 font-medium leading-none">
                {settings.firstSignerOrg}
              </p>
            )}

            {/* Signature & Stamp Area */}
            <div className="relative h-16 w-36 flex items-center justify-center my-0.5">
              {/* Official Stamp Seal (Purple/Blue Circular Cap) */}
              <div className="absolute left-2 top-0 h-16 w-16 pointer-events-none opacity-85">
                <svg viewBox="0 0 100 100" className="h-full w-full text-indigo-700">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 1.5" />
                  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <path id={`stamp-left-${recipient.id}`} d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
                  <text fontSize="7.5" fontWeight="900" fill="currentColor" letterSpacing="0.1em">
                    <textPath href={`#stamp-left-${recipient.id}`} startOffset="50%" textAnchor="middle">
                      PEMERINTAH PROVINSI DKI
                    </textPath>
                  </text>
                  <text x="50" y="53" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="currentColor">
                    DISPORA
                  </text>
                </svg>
              </div>

              {/* Digital Cursive Signature Stroke */}
              <div className="absolute left-4 top-2 h-14 w-32 pointer-events-none z-10">
                <svg viewBox="0 0 140 50" className="h-full w-full text-slate-950 stroke-current fill-none">
                  <path d="M 15 35 Q 30 10 45 30 T 70 25 Q 95 10 120 38" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M 30 28 L 125 26" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <p className="font-bold text-slate-950 text-xs sm:text-[13px] leading-tight mt-0.5">
              {settings.firstSignerName || settings.technicalDelegate || 'Rusdiyanto'}
            </p>
          </div>

          {/* 2. SIGNER TENGAH (Ketua KONI / Ketua Panitia) */}
          <div className="space-y-0.5 flex flex-col items-center">
            <p className="text-[10.5px] font-bold text-slate-800 leading-tight">
              {settings.secondSignerRole || 'Ketua KONI'}
            </p>
            <p className="text-[10px] text-slate-600 font-semibold leading-tight max-w-[200px]">
              {settings.secondSignerTitle || 'Kota Administrasi Jakarta Pusat'}
            </p>
            {settings.secondSignerOrg && (
              <p className="text-[9.5px] text-slate-500 font-medium leading-none">
                {settings.secondSignerOrg}
              </p>
            )}

            {/* Signature & Stamp Center Area */}
            <div className="relative h-16 w-36 flex items-center justify-center my-0.5">
              {/* Official Stamp KONI */}
              <div className="absolute left-3 top-0 h-16 w-16 pointer-events-none opacity-85">
                <svg viewBox="0 0 100 100" className="h-full w-full text-blue-800">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <path id={`stamp-mid-${recipient.id}`} d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
                  <text fontSize="7.5" fontWeight="900" fill="currentColor" letterSpacing="0.1em">
                    <textPath href={`#stamp-mid-${recipient.id}`} startOffset="50%" textAnchor="middle">
                      KOMITE OLAHRAGA NASIONAL
                    </textPath>
                  </text>
                  <text x="50" y="53" textAnchor="middle" fontSize="8" fontWeight="900" fill="currentColor">
                    KONI
                  </text>
                </svg>
              </div>

              {/* Digital Cursive Signature Stroke */}
              <div className="absolute left-2 top-2 h-14 w-32 pointer-events-none z-10">
                <svg viewBox="0 0 140 50" className="h-full w-full text-slate-950 stroke-current fill-none">
                  <path d="M 10 40 Q 35 8 55 35 T 85 20 Q 110 15 130 35" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M 35 30 Q 65 42 120 25" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <p className="font-bold text-slate-950 text-xs sm:text-[13px] leading-tight mt-0.5">
              {settings.secondSignerName || settings.organizerChairman || 'Zaenar Arifin, SE'}
            </p>
          </div>

          {/* 3. SIGNER KANAN (Ketua Akuatik / Pengcab) */}
          <div className="space-y-0.5 flex flex-col items-center">
            <p className="text-[10.5px] font-bold text-slate-800 leading-tight">
              {settings.thirdSignerRole || 'Ketua Akuatik'}
            </p>
            <p className="text-[10px] text-slate-600 font-semibold leading-tight max-w-[200px]">
              {settings.thirdSignerTitle || 'Kota Administrasi Jakarta Pusat'}
            </p>
            {settings.thirdSignerOrg && (
              <p className="text-[9.5px] text-slate-500 font-medium leading-none">
                {settings.thirdSignerOrg}
              </p>
            )}

            {/* Signature & Stamp Right Area */}
            <div className="relative h-16 w-36 flex items-center justify-center my-0.5">
              {/* Official Stamp Akuatik */}
              <div className="absolute left-2 top-0 h-16 w-16 pointer-events-none opacity-85">
                <svg viewBox="0 0 100 100" className="h-full w-full text-blue-900">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <path id={`stamp-right-${recipient.id}`} d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
                  <text fontSize="7" fontWeight="900" fill="currentColor" letterSpacing="0.1em">
                    <textPath href={`#stamp-right-${recipient.id}`} startOffset="50%" textAnchor="middle">
                      PENGURUS KOTA AKUATIK
                    </textPath>
                  </text>
                  <text x="50" y="53" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="currentColor">
                    PENGKOT
                  </text>
                </svg>
              </div>

              {/* Digital Signature Stroke */}
              <div className="absolute left-4 top-2 h-14 w-32 pointer-events-none z-10">
                <svg viewBox="0 0 140 50" className="h-full w-full text-slate-950 stroke-current fill-none">
                  <path d="M 20 40 Q 40 10 65 30 T 95 18 Q 120 12 135 32" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 45 28 L 125 24" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <p className="font-bold text-slate-950 text-xs sm:text-[13px] leading-tight mt-0.5">
              {settings.thirdSignerName || 'Yonas Bain, M.Pd.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 8. CORNER QR CODE VERIFICATION & SANCTION BADGE ── */}
      <div className="absolute bottom-2.5 right-3.5 flex items-center gap-1.5 pointer-events-none z-20">
        <div className="bg-white/95 p-0.5 rounded-lg border border-slate-300 shadow-2xs">
          <QrCodeSvg value={verificationPayload} size={28} />
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <span className="text-[6.5px] font-mono font-black text-slate-700 uppercase block">
            VERIFIED RECORD
          </span>
          <span className="text-[6px] font-mono text-emerald-700 font-bold block">
            SWIMSYS SANCTION
          </span>
        </div>
      </div>
    </div>
  );
}
