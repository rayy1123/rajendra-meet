'use client';

import React from 'react';
import { OfficialLetterData } from '@/types/letters';

export interface OfficialLetterSheetProps {
  data: OfficialLetterData;
  isPrintOnly?: boolean;
}

export function OfficialLetterSheet({ data, isPrintOnly = false }: OfficialLetterSheetProps) {
  const {
    kop,
    letterNumber,
    attachment,
    subject,
    letterDate,
    recipientTitle,
    salutation,
    openingParagraph,
    numberedPoints = [],
    closingParagraph,
    watermarkText,
    showWatermark = true,
    leftSignature,
    rightSignature,
    footer,
  } = data;

  const accentColor = kop.accentColor || '#0052cc';

  return (
    <div
      className={`official-letter-sheet relative mx-auto bg-white text-slate-900 border border-slate-300 shadow-xl overflow-hidden print:border-0 print:shadow-none print:m-0 print:rounded-none ${
        isPrintOnly ? 'print:block' : 'print:break-after-page print:break-inside-avoid'
      }`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '794px', // A4 Portrait standard 96dpi (210mm)
        minHeight: '1123px', // A4 Portrait standard 96dpi (297mm)
        padding: '36px 48px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      {/* ── 0. BACKGROUND WATERMARK (SEPERTI IMAGE #70) ── */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.055] print:opacity-[0.07] z-0">
          <div className="text-center space-y-4 max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kop.logoUrl || '/brand/logo.png'}
              alt="Watermark"
              className="h-44 w-auto mx-auto object-contain grayscale"
            />
            <p className="font-heading font-black text-3xl text-slate-900 tracking-widest uppercase">
              {watermarkText || kop.organizationName || 'RAJENDRA SWIM SYSTEM'}
            </p>
          </div>
        </div>
      )}

      {/* ── BAGIAN ATAS: KOP SURAT + METADATA + ISI ── */}
      <div className="relative z-10 space-y-5">
        {/* ── 1. KOP SURAT RESMI ── */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Kiri */}
            <div className="flex flex-col items-center justify-center shrink-0 w-28 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kop.logoUrl || '/brand/logo.png'}
                alt={kop.organizationName}
                className="h-16 w-auto object-contain"
              />
              {kop.subOrganizationName && (
                <span className="text-[8.5px] font-black tracking-tight text-rose-700 uppercase leading-none mt-1">
                  {kop.subOrganizationName}
                </span>
              )}
            </div>

            {/* Banner Pill & Nama Organisasi di Kanan */}
            <div className="flex-1 text-left space-y-1">
              {kop.bannerBadgeText && (
                <div
                  className="inline-block px-4 py-1 rounded-md text-white font-black text-[11px] tracking-wider uppercase shadow-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  {kop.bannerBadgeText}
                </div>
              )}

              <h1
                className="text-2xl sm:text-[26px] font-black tracking-tight uppercase leading-none"
                style={{ color: accentColor }}
              >
                {kop.organizationName}
              </h1>

              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                {kop.locationLine}
              </p>

              {kop.dateLine && (
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {kop.dateLine}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. METADATA SURAT (NOMOR, LAMPIRAN, PERIHAL & TANGGAL, KEPADA YTH) ── */}
        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          {/* Kolom Kiri: Nomor, Lampiran, Perihal */}
          <table className="text-xs leading-relaxed">
            <tbody>
              <tr>
                <td className="w-20 font-semibold text-slate-700 align-top">Nomor</td>
                <td className="w-3 text-slate-700 align-top">:</td>
                <td className="font-semibold text-slate-950 align-top font-mono">{letterNumber}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-700 align-top">Lampiran</td>
                <td className="text-slate-700 align-top">:</td>
                <td className="font-semibold text-slate-950 align-top">{attachment || '-'}</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-700 align-top">Perihal</td>
                <td className="text-slate-700 align-top">:</td>
                <td className="font-bold italic text-slate-950 align-top">{subject}</td>
              </tr>
            </tbody>
          </table>

          {/* Kolom Kanan: Tanggal Surat & Kepada Yth */}
          <div className="text-left pl-6 space-y-3">
            <p className="font-semibold text-slate-900">{letterDate}</p>
            <div className="space-y-0.5 text-slate-900 whitespace-pre-line leading-snug">
              {recipientTitle}
            </div>
          </div>
        </div>

        {/* ── 3. ISI SURAT (SALAM, PARAGRAF, NUMBERED POINTS, PENUTUP) ── */}
        <div className="pt-2 text-[12.5px] leading-relaxed text-slate-900 space-y-3">
          <p className="font-semibold">{salutation || 'Salam Olahraga,'}</p>
          <p className="text-justify leading-relaxed">{openingParagraph}</p>

          {numberedPoints && numberedPoints.length > 0 && (
            <ol className="list-decimal pl-6 space-y-1.5 text-justify leading-relaxed">
              {numberedPoints.map((pt, idx) => (
                <li key={idx} className="pl-1">
                  {pt}
                </li>
              ))}
            </ol>
          )}

          <p className="text-justify leading-relaxed pt-1">{closingParagraph}</p>
        </div>
      </div>

      {/* ── BAGIAN BAWAH: TANDA TANGAN DUAL + FOOTER BANNER ── */}
      <div className="relative z-10 space-y-6 pt-4">
        {/* ── 4. TANDA TANGAN DUAL DENGAN STEMPEL & TTD DIGITAL ── */}
        <div className="grid grid-cols-2 gap-8 text-left text-xs">
          {/* Tanda Tangan Kiri */}
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">{leftSignature.roleTitle}</p>

            {/* Kotak Stempel + Tanda Tangan Tumpang Tindih (Exact Image #70) */}
            <div className="relative h-24 w-48 flex items-center justify-start my-1">
              {/* Gambar Stempel Cap Bulat */}
              {leftSignature.showStamp !== false && (
                <div className="absolute left-1 top-1 h-20 w-20 pointer-events-none opacity-85">
                  {leftSignature.stampUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={leftSignature.stampUrl}
                      alt="Stempel Kiri"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    /* Default Official Stamp SVG Seal */
                    <svg viewBox="0 0 100 100" className="h-full w-full text-blue-800">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
                      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
                      <path id="stamp-text-left" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
                      <text fontSize="7" fontWeight="bold" fill="currentColor" letterSpacing="0.1em">
                        <textPath href="#stamp-text-left" startOffset="50%" textAnchor="middle">
                          ★ HARAHAP SWIMMING SCHOOL ★
                        </textPath>
                      </text>
                      <text x="50" y="53" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">
                        RESMI
                      </text>
                    </svg>
                  )}
                </div>
              )}

              {/* Gambar Coretan Tanda Tangan Digital */}
              {leftSignature.showSignature !== false && (
                <div className="absolute left-6 top-2 h-20 w-36 pointer-events-none z-10">
                  {leftSignature.signatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={leftSignature.signatureUrl}
                      alt="Tanda Tangan Kiri"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    /* Default Realistic Cursive Signature SVG */
                    <svg viewBox="0 0 180 80" className="h-full w-full text-slate-950 stroke-current fill-none">
                      <path d="M 20 50 Q 35 15 50 45 T 75 40 Q 90 20 110 50 T 140 45 Q 160 55 170 35" strokeWidth="2.2" strokeLinecap="round" />
                      <path d="M 40 45 L 145 42" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            <p className="font-bold text-slate-950 text-xs tracking-wide">
              {leftSignature.signerName}
            </p>
            {leftSignature.signerTitle && (
              <p className="text-[10px] text-slate-500">{leftSignature.signerTitle}</p>
            )}
          </div>

          {/* Tanda Tangan Kanan */}
          <div className="space-y-1 pl-4">
            <p className="font-semibold text-slate-900">{rightSignature.roleTitle}</p>

            {/* Kotak Stempel + Tanda Tangan Kanan */}
            <div className="relative h-24 w-48 flex items-center justify-start my-1">
              {/* Gambar Stempel Cap Kanan */}
              {rightSignature.showStamp !== false && (
                <div className="absolute left-4 top-1 h-20 w-28 pointer-events-none opacity-85">
                  {rightSignature.stampUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rightSignature.stampUrl}
                      alt="Stempel Kanan"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    /* Badge Stamp SVG Harahap / Rajendra */
                    <svg viewBox="0 0 140 70" className="h-full w-full text-blue-700">
                      <rect x="5" y="5" width="130" height="60" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
                      <text x="70" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">
                        HOME TOURNAMENT
                      </text>
                      <text x="70" y="42" textAnchor="middle" fontSize="13" fontWeight="900" fill="currentColor">
                        HARAHAP
                      </text>
                      <text x="70" y="56" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="currentColor">
                        SWIMMING SCHOOL
                      </text>
                    </svg>
                  )}
                </div>
              )}

              {/* Gambar Coretan Tanda Tangan Digital Kanan */}
              {rightSignature.showSignature !== false && (
                <div className="absolute left-0 top-3 h-20 w-40 pointer-events-none z-10">
                  {rightSignature.signatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rightSignature.signatureUrl}
                      alt="Tanda Tangan Kanan"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    /* Realistic Cursive Signature Right */
                    <svg viewBox="0 0 180 80" className="h-full w-full text-slate-950 stroke-current fill-none">
                      <path d="M 15 65 Q 45 10 70 55 T 105 40 Q 135 25 165 48" strokeWidth="2.4" strokeLinecap="round" />
                      <path d="M 55 50 Q 85 68 150 42" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            <p className="font-bold text-slate-950 text-xs tracking-wide">
              {rightSignature.signerName}
            </p>
            {rightSignature.signerTitle && (
              <p className="text-[10px] text-slate-500">{rightSignature.signerTitle}</p>
            )}
          </div>
        </div>

        {/* ── 5. FOOTER BANNER BIRU PEKAT (PERSIS IMAGE #70) ── */}
        <div
          className="rounded-2xl p-2.5 sm:p-3 text-white flex items-center justify-between shadow-md"
          style={{ backgroundColor: footer.backgroundColor || accentColor }}
        >
          {/* Kontak Admin 1 & Admin 2 */}
          <div className="flex items-center gap-6 sm:gap-8 pl-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-100 leading-none">
                {footer.admin1Label || 'ADMIN 1'}
              </p>
              <p className="text-sm sm:text-base font-black font-mono tracking-wider mt-0.5">
                {footer.admin1Number || '088 77 151189'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-100 leading-none">
                {footer.admin2Label || 'ADMIN 2'}
              </p>
              <p className="text-sm sm:text-base font-black font-mono tracking-wider mt-0.5">
                {footer.admin2Number || '088 999 151189'}
              </p>
            </div>
          </div>

          {/* Logo Sponsor / Mitra Kapsul Putih Kanan */}
          {footer.showPartners !== false && footer.partnerLogos && footer.partnerLogos.length > 0 && (
            <div className="bg-white/95 rounded-xl px-3 py-1.5 flex items-center gap-3 shadow-2xs">
              {footer.partnerLogos.map((p) => (
                <div key={p.id} className="flex items-center" title={p.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logoUrl}
                    alt={p.name}
                    className="h-6 sm:h-7 w-auto object-contain max-w-[48px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
