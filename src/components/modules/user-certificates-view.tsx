'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  Medal,
  Printer,
  CalendarDays,
  Timer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CertificateCard } from './certificate-card';
import type { CertificateRecipient, CertificateSettings } from './certificate-manager';
import type { SponsorItem } from '@/lib/data/sponsors';
import { printElement } from '@/lib/utils/print-helper';
import { cn } from '@/lib/utils';
import { formatKuDisplay } from '@/lib/age-category';

export interface UserCertificatesViewProps {
  recipients: CertificateRecipient[];
  userAthletesCount: number;
  sponsors?: SponsorItem[];
}

export function UserCertificatesView({
  recipients,
  userAthletesCount,
  sponsors = [],
}: UserCertificatesViewProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<CertificateRecipient | null>(null);
  const [printingRecipient, setPrintingRecipient] = useState<CertificateRecipient | null>(null);

  // Default Pengaturan Sertifikat Resmi Terbitan Panitia
  const officialSettings: CertificateSettings = {
    skNumber: '028/SK-RM/X/2026',
    issuedCity: 'Jakarta',
    issuedDate: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    organizerChairman: 'Panitia Pelaksana Rajendra Swim System',
    organizerChairmanTitle: 'Ketua Panitia Kejuaraan',
    technicalDelegate: 'Technical Delegate / Referee',
    technicalDelegateTitle: 'Technical Delegate / Referee',
    certificateType: 'achievement',
    showSponsors: true,
    leftLogoUrl: '/brand/logo.png',
    leftLogoTitle: 'RAJENDRA SWIM SYSTEM',
    leftLogoSubtitle: 'OFFICIAL SANCTIONED SYSTEM',
    mainSponsorLogoUrl: null,
    mainSponsorTitle: 'OFFICIAL MAIN SPONSOR',
    mainSponsorSubtitle: 'SPONSOR UTAMA RESMI',
    showMainSponsor: true,
    rightLogoUrl: '/brand/rajendra-organizer-logo.png',
    rightLogoTitle: 'RAJENDRA ORGANIZER',
    rightLogoSubtitle: 'CHAMPIONSHIP ORGANIZER',
    backgroundTheme: 'default',
    borderStyle: 'gold_classic',
    showWatermark: true,
  };

  const [activeSettings, setActiveSettings] = useState<CertificateSettings>(officialSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scms-certificate-settings');
      if (saved) {
        setActiveSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePrint = (rec: CertificateRecipient) => {
    setSelectedRecipient(null);
    setPrintingRecipient(rec);
    setTimeout(() => {
      printElement('user-certificate-sheet-content', {
        title: `Sertifikat-Juara-${rec.swimmerName.replace(/\s+/g, '-')}`,
        isLandscape: true,
        pageMargin: '0mm',
      });
    }, 120);
  };

  const handlePrintModal = () => {
    if (!selectedRecipient) return;
    printElement('modal-certificate-preview-card', {
      title: `Sertifikat-Juara-${selectedRecipient.swimmerName.replace(/\s+/g, '-')}`,
      isLandscape: true,
      pageMargin: '0mm',
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Print Stylesheet Khusus Sertifikat A4 Landscape Presisi 1 Lembar ── */}
      <style jsx global>{`
        @media print {
          aside,
          header,
          nav,
          .no-print,
          footer,
          .breadcrumb-container,
          .modal-toolbar,
          [data-slot="dialog-overlay"],
          button {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }

          @page {
            size: A4 landscape;
            margin: 0mm;
          }

          body,
          html {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }

          #user-certificate-print-area {
            display: block !important;
            position: static !important;
            width: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .certificate-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            width: 297mm !important;
            height: 210mm !important;
            max-width: 297mm !important;
            max-height: 210mm !important;
            min-height: 210mm !important;
            margin: 0 auto !important;
            padding: 10mm 16mm 8mm 16mm !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* ── BANNER INFORMASI OTORITAS SERTIFIKAT JUARA ── */}
      <div className="no-print rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/60 p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-2xs">
              <Trophy className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading font-black text-base text-slate-900">
                Sertifikat Juara &amp; Penghargaan Resmi
              </h2>
              <p className="text-xs text-slate-600">
                Sertifikat penghargaan resmi diterbitkan dan disahkan oleh Panitia Pelaksana Rajendra Swim System untuk atlet binaan Anda yang berhasil meraih podium kejuaraan.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="bg-white border-blue-200 text-blue-900 font-bold text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Terverifikasi Panitia
          </Badge>
        </div>
      </div>

      {/* ── DAFTAR SERTIFIKAT JUARA ATLET ── */}
      <div className="no-print">
        {recipients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
            <EmptyState
              icon={<Award className="h-10 w-10 text-slate-400" />}
              title="Belum Ada Sertifikat Juara"
              description={
                userAthletesCount === 0
                  ? 'Anda belum mendaftarkan atlet binaan. Daftarkan atlet Anda dan ikuti kejuaraan resmi untuk meraih sertifikat penghargaan.'
                  : 'Sertifikat resmi akan otomatis muncul di sini setelah atlet binaan Anda meraih Juara 1 (Emas), Juara 2 (Perak), Juara 3 (Perunggu), atau Rekor Baru pada kejuaraan renang Rajendra Swim System.'
              }
              action={
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <Link href="/scoreboard" target="_blank">
                    <Button variant="outline" className="gap-2 text-xs font-bold border-slate-300">
                      <Timer className="h-4 w-4 text-blue-600" /> Pantau Scoreboard Live
                    </Button>
                  </Link>
                  <Link href="/rankings">
                    <Button className="gap-2 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
                      <Trophy className="h-4 w-4" /> Lihat Hasil Peringkat
                    </Button>
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold">
                Ditemukan {recipients.length} Sertifikat Juara Resmi untuk Atlet Binaan Anda
              </span>
              <span className="text-[11px] font-mono text-slate-400">Format Kertas: A4 Landscape Resmi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipients.map((rec) => {
                const isGold = rec.rank === 1;
                const isSilver = rec.rank === 2;
                const isBronze = rec.rank === 3;

                return (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Badge: Medal Rank */}
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-2xs',
                            isGold
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isSilver
                              ? 'bg-slate-200 text-slate-900 border border-slate-300'
                              : isBronze
                              ? 'bg-amber-50 text-amber-950 border border-amber-200'
                              : 'bg-blue-50 text-blue-900 border border-blue-200'
                          )}
                        >
                          {isGold ? (
                            <>🥇 JUARA 1 (MEDALI EMAS)</>
                          ) : isSilver ? (
                            <>🥈 JUARA 2 (MEDALI PERAK)</>
                          ) : isBronze ? (
                            <>🥉 JUARA 3 (MEDALI PERUNGGU)</>
                          ) : (
                            <>PERINGKAT #{rec.rank}</>
                          )}
                        </span>

                        {rec.isNewRecord && (
                          <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                            <Sparkles className="h-3 w-3 mr-1" /> Rekor Baru
                          </Badge>
                        )}
                      </div>

                      {/* Swimmer & Event Info */}
                      <div>
                        <h3 className="font-heading font-black text-lg text-slate-950 uppercase leading-snug">
                          {rec.swimmerName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          ID: {rec.athleteNumber} • {formatKuDisplay(rec.ageGroup)} • {rec.schoolName}
                        </p>
                      </div>

                      {/* Competition Event & Official Time */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-semibold text-slate-900 truncate">
                            {rec.competitionEventName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono">
                          <span className="text-slate-500">Waktu Tempuh Resmi:</span>
                          <span className="font-black text-slate-950 text-xs">
                            {rec.formattedTime} detik
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-medium">
                        Kejuaraan: <b>{rec.eventName}</b>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRecipient(rec)}
                        className="h-8 gap-1.5 text-xs font-semibold border-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-600" /> Pratinjau
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePrint(rec)}
                        className="h-8 gap-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs"
                      >
                        <Printer className="h-3.5 w-3.5" /> Cetak / Unduh PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── AREA CETAK KHUSUS (HANYA DITAMPILKAN SAAT CETAK) ── */}
      <div id="user-certificate-print-area" className="only-print">
        {printingRecipient && (
          <div id="user-certificate-sheet-content">
            <CertificateCard
              recipient={printingRecipient}
              settings={activeSettings}
              sponsors={sponsors}
              isPrintOnly
            />
          </div>
        )}
      </div>

      {/* ── MODAL PRATINJAU SERTIFIKAT PESERTA ── */}
      <Dialog open={!!selectedRecipient} onOpenChange={(open) => !open && setSelectedRecipient(null)}>
        <DialogContent className="max-w-4xl p-6 no-print backdrop-blur-xl bg-white/95 border border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Trophy className="h-5 w-5 text-amber-500" /> Pratinjau Sertifikat Juara Resmi
            </DialogTitle>
          </DialogHeader>

          {selectedRecipient && (
            <div className="space-y-4 pt-2">
              <div id="modal-certificate-preview-card" className="max-h-[72vh] overflow-y-auto p-1 rounded-xl border bg-slate-100/50">
                <CertificateCard
                  recipient={selectedRecipient}
                  settings={activeSettings}
                  sponsors={sponsors}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <p className="text-slate-500">
                  Sertifikat diterbitkan secara otomatis dengan segel sanction <b>Rajendra Swim System</b>.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecipient(null)}
                    className="text-xs cursor-pointer"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => handlePrint(selectedRecipient)}
                    size="sm"
                    className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  >
                    <Printer className="h-4 w-4" /> Cetak Sekarang (PDF)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
