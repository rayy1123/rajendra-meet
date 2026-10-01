'use client';

import { QrCodeSvg } from './qr-code-svg';
import { Award, Trophy, Star, Sparkles, ShieldCheck, Building2 } from 'lucide-react';
import type { CertificateRecipient, CertificateSettings } from './certificate-manager';
import type { SponsorItem } from '@/lib/data/sponsors';
import { SponsorLogosStrip } from './sponsor-logos-strip';
import { formatCompEventLabel } from '@/lib/utils';

export const RECORD_BADGES: Record<string, { label: string; cls: string }> = {
  pribadi: { label: 'REKOR PRIBADI (PB)', cls: 'bg-cyan-600 text-white border-cyan-300/80 shadow-2xs' },
  games: { label: 'REKOR GAMES (KEJUARAAN)', cls: 'bg-rose-600 text-white border-rose-300/80 shadow-2xs' },
  daerah: { label: 'REKOR DAERAH (REGIONAL)', cls: 'bg-purple-600 text-white border-purple-300/80 shadow-2xs' },
  nasional: { label: 'REKOR NASIONAL (NATIONAL)', cls: 'bg-amber-600 text-white border-amber-300/80 shadow-2xs' },
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
  const verificationPayload = `RAJENDRA-MEET:CERT:${recipient.athleteNumber}:${recipient.competitionEventId}:${recipient.rank}:${recipient.finishTimeMs || 0}`;

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
        return 'bg-gradient-to-br from-[#ffffff] via-[#fefce8] to-[#fef3c7] text-slate-900';
      case 'oceanic_blue':
        return 'bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe] text-slate-900';
      case 'pure_white':
        return 'bg-white text-slate-900';
      default:
        return 'bg-gradient-to-br from-[#ffffff] via-[#fcfbf9] to-[#f7f9fc] text-slate-900';
    }
  })();

  const borderTheme = settings.borderStyle || 'gold_classic';

  return (
    <div
      className={`certificate-sheet relative mx-auto overflow-hidden ${bgThemeClass} rounded-2xl print:rounded-none print:shadow-none print:m-0 print:border-0 ${
        isPrintOnly ? 'print:block' : 'print:break-after-page print:break-inside-avoid'
      }`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '860px',
        minHeight: '600px',
        pageBreakAfter: 'always',
        breakAfter: 'page',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ── 0. CUSTOM BACKGROUND IMAGE (DAPAT DIATUR ADMIN DENGAN OPACITY) ── */}
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

      {/* ── 1. BACKGROUND WATERMARK SANCTION (BISA DIAKTIFKAN / DINONAKTIFKAN ADMIN) ── */}
      {settings.showWatermark !== false && (
        <>
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.032] print:opacity-[0.045] pointer-events-none select-none z-0"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`sanction-watermark-${recipient.id}`}
                width="320"
                height="130"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-24)"
              >
                <text
                  x="10"
                  y="32"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="900"
                  fill="#0f2b5c"
                  letterSpacing="0.22em"
                >
                  RAJENDRA SWIM SYSTEM
                </text>
                <text
                  x="10"
                  y="58"
                  fontSize="8"
                  fontFamily="sans-serif"
                  fontWeight="800"
                  fill="#b48a3c"
                  letterSpacing="0.16em"
                >
                  OFFICIAL SANCTIONED • RAJENDRA SWIM SYSTEM
                </text>
                <text
                  x="10"
                  y="82"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="700"
                  fill="#0284c7"
                  letterSpacing="0.12em"
                >
                  OFFICIAL CHAMPIONSHIP RECORD • CERTIFIED
                </text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#sanction-watermark-${recipient.id})`} />
          </svg>

          {/* Central Crest Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] print:opacity-[0.07] z-0">
            <svg viewBox="0 0 400 400" className="h-[360px] w-[360px] text-[#0f2b5c]">
              <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 3" />
              <circle cx="200" cy="200" r="182" fill="none" stroke="#b48a3c" strokeWidth="1.8" />
              <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="200" cy="200" r="134" fill="none" stroke="#b48a3c" strokeWidth="1" strokeDasharray="4 2" />

              <path id={`circleTextPath-${recipient.id}`} d="M 200, 200 m -158, 0 a 158,158 0 1,1 316,0 a 158,158 0 1,1 -316,0" fill="none" />
              <text fontSize="10.5" fontWeight="900" letterSpacing="0.22em" fill="#0f2b5c">
                <textPath href={`#circleTextPath-${recipient.id}`} startOffset="50%" textAnchor="middle">
                  ★ RAJENDRA SWIM SYSTEM • OFFICIAL CHAMPIONSHIP ★
                </textPath>
              </text>

              <g transform="translate(105, 142) scale(3.6)" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round">
                <path d="M4 6 Q 16 1, 26 6 T 48 6" />
                <path d="M4 14 Q 16 9, 26 14 T 48 14" />
                <path d="M4 22 Q 16 17, 26 22 T 48 22" />
                <path d="M4 30 Q 16 25, 26 30 T 48 30" />
              </g>

              <text x="200" y="274" textAnchor="middle" fontSize="20" fontWeight="900" letterSpacing="0.28em" fill="#b48a3c">
                SANCTIONED
              </text>
              <text x="200" y="293" textAnchor="middle" fontSize="8.5" fontWeight="800" letterSpacing="0.18em" fill="#0f2b5c">
                OFFICIAL CHAMPIONSHIP RECORD COMPLIANT
              </text>
            </svg>
          </div>
        </>
      )}

      {/* ── 2. BINGKAI SERTIFIKAT (DAPAT DIATUR: GOLD CLASSIC, NAVY AQUATIC, SILVER, NONE) ── */}
      {borderTheme !== 'none' && (
        <>
          <div
            className={`absolute inset-3 rounded-2xl p-1.5 pointer-events-none print:inset-2 print:border-[2.5px] z-10 ${
              borderTheme === 'navy_aquatic'
                ? 'border-[3px] border-[#0284c7]'
                : borderTheme === 'silver_modern'
                ? 'border-[3px] border-[#94a3b8]'
                : 'border-[3px] border-[#b48a3c]'
            }`}
          >
            <div
              className={`h-full w-full rounded-xl p-1 ${
                borderTheme === 'navy_aquatic'
                  ? 'border-[1.5px] border-[#0f2b5c]'
                  : borderTheme === 'silver_modern'
                  ? 'border-[1.5px] border-[#475569]'
                  : 'border-[1.5px] border-[#0f2b5c]'
              }`}
            >
              <div
                className={`h-full w-full rounded-lg ${
                  borderTheme === 'navy_aquatic'
                    ? 'border border-[#0284c7]/40'
                    : borderTheme === 'silver_modern'
                    ? 'border border-[#cbd5e1]'
                    : 'border border-[#b48a3c]/40'
                }`}
              />
            </div>
          </div>

          {/* Ornamen Sudut Mewah (Guilloche Corner Brackets) */}
          <div
            className={`absolute top-5 left-5 w-8 h-8 pointer-events-none z-10 ${
              borderTheme === 'navy_aquatic'
                ? 'border-t-[3px] border-l-[3px] border-[#0284c7]'
                : borderTheme === 'silver_modern'
                ? 'border-t-[3px] border-l-[3px] border-[#94a3b8]'
                : 'border-t-[3px] border-l-[3px] border-[#b48a3c]'
            }`}
          />
          <div
            className={`absolute top-5 right-5 w-8 h-8 pointer-events-none z-10 ${
              borderTheme === 'navy_aquatic'
                ? 'border-t-[3px] border-r-[3px] border-[#0284c7]'
                : borderTheme === 'silver_modern'
                ? 'border-t-[3px] border-r-[3px] border-[#94a3b8]'
                : 'border-t-[3px] border-r-[3px] border-[#b48a3c]'
            }`}
          />
          <div
            className={`absolute bottom-5 left-5 w-8 h-8 pointer-events-none z-10 ${
              borderTheme === 'navy_aquatic'
                ? 'border-b-[3px] border-l-[3px] border-[#0284c7]'
                : borderTheme === 'silver_modern'
                ? 'border-b-[3px] border-l-[3px] border-[#94a3b8]'
                : 'border-b-[3px] border-l-[3px] border-[#b48a3c]'
            }`}
          />
          <div
            className={`absolute bottom-5 right-5 w-8 h-8 pointer-events-none z-10 ${
              borderTheme === 'navy_aquatic'
                ? 'border-b-[3px] border-r-[3px] border-[#0284c7]'
                : borderTheme === 'silver_modern'
                ? 'border-b-[3px] border-r-[3px] border-[#94a3b8]'
                : 'border-b-[3px] border-r-[3px] border-[#b48a3c]'
            }`}
          />
        </>
      )}

      {/* ── 3. KONTEN UTAMA SERTIFIKAT ── */}
      <div className="relative z-20 flex flex-col justify-between h-full p-6 sm:p-8 text-center">
        {/* ── HEADER TIGA LOGO: Kiri (Rajendra Swim System) • Tengah (Sponsor Utama) • Kanan (Rajendra Organizer) ── */}
        <div>
          <div className="grid grid-cols-3 items-center px-2 pb-2.5 border-b border-amber-200/60 gap-2 sm:gap-3">
            {/* 1. LOGO KIRI: Rajendra Swim System */}
            <div className="flex items-center gap-2 text-left justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.leftLogoUrl || '/brand/logo.png'}
                alt={settings.leftLogoTitle || 'Rajendra Swim System'}
                className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
              />
              <div className="hidden sm:block">
                <p className="font-serif font-black text-[10.5px] sm:text-[11.5px] text-slate-900 tracking-wide leading-tight uppercase">
                  {settings.leftLogoTitle || 'RAJENDRA SWIM SYSTEM'}
                </p>
                <p className="font-mono text-[7px] sm:text-[7.5px] font-bold text-slate-500 uppercase tracking-wider">
                  {settings.leftLogoSubtitle || 'OFFICIAL SANCTIONED SYSTEM'}
                </p>
              </div>
            </div>

            {/* 2. LOGO TENGAH: TEMPAT KHUSUS LOGO SPONSOR UTAMA */}
            <div className="flex flex-col items-center justify-center text-center">
              {settings.showMainSponsor !== false && (
                <div className="px-2.5 py-1 rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-50/90 via-white/80 to-amber-50/60 shadow-xs flex flex-col items-center justify-center min-w-[130px] max-w-[210px]">
                  <span className="text-[7px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-full mb-0.5 border border-amber-200">
                    ★ {settings.mainSponsorSubtitle || 'SPONSOR UTAMA RESMI'} ★
                  </span>

                  {settings.mainSponsorLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.mainSponsorLogoUrl}
                      alt={settings.mainSponsorTitle || 'Sponsor Utama'}
                      className="h-8 sm:h-10 w-auto max-w-[170px] object-contain my-0.5"
                    />
                  ) : (
                    <div className="py-0.5 px-2 border border-dashed border-amber-400 rounded-md bg-amber-50/50 my-0.5 text-center">
                      <p className="font-mono font-bold text-[9px] text-amber-900 uppercase">
                        {settings.mainSponsorTitle || 'SPONSOR UTAMA'}
                      </p>
                      <p className="text-[7px] text-slate-400 font-medium">Tempat Logo Sponsor</p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[7.5px] font-mono font-bold tracking-widest text-slate-500 uppercase mt-1">
                NO: {certNumber}
              </p>
            </div>

            {/* 3. LOGO KANAN: Rajendra Organizer */}
            <div className="flex items-center gap-2 text-right justify-end">
              <div className="hidden sm:block">
                <p className="font-serif font-black text-[10.5px] sm:text-[11.5px] text-slate-900 tracking-wide leading-tight uppercase">
                  {settings.rightLogoTitle || 'RAJENDRA ORGANIZER'}
                </p>
                <p className="font-mono text-[7px] sm:text-[7.5px] font-bold text-slate-500 uppercase tracking-wider">
                  {settings.rightLogoSubtitle || 'CHAMPIONSHIP ORGANIZER'}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.rightLogoUrl || '/brand/rajendra-organizer-logo.png'}
                alt={settings.rightLogoTitle || 'Rajendra Organizer'}
                className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
              />
            </div>
          </div>

          {/* Judul Besar Piagam (Dapat Disesuaikan Admin) */}
          <div className="pt-2.5 space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#0f2b5c] font-serif">
              {settings.headerTitle || (isMedalist ? 'PIAGAM PENGHARGAAN' : 'SERTIFIKAT PARTISIPASI')}
            </h1>
            <p className="text-xs font-bold tracking-widest text-[#b48a3c] uppercase font-sans flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {settings.headerSubtitle || (isMedalist ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION')}
              <Sparkles className="h-3 w-3 text-amber-500" />
            </p>
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide pt-0.5">
              {recipient.eventName}
            </p>
          </div>
        </div>

        {/* Identitas Penerima (Nama Atlet & Klub) */}
        <div className="my-1 space-y-0.5">
          <p className="text-xs italic text-slate-500 font-serif">
            {settings.presentedText || 'Diberikan dengan bangga kepada / Proudly presented to:'}
          </p>

          <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-950 uppercase font-serif py-0.5">
            {recipient.swimmerName}
          </h2>

          {recipient.schoolName && (
            <p className="text-sm font-bold tracking-wide text-blue-950 uppercase">
              {recipient.schoolName}
            </p>
          )}
        </div>

        {/* KOTAK PRESTASI GLASSMORPHISM AQUATIC */}
        <div
          className={`mx-auto w-full max-w-xl rounded-2xl p-3.5 shadow-[0_8px_32px_0_rgba(15,43,92,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] ${
            isGold
              ? 'glass-gold'
              : isSilver
              ? 'glass-silver'
              : isBronze
              ? 'glass-bronze'
              : 'glass-morphism'
          }`}
        >
          <p className="text-[11px] text-slate-600 font-medium">
            {settings.achievementText || 'Atas prestasinya meraih pencapaian:'}
          </p>

          <div className="mt-1 flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-xs ${
                isGold
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950'
                  : isSilver
                  ? 'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-500 text-slate-950'
                  : isBronze
                  ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
              }`}
            >
              {isGold ? <Trophy className="h-3.5 w-3.5" /> : isMedalist ? <Award className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
              {medalLabel}
            </span>
          </div>

          <p className="text-xs font-black text-[#0f2b5c] mt-1 uppercase">
            {formattedEventTitle}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-800">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-amber-300/80 shadow-2xs font-semibold">
              <span className="text-slate-600 text-[10px] uppercase font-bold">Waktu Tempuh Resmi:</span>
              <b className="font-mono font-black text-slate-950 text-xs">
                {recipient.formattedTime} detik
              </b>
            </span>

            {/* 4 Kategori Rekor (Dapat Diatur Admin: Pribadi, Games, Daerah, Nasional) */}
            {recipient.isNewRecord && (() => {
              const rType = recipient.recordType || settings.defaultRecordType || 'games';
              const rConfig = RECORD_BADGES[rType] || RECORD_BADGES.games;
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border ${rConfig.cls}`}>
                  <Sparkles className="h-3 w-3" /> {rConfig.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Tanda Tangan, QR Code Sanction, dan Stempel Resmi */}
        <div className="mt-2.5 pt-2 border-t border-slate-200">
          <div className="grid grid-cols-3 items-end gap-2 text-center">
            {/* Kiri: Technical Delegate */}
            <div className="space-y-0.5">
              <p className="text-[9px] text-slate-500 font-medium">Technical Delegate / Referee</p>
              <div className="h-7 flex items-end justify-center">
                <div className="w-24 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-[11px] font-bold text-slate-900 uppercase">
                {settings.technicalDelegate || 'Technical Delegate'}
              </p>
              <p className="text-[8px] text-slate-500">
                {settings.technicalDelegateTitle || 'Technical Delegate / Referee'}
              </p>
            </div>

            {/* Tengah: QR Code & Stempel Sanction SwimSystem */}
            <div className="flex flex-col items-center justify-center space-y-0.5">
              <div className="relative">
                <div className="rounded-xl border border-white/90 bg-white/95 backdrop-blur-sm p-1 shadow-[0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-amber-200/50">
                  <QrCodeSvg value={verificationPayload} size={40} />
                </div>
                <div className="absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded bg-emerald-600 text-white font-mono text-[6.5px] font-black uppercase tracking-tighter shadow-2xs border border-emerald-400">
                  VERIFIED
                </div>
              </div>
              <p className="text-[7.5px] font-mono font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600 inline" /> SWIMSYS SANCTIONED
              </p>
              <p className="text-[8.5px] text-slate-600 font-bold">
                {settings.issuedCity || 'Kota Kejuaraan'}, {settings.issuedDate || '2026'}
              </p>
            </div>

            {/* Kanan: Ketua Panitia Pelaksana */}
            <div className="space-y-0.5">
              <p className="text-[9px] text-slate-500 font-medium">Ketua Panitia Pelaksana</p>
              <div className="h-7 flex items-end justify-center">
                <div className="w-24 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-[11px] font-bold text-slate-900 uppercase">
                {settings.organizerChairman || 'Ketua Panitia'}
              </p>
              <p className="text-[8px] text-slate-500">
                {settings.organizerChairmanTitle || 'Panitia Pelaksana Kejuaraan'}
              </p>
            </div>
          </div>
        </div>

        {/* PITA LOGO SPONSORSHIP RESMI DALAM DOCK GLASSMORPHISM */}
        {settings.showSponsors !== false && sponsors && sponsors.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-amber-200/40">
            <div className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm p-1.5 shadow-2xs">
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
