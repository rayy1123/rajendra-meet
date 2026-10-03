'use client';

import React from 'react';
import { QrCodeSvg } from './qr-code-svg';
import { Award, Trophy, Star, Sparkles, ShieldCheck } from 'lucide-react';
import type { CertificateRecipient, CertificateSettings } from './certificate-manager';
import type { SponsorItem } from '@/lib/data/sponsors';
import { formatCompEventLabel } from '@/lib/utils';

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
    ? 'JUARA 1'
    : isSilver
    ? 'JUARA 2'
    : isBronze
    ? 'JUARA 3'
    : `PERINGKAT ${recipient.rank}`;

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

  return (
    <div
      className={`certificate-sheet relative mx-auto bg-white text-slate-900 ${
        isPrintOnly ? 'print:block' : 'print:break-after-page print:break-inside-avoid'
      }`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: isPrintOnly ? '297mm' : '980px',
        height: isPrintOnly ? '210mm' : 'auto',
        minHeight: isPrintOnly ? '210mm' : '650px',
        maxHeight: isPrintOnly ? '210mm' : 'none',
        padding: '24px 36px 20px 36px',
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

      {/* ── 1. CORNER RIBBONS (NAVY & GOLD WAVES MATCHING EXACT ABRISAM PDF) ── */}
      {settings.showCornerRibbons !== false && (
        <>
          {/* Top-Right Smooth Curved Ribbon */}
          <div className="absolute top-0 right-0 w-64 sm:w-80 h-40 sm:h-48 pointer-events-none z-0">
            <svg viewBox="0 0 320 190" fill="none" className="w-full h-full">
              {/* Deep Navy Sweep */}
              <path d="M 320 0 L 130 0 C 175 35 230 85 320 160 Z" fill="#0f2b5c" />
              {/* Gold Ribbon Accent */}
              <path d="M 320 0 L 175 0 C 215 35 260 80 320 135 Z" fill="#c59b27" />
              {/* Dark Accent Edge */}
              <path d="M 320 0 L 220 0 C 250 25 285 55 320 100 Z" fill="#061426" />
            </svg>
          </div>

          {/* Bottom-Left Smooth Curved Ribbon */}
          <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-40 sm:h-48 pointer-events-none z-0">
            <svg viewBox="0 0 320 190" fill="none" className="w-full h-full">
              {/* Deep Navy Sweep */}
              <path d="M 0 190 L 190 190 C 145 155 90 105 0 30 Z" fill="#0f2b5c" />
              {/* Gold Ribbon Accent */}
              <path d="M 0 190 L 145 190 C 105 155 60 110 0 55 Z" fill="#c59b27" />
              {/* Dark Accent Edge */}
              <path d="M 0 190 L 100 190 C 70 165 35 135 0 90 Z" fill="#061426" />
            </svg>
          </div>

          {/* Red Flag Accent Strip on Right Edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-20 bg-[#c53030] pointer-events-none z-10" />
        </>
      )}

      {/* ── 2. INNER DIPLOMA FRAMING BORDER (CLEAN RECTANGLE INSIDE MARGINS) ── */}
      <div className="absolute inset-4 sm:inset-5 border-[1.5px] border-slate-300 rounded-lg pointer-events-none z-10" />

      {/* ── 3. TOP 3D GOLDEN MEDALLION RIBBON BADGE (CENTER HORIZONTAL, EXACT PDF POSITION) ── */}
      {settings.showRibbonSeal !== false && (
        <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 pointer-events-none z-20">
          <svg viewBox="0 0 90 110" className="h-18 sm:h-22 w-auto drop-shadow-md">
            {/* Hanging Gold Ribbons */}
            <path d="M 32 48 L 22 100 L 36 88 L 45 100 L 40 48 Z" fill="#b38728" />
            <path d="M 58 48 L 68 100 L 54 88 L 45 100 L 50 48 Z" fill="#d4af37" />
            {/* Medallion Outer Scallop */}
            <circle cx="45" cy="42" r="32" fill="url(#goldMedallionGrad)" stroke="#8a671c" strokeWidth="1.5" />
            <circle cx="45" cy="42" r="27" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle cx="45" cy="42" r="22" fill="#c59b27" opacity="0.3" />
            {/* 5-Point Star */}
            <polygon points="45,26 50,35 60,36 52,43 55,53 45,47 35,53 38,43 30,36 40,35" fill="#8a671c" opacity="0.9" />
            <defs>
              <radialGradient id="goldMedallionGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fff8e1" />
                <stop offset="35%" stopColor="#f7d983" />
                <stop offset="70%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#99731e" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* ── 4. HEADER SECTION: 3 LOGOS AT TOP-LEFT ── */}
      <div className="relative z-20">
        <div className="flex items-start justify-between px-2 pt-1">
          {/* 3 Logos in a Row */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo 1: Organisasi / RSS */}
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.leftLogoUrl || '/brand/logo.png'}
                alt={settings.leftLogoTitle || 'Logo 1'}
                className="h-11 sm:h-12 w-auto object-contain shrink-0 drop-shadow-2xs"
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
                  className="h-11 sm:h-12 w-auto object-contain shrink-0 drop-shadow-2xs"
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

            {/* Logo 3: Akuatik Indonesia */}
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.rightLogoUrl || '/brand/rajendra-organizer-logo.png'}
                alt={settings.rightLogoTitle || 'Logo 3'}
                className="h-11 sm:h-12 w-auto object-contain shrink-0 drop-shadow-2xs"
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

          {/* Spacer on right so header balances */}
          <div className="w-16" />
        </div>

        {/* ── 5. TITLE: PIAGAM PENGHARGAAN & NOMOR RESMI ── */}
        <div className="pt-2 sm:pt-3 text-center space-y-1">
          <h1
            className="text-3xl sm:text-[40px] font-black uppercase tracking-[0.16em] leading-none"
            style={{
              color: '#8a671c',
              textShadow: '0 1px 1px rgba(0,0,0,0.06)',
              fontFamily: "'Cinzel', 'Times New Roman', Times, serif",
            }}
          >
            {settings.headerTitle || 'PIAGAM PENGHARGAAN'}
          </h1>

          <p className="text-xs sm:text-[13px] font-medium text-slate-700 tracking-wide font-sans">
            {certNumber}
          </p>

          <p className="text-xs sm:text-[13.5px] font-bold uppercase tracking-[0.22em] text-slate-800 pt-1">
            {settings.presentedText || 'DIBERIKAN KEPADA'}
          </p>
        </div>
      </div>

      {/* ── 6. ATHLETE RECIPIENT NAME (HERO TYPOGRAPHY WITH UNDERLINE) ── */}
      <div className="relative z-20 text-center my-1.5">
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
          {/* Subtle Underline Line */}
          <div className="h-[2px] w-full bg-slate-400 mt-1" />
        </div>

        <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.2em] text-slate-700 mt-2">
          {settings.achievementText || 'SEBAGAI'}
        </p>
      </div>

      {/* ── 7. ACHIEVEMENT / JUARA & EVENT DETAILS ── */}
      <div className="relative z-20 text-center space-y-1 max-w-3xl mx-auto px-4">
        {/* Main Achievement Header (Royal Blue Bold) */}
        <h3
          className="text-lg sm:text-[22px] font-black uppercase tracking-wider leading-snug"
          style={{ color: '#034694' }}
        >
          {medalLabel} {formattedEventTitle}
        </h3>

        {/* Event Context & Date Range */}
        <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
          <p>
            Pada Kejuaraan <b>{recipient.eventName}</b> yang diselenggarakan pada
          </p>
          <p className="font-semibold text-slate-800">
            {settings.eventDateRangeText || `${recipient.eventLocation} • ${settings.issuedDate || '2026'}`}
          </p>
        </div>

        {/* Optional Time Pill */}
        {recipient.formattedTime && recipient.formattedTime !== 'NT' && (
          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.2 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold text-slate-900 shadow-2xs">
              <span className="text-slate-500 font-semibold text-[10px]">Waktu Resmi:</span>
              <b className="font-mono font-black">{recipient.formattedTime} detik</b>
              {recipient.isNewRecord && (
                <span className="ml-1 text-[8.5px] font-black text-rose-700 bg-rose-100 px-1 py-0.2 rounded uppercase">
                  ★ Rekor Baru
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── 8. DATE & 3 OFFICIAL SIGNATURES WITH AUTHENTIC STAMPS (EXACT PDF ALIGNMENT) ── */}
      <div className="relative z-20 pt-2 border-t border-slate-200">
        {/* Date line */}
        <div className="text-center mb-1">
          <p className="text-xs sm:text-[13px] font-semibold text-slate-800">
            {settings.issuedCity || 'Jakarta'}, {settings.issuedDate || '26 Juli 2026'}
          </p>
        </div>

        {/* 3 Signatures in a Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end text-center text-xs px-2">
          {/* 1. SIGNER KIRI (Mengetahui / Kadispora) */}
          <div className="space-y-0.5 flex flex-col items-center">
            <p className="text-[10px] text-slate-600 font-semibold">
              {settings.firstSignerRole || 'Mengetahui,'}
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
              {/* Official Stamp Seal with clean upright circular text */}
              <div className="absolute left-2 top-0 h-16 w-16 pointer-events-none opacity-80">
                <svg viewBox="0 0 100 100" className="h-full w-full text-indigo-700">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 1.5" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <text x="50" y="24" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="currentColor">
                    PEMERINTAH PROVINSI
                  </text>
                  <text x="50" y="53" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="currentColor">
                    DISPORA
                  </text>
                  <text x="50" y="80" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="currentColor">
                    DKI JAKARTA
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
              <div className="absolute left-3 top-0 h-16 w-16 pointer-events-none opacity-80">
                <svg viewBox="0 0 100 100" className="h-full w-full text-blue-800">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <text x="50" y="24" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="currentColor">
                    KOMITE OLAHRAGA
                  </text>
                  <text x="50" y="53" textAnchor="middle" fontSize="8" fontWeight="900" fill="currentColor">
                    KONI
                  </text>
                  <text x="50" y="80" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="currentColor">
                    JAKARTA PUSAT
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
              <div className="absolute left-2 top-0 h-16 w-16 pointer-events-none opacity-80">
                <svg viewBox="0 0 100 100" className="h-full w-full text-blue-900">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <text x="50" y="24" textAnchor="middle" fontSize="6" fontWeight="900" fill="currentColor">
                    PENGURUS KOTA
                  </text>
                  <text x="50" y="53" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="currentColor">
                    AKUATIK
                  </text>
                  <text x="50" y="80" textAnchor="middle" fontSize="6" fontWeight="900" fill="currentColor">
                    INDONESIA
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

      {/* ── 9. CORNER QR CODE VERIFICATION BADGE (INSIDE FRAME MARGIN, NO OVERFLOW) ── */}
      <div className="absolute bottom-5 right-6 flex items-center gap-1.5 pointer-events-none z-20">
        <div className="bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
          <QrCodeSvg value={verificationPayload} size={26} />
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <span className="text-[6px] font-mono font-black text-slate-700 uppercase block">
            VERIFIED RECORD
          </span>
          <span className="text-[5.5px] font-mono text-emerald-700 font-bold block">
            SWIMSYS SANCTION
          </span>
        </div>
      </div>
    </div>
  );
}
