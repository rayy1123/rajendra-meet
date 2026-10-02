'use client';

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
    ? 'JUARA I (MEDALI EMAS)'
    : isSilver
    ? 'JUARA II (MEDALI PERAK)'
    : isBronze
    ? 'JUARA III (MEDALI PERUNGGU)'
    : `PERINGKAT KE-${recipient.rank}`;

  const certNumber = `${settings.skNumber || 'RM/CERT'}/${recipient.orderNo ? String(recipient.orderNo).padStart(2, '0') : '01'}/${String(recipient.rank).padStart(2, '0')}`;
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

  // Background Theme Palette
  const bgThemeClass = (() => {
    switch (settings.backgroundTheme) {
      case 'classic_gold':
        return 'bg-gradient-to-br from-[#ffffff] via-[#fffdf9] to-[#fef8ea] text-slate-900';
      case 'oceanic_blue':
        return 'bg-gradient-to-br from-[#ffffff] via-[#f7fbff] to-[#ebf5fc] text-slate-900';
      case 'pure_white':
        return 'bg-white text-slate-900';
      default:
        return 'bg-gradient-to-br from-[#ffffff] via-[#fdfdfc] to-[#f8f9fb] text-slate-900';
    }
  })();

  const borderTheme = settings.borderStyle || 'gold_classic';

  return (
    <div
      className={`certificate-sheet relative mx-auto ${bgThemeClass} text-slate-900 rounded-2xl print:rounded-none print:shadow-none print:m-0 print:border-0 ${
        isPrintOnly ? 'print:block' : 'print:break-after-page print:break-inside-avoid'
      }`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: isPrintOnly ? '297mm' : '960px',
        height: isPrintOnly ? '210mm' : 'auto',
        minHeight: isPrintOnly ? '210mm' : '580px',
        maxHeight: isPrintOnly ? '210mm' : 'none',
        padding: '18px 28px 14px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* ── 0. CUSTOM BACKGROUND IMAGE (DAPAT DIATUR ADMIN) ── */}
      {settings.customBackgroundImage && (
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          style={{ opacity: (settings.backgroundOpacity ?? 100) / 100 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.customBackgroundImage}
            alt="Custom Certificate Background"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* ── 1. VECTOR GUILLOCHE WATERMARK ── */}
      {settings.showWatermark !== false && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] print:opacity-[0.05] z-0">
          <svg viewBox="0 0 500 500" className="h-[380px] w-[380px] text-[#0a192f]">
            <circle cx="250" cy="250" r="235" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="8 4" />
            <circle cx="250" cy="250" r="226" fill="none" stroke="#c59b27" strokeWidth="2" />
            <circle cx="250" cy="250" r="180" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="250" cy="250" r="172" fill="none" stroke="#c59b27" strokeWidth="1.2" strokeDasharray="6 3" />
            <path id={`circleTextPath-${recipient.id}`} d="M 250, 250 m -195, 0 a 195,195 0 1,1 390,0 a 195,195 0 1,1 -390,0" fill="none" />
            <text fontSize="12" fontWeight="900" letterSpacing="0.28em" fill="#0a192f">
              <textPath href={`#circleTextPath-${recipient.id}`} startOffset="50%" textAnchor="middle">
                ★ RAJENDRA SWIM SYSTEM • OFFICIAL CHAMPIONSHIP SANCTIONED ★
              </textPath>
            </text>
            <g transform="translate(135, 175) scale(4.5)" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round">
              <path d="M4 6 Q 16 1, 26 6 T 48 6" />
              <path d="M4 14 Q 16 9, 26 14 T 48 14" />
              <path d="M4 22 Q 16 17, 26 22 T 48 22" />
              <path d="M4 30 Q 16 25, 26 30 T 48 30" />
            </g>
          </svg>
        </div>
      )}

      {/* ── 2. BINGKAI MASTER VEKTOR EMAS (FIGMA & CANVA STANDARD) ── */}
      {borderTheme !== 'none' && (
        <div className="absolute inset-1.5 sm:inset-2.5 pointer-events-none z-10">
          <div
            className={`h-full w-full rounded-xl border-[2.5px] p-1 ${
              borderTheme === 'navy_aquatic'
                ? 'border-[#0284c7]'
                : borderTheme === 'silver_modern'
                ? 'border-[#94a3b8]'
                : 'border-[#c59b27]'
            }`}
          >
            <div
              className={`h-full w-full rounded-lg border-[1px] ${
                borderTheme === 'navy_aquatic'
                  ? 'border-[#0a192f]'
                  : borderTheme === 'silver_modern'
                  ? 'border-[#475569]'
                  : 'border-[#0a192f]'
              }`}
            />
          </div>
          {/* Corner Flourishes */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-[3px] border-l-[3px] border-[#c59b27] pointer-events-none" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-[3px] border-r-[3px] border-[#c59b27] pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-[3px] border-l-[3px] border-[#c59b27] pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-[3px] border-r-[3px] border-[#c59b27] pointer-events-none" />
        </div>
      )}

      {/* ── 3. HEADER 3 LOGO SIMETRIS (KIRI • TENGAH • KANAN) ── */}
      <div className="relative z-20">
        <div className="grid grid-cols-12 items-center px-2 pb-1.5 border-b border-amber-300/60 gap-1.5">
          {/* Logo Kiri */}
          <div className="col-span-4 flex items-center gap-2 text-left justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.leftLogoUrl || '/brand/logo.png'}
              alt={settings.leftLogoTitle || 'Rajendra Swim System'}
              className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs shrink-0"
            />
            <div className="hidden sm:block leading-none">
              <p className="font-heading font-black text-[10.5px] text-[#0a192f] tracking-wide uppercase">
                {settings.leftLogoTitle || 'RAJENDRA SWIM SYSTEM'}
              </p>
              <p className="font-mono text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {settings.leftLogoSubtitle || 'OFFICIAL SANCTIONED SYSTEM'}
              </p>
            </div>
          </div>

          {/* Logo Tengah (Sponsor Utama) */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center">
            {settings.showMainSponsor !== false && (
              <div className="px-2.5 py-0.5 rounded-lg border border-amber-300/90 bg-gradient-to-b from-amber-50/95 via-white to-amber-50/80 shadow-2xs flex flex-col items-center justify-center min-w-[130px] max-w-[200px]">
                <span className="text-[6.5px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded-full mb-0.5 border border-amber-300">
                  ★ {settings.mainSponsorSubtitle || 'OFFICIAL MAIN SPONSOR'} ★
                </span>
                {settings.mainSponsorLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.mainSponsorLogoUrl}
                    alt={settings.mainSponsorTitle || 'Sponsor Utama'}
                    className="h-6 sm:h-7 w-auto max-w-[150px] object-contain my-0.5"
                  />
                ) : (
                  <div className="py-0.2 px-1.5 border border-dashed border-amber-400/80 rounded bg-white/80 my-0.5 text-center">
                    <p className="font-mono font-bold text-[7.5px] text-amber-950 uppercase">
                      {settings.mainSponsorTitle || 'MAIN SPONSOR'}
                    </p>
                  </div>
                )}
              </div>
            )}
            <p className="text-[7px] font-mono font-bold tracking-widest text-slate-500 uppercase mt-0.5">
              NO: {certNumber}
            </p>
          </div>

          {/* Logo Kanan */}
          <div className="col-span-4 flex items-center gap-2 text-right justify-end">
            <div className="hidden sm:block leading-none">
              <p className="font-heading font-black text-[10.5px] text-[#0a192f] tracking-wide uppercase">
                {settings.rightLogoTitle || 'RAJENDRA ORGANIZER'}
              </p>
              <p className="font-mono text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {settings.rightLogoSubtitle || 'CHAMPIONSHIP ORGANIZER'}
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.rightLogoUrl || '/brand/rajendra-organizer-logo.png'}
              alt={settings.rightLogoTitle || 'Rajendra Organizer'}
              className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs shrink-0"
            />
          </div>
        </div>

        {/* ── JUDUL BESAR PIAGAM PENGHARGAAN ── */}
        <div className="pt-2 space-y-0.5 text-center">
          <h1 className="text-2xl sm:text-[26px] font-black uppercase tracking-[0.16em] text-[#0a192f] font-serif leading-tight">
            {settings.headerTitle || (isMedalist ? 'PIAGAM PENGHARGAAN' : 'SERTIFIKAT PARTISIPASI')}
          </h1>

          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#c59b27]" />
            <p className="text-[10px] font-extrabold tracking-[0.22em] text-[#c59b27] uppercase font-sans">
              {settings.headerSubtitle || (isMedalist ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION')}
            </p>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#c59b27]" />
          </div>

          <p className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider">
            {recipient.eventName}
          </p>
        </div>
      </div>

      {/* ── 4. IDENTITAS ATLET PENERIMA ── */}
      <div className="relative z-20 my-0.5 text-center space-y-0.5">
        <p className="text-[10px] italic text-slate-500 font-serif">
          {settings.presentedText || 'Diberikan dengan bangga kepada / Proudly presented to:'}
        </p>

        <h2 className="text-2xl sm:text-[28px] font-black tracking-wide text-[#0a192f] uppercase font-serif py-0.5 leading-none">
          {recipient.swimmerName}
        </h2>

        {recipient.schoolName && (
          <p className="text-[12px] font-bold tracking-wider text-[#0284c7] uppercase">
            {recipient.schoolName}
          </p>
        )}
      </div>

      {/* ── 5. KOTAK PRESTASI & CATATAN WAKTU ── */}
      <div className="relative z-20 mx-auto w-full max-w-xl text-center">
        <div
          className={`rounded-xl p-2.5 border shadow-2xs ${
            isGold
              ? 'bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-amber-50/90 border-amber-300'
              : isSilver
              ? 'bg-gradient-to-r from-slate-50 via-slate-100/80 to-slate-50 border-slate-300'
              : isBronze
              ? 'bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 border-orange-300'
              : 'bg-gradient-to-r from-blue-50/80 via-sky-50/60 to-blue-50/80 border-blue-200'
          }`}
        >
          <p className="text-[9.5px] text-slate-600 font-medium">
            {settings.achievementText || 'Atas prestasinya meraih pencapaian:'}
          </p>

          <div className="mt-0.5 flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-2xs ${
                isGold
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 border border-amber-300'
                  : isSilver
                  ? 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 text-slate-900 border border-slate-300'
                  : isBronze
                  ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white border border-amber-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
              }`}
            >
              {isGold ? <Trophy className="h-3 w-3" /> : isMedalist ? <Award className="h-3 w-3" /> : <Star className="h-3 w-3" />}
              {medalLabel}
            </span>
          </div>

          <p className="text-[11px] font-black text-[#0a192f] mt-0.5 uppercase tracking-wide">
            {formattedEventTitle}
          </p>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.2 rounded-full bg-white border border-amber-300/80 shadow-2xs font-semibold">
              <span className="text-slate-600 text-[9px] uppercase font-bold">Waktu Tempuh Resmi:</span>
              <b className="font-mono font-black text-slate-950 text-[11px] tabular-nums">
                {recipient.formattedTime} detik
              </b>
            </span>

            {recipient.isNewRecord && (() => {
              const rType = recipient.recordType || settings.defaultRecordType || 'games';
              const rConfig = RECORD_BADGES[rType] || RECORD_BADGES.games;
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-black tracking-wide uppercase border ${rConfig.cls}`}>
                  <Sparkles className="h-2.5 w-2.5" /> {rConfig.label}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── 6. DUAL TANDA TANGAN + QR VERIFIKASI RESMI ── */}
      <div className="relative z-20 border-t border-slate-200/80 pt-1.5">
        <div className="grid grid-cols-3 items-end gap-2 text-center">
          {/* Kiri: Technical Delegate */}
          <div className="space-y-0.5">
            <p className="text-[8px] text-slate-500 font-medium">Technical Delegate / Referee</p>
            <div className="h-7 flex items-end justify-center">
              <div className="w-24 border-b border-dashed border-slate-400" />
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase leading-none">
              {settings.technicalDelegate || 'Technical Delegate'}
            </p>
            <p className="text-[7px] text-slate-500">
              {settings.technicalDelegateTitle || 'Technical Delegate / Referee'}
            </p>
          </div>

          {/* Tengah: QR Code & Verification Badge */}
          <div className="flex flex-col items-center justify-center space-y-0.5">
            <div className="relative">
              <div className="rounded-lg border border-amber-200 bg-white p-0.5 shadow-2xs">
                <QrCodeSvg value={verificationPayload} size={36} />
              </div>
              <div className="absolute -top-1 -right-2 px-1 py-0.2 rounded bg-emerald-600 text-white font-mono text-[5.5px] font-black uppercase tracking-tighter shadow-2xs border border-emerald-400">
                VERIFIED
              </div>
            </div>
            <p className="text-[6.5px] font-mono font-black text-slate-700 uppercase tracking-tight flex items-center gap-0.5">
              <ShieldCheck className="h-2 w-2 text-emerald-600 inline" /> SWIMSYS SANCTIONED
            </p>
            <p className="text-[7.5px] text-slate-600 font-bold">
              {settings.issuedCity || 'Kota Kejuaraan'}, {settings.issuedDate || '2026'}
            </p>
          </div>

          {/* Kanan: Ketua Panitia Pelaksana */}
          <div className="space-y-0.5">
            <p className="text-[8px] text-slate-500 font-medium">Ketua Panitia Pelaksana</p>
            <div className="h-7 flex items-end justify-center">
              <div className="w-24 border-b border-dashed border-slate-400" />
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase leading-none">
              {settings.organizerChairman || 'Ketua Panitia'}
            </p>
            <p className="text-[7px] text-slate-500">
              {settings.organizerChairmanTitle || 'Panitia Pelaksana Kejuaraan'}
            </p>
          </div>
        </div>

        {/* ── 7. FOOTER SPONSORS STRIP ── */}
        {settings.showSponsors !== false && sponsors && sponsors.length > 0 && (
          <div className="mt-1 pt-1 border-t border-amber-200/40">
            <div className="rounded-lg border border-slate-200/60 bg-white/70 backdrop-blur-xs p-0.5 shadow-2xs">
              <SponsorLogosStrip
                sponsors={sponsors}
                title="OFFICIAL SPONSORS & PARTNERS"
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
