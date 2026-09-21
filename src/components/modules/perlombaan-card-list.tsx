'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Upload,
  UserPlus,
  ArrowRight,
  Sparkles,
  Trophy,
  X,
  FileSpreadsheet,
  Download,
  Camera,
} from 'lucide-react';
import { Event } from '@/types/database';
import { EventLogoDialog } from '@/components/modules/event-logo-dialog';

export interface EventCardData extends Event {
  participant_count: number;
  max_participants?: number;
  tm_date?: string;
  reg_start_date?: string;
  reg_end_date?: string;
}

export function PerlombaanCardList({ events }: { events: EventCardData[] }) {
  const [selectedEventForImport, setSelectedEventForImport] = useState<EventCardData | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 border border-white/20 text-white px-4 py-3 shadow-2xl text-sm animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Belum ada kejuaraan yang dibuat.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => {
            const quota = ev.max_participants || 999;
            const regCount = ev.participant_count ?? 0;
            return (
              <div
                key={ev.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header: Logo & Title */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <EventLogoDialog
                        eventId={ev.id}
                        eventName={ev.name}
                        currentLogoUrl={ev.logo_url}
                        onLogoUpdated={(newUrl) => {
                          ev.logo_url = newUrl;
                          showToast('Logo kejuaraan berhasil diperbarui!');
                        }}
                        trigger={
                          <button
                            type="button"
                            className="group relative h-14 w-14 shrink-0 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                            title="Klik untuk mengubah logo kejuaraan"
                          >
                            {ev.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ev.logo_url}
                                alt={ev.name}
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <Trophy className="h-7 w-7 text-blue-600" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Camera className="h-4 w-4" />
                            </div>
                          </button>
                        }
                      />
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {ev.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            {ev.is_published ? 'Dibuka' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <EventLogoDialog
                      eventId={ev.id}
                      eventName={ev.name}
                      currentLogoUrl={ev.logo_url}
                      onLogoUpdated={(newUrl) => {
                        ev.logo_url = newUrl;
                        showToast('Logo kejuaraan berhasil diperbarui!');
                      }}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-primary hover:bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors shrink-0"
                          title="Ubah logo acara perlombaan"
                        >
                          <Camera className="h-3 w-3 text-primary" />
                          <span>Logo</span>
                        </button>
                      }
                    />
                  </div>

                  {/* Metadata List (Matching screenshot media_1789719736823.png) */}
                  <div className="space-y-2.5 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        Peserta: <strong className="text-slate-800">{regCount} / {quota}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        Perlombaan: <span className="text-slate-800">{ev.start_date}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        Pendaftaran: <span className="text-slate-800">{ev.reg_start_date || ev.start_date} - {ev.reg_end_date || ev.end_date}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        Technical Meeting: <span className="text-slate-800">{ev.tm_date || ev.start_date}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-slate-800">{ev.location}</span>
                    </div>
                  </div>
                </div>

                {/* Actions (Matching screenshot buttons: Daftar Manual & Import Excel) */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/perlombaan/partisipasi/${ev.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs py-2.5 shadow-sm transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-slate-500" /> Daftar Manual
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedEventForImport(ev)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-sm transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" /> Import Excel
                    </button>
                  </div>

                  <Link
                    href={`/perlombaan/partisipasi/${ev.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 transition-colors"
                  >
                    Kelola Partisipasi & Acara <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Import Excel Peserta */}
      {selectedEventForImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedEventForImport(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Import Peserta dari Excel
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEventForImport(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">{selectedEventForImport.name}</p>
              <p className="text-slate-500">
                Unggah file data atlet & nomor lomba (Format: No, Nama Lengkap, Gender, Tgl Lahir, Klub, Nomor Lomba, Seed Time).
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-2 hover:border-emerald-400 transition-colors">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                Pilih file Excel (.xlsx / .xls)
              </div>
              <input type="file" accept=".xlsx, .xls, .csv" className="text-xs text-slate-500" />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Template Excel sedang diunduh...');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> Template Excel
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventForImport(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Impor peserta Excel berhasil diproses!');
                    setSelectedEventForImport(null);
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold shadow-md"
                >
                  Import Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
