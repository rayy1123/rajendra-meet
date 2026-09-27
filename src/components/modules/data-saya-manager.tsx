'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Pencil,
  Calendar,
  Building,
  IdCard,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Phone,
  FileHeart,
  Scale,
  Sparkles,
  ArrowRight,
  Plus,
  Trophy,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AthleteFormModal, type AthleteFormValues } from '@/components/modules/athlete-form-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { getKuCode } from '@/lib/age-category';
import { cn } from '@/lib/utils';

export interface DataSayaAthlete {
  id: string;
  fullName: string;
  athleteNumber: string;
  gender: 'male' | 'female';
  birthDate: string;
  ageGroup: string;
  gradeLevel: string;
  className: string;
  schoolId: string | null;
  schoolName: string;
  parentPhone: string;
  medicalNotes: string;
  heightCm: number | null;
  weightKg: number | null;
}

export interface DataSayaRegistration {
  id: string;
  eventName: string;
  compName: string;
  status: string;
  paymentStatus: string;
  seedTimeMs: number | null;
}

export function DataSayaManager({
  athlete,
  schools,
  registrations = [],
}: {
  athlete: DataSayaAthlete | null;
  schools: { id: string; name: string }[];
  registrations?: DataSayaRegistration[];
}) {
  const [showModal, setShowModal] = useState(false);

  const formValues: AthleteFormValues | null = athlete
    ? {
        id: athlete.id,
        full_name: athlete.fullName,
        gender: athlete.gender,
        birth_date: athlete.birthDate,
        grade_level: athlete.gradeLevel,
        class_name: athlete.className,
        school_id: athlete.schoolId || '',
        parent_phone: athlete.parentPhone,
        medical_notes: athlete.medicalNotes,
        height_cm: athlete.heightCm ? String(athlete.heightCm) : '',
        weight_kg: athlete.weightKg ? String(athlete.weightKg) : '',
      }
    : null;

  return (
    <div className="space-y-6">
      {/* ── BANNER INFORMASI KHUSUS ATLET & WALI ── */}
      <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/70 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs mt-0.5">
              <User className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  <Sparkles className="h-3 w-3 text-blue-700" />
                  PROFIL ATLET PRIBADI
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">• PENDAFTARAN MANDIRI</span>
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-slate-900">
                Data Diri Atlet &amp; Verifikasi Nomor Lomba
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                Halaman ini memuat identitas resmi perenang untuk pendaftaran mandiri. Pastikan tanggal lahir terisi akurat agar sistem menentukan Kelompok Umur (KU) yang tepat sesuai regulasi World Aquatics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center pl-13 sm:pl-0">
            {athlete ? (
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="h-9 gap-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs rounded-xl"
              >
                <Pencil className="h-3.5 w-3.5" /> Ubah Data Saya
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="h-9 gap-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" /> Lengkapi Data Saya
              </Button>
            )}
          </div>
        </div>
      </div>

      {!athlete ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
          <EmptyState
            icon={<User className="h-10 w-10 text-slate-400" />}
            title="Belum Ada Data Atlet Pribadi"
            description="Silakan lengkapi data perenang Anda (nama lengkap, tanggal lahir, dan klub) agar dapat memilih nomor perlombaan dan mencetak ID Pass Call Room resmi."
            action={
              <Button
                onClick={() => setShowModal(true)}
                className="gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white mt-2"
              >
                <Plus className="h-4 w-4" /> Lengkapi Data Atlet Sekarang
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sisi Kiri: Profil Lengkap Atlet (7 Kolom) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel p-6 border border-slate-200/90 bg-white rounded-2xl shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-200 bg-blue-50/80 font-heading font-black text-xl text-blue-900 shadow-2xs font-mono">
                    {athlete.fullName
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {athlete.athleteNumber}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                          athlete.gender === 'female'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        )}
                      >
                        {athlete.gender === 'female' ? 'PUTRI' : 'PUTRA'}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-xl text-slate-950 uppercase mt-1">
                      {athlete.fullName}
                    </h3>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowModal(true)}
                  className="h-8 gap-1.5 text-xs font-semibold border-slate-300"
                >
                  <Pencil className="h-3.5 w-3.5 text-blue-600" /> Edit
                </Button>
              </div>

              {/* Rincian Grid Informasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Kelompok Umur (KU)</span>
                  <p className="font-black text-blue-950 text-sm">{athlete.ageGroup || 'Umum'}</p>
                  <p className="text-[10px] text-slate-500">Dihitung otomatis standar FINA</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Tanggal Lahir</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {athlete.birthDate
                      ? new Date(athlete.birthDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '–'}
                  </p>
                  <p className="text-[10px] text-slate-500">Verifikasi NIK / Akta Kelahiran</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Klub / Sekolah</span>
                  <p className="font-bold text-slate-900 text-sm truncate">{athlete.schoolName}</p>
                  <p className="text-[10px] text-slate-500">Kontingen Resmi Terdaftar</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Nomor Kontak Wali</span>
                  <p className="font-bold text-slate-900 text-sm font-mono">{athlete.parentPhone || '–'}</p>
                  <p className="text-[10px] text-slate-500">Pemberitahuan panggilan Call Room</p>
                </div>
              </div>

              {/* Data Fisik & Medis */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 text-xs space-y-2">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 text-[11px]">
                  <FileHeart className="h-3.5 w-3.5 text-blue-600" /> Catatan Kesehatan &amp; Fisik
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <p>Tinggi: <b className="font-mono">{athlete.heightCm ? `${athlete.heightCm} cm` : '–'}</b></p>
                  <p>Berat: <b className="font-mono">{athlete.weightKg ? `${athlete.weightKg} kg` : '–'}</b></p>
                </div>
                {athlete.medicalNotes && (
                  <p className="text-[11px] text-slate-600 italic border-t border-blue-200/60 pt-1.5">
                    &quot;{athlete.medicalNotes}&quot;
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                <Link href={`/kartu-peserta?athleteId=${athlete.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs font-bold border-blue-200 text-blue-800 hover:bg-blue-50 shadow-2xs"
                  >
                    <IdCard className="h-4 w-4 text-blue-600" /> Cetak ID Pass Call Room
                  </Button>
                </Link>

                <Link href="/daftar-lomba">
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs"
                  >
                    <CalendarDays className="h-4 w-4" /> Daftar Nomor Lomba &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Nomor Lomba yang Sedang Diikuti (5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <h4 className="font-heading font-black text-sm text-slate-900">
                    Nomor Lomba Diikuti ({registrations.length})
                  </h4>
                </div>

                <Link
                  href="/pendaftaran-saya"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Lihat Status Bayar &rarr;
                </Link>
              </div>

              {registrations.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                  <Trophy className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800 text-xs">Belum Ada Nomor Terdaftar</p>
                  <p className="text-[11px] text-slate-500">
                    Pilih kejuaraan aktif untuk mendaftarkan atlet Anda ke nomor gaya renang yang sesuai.
                  </p>
                  <Link href="/daftar-lomba">
                    <Button size="sm" className="mt-2 text-xs font-bold bg-blue-600 text-white">
                      Pilih Nomor Sekarang
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {registrations.map((reg, idx) => (
                    <div
                      key={reg.id || idx}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 truncate">
                          {reg.compName || 'Nomor Perlombaan'}
                        </p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                          {reg.status || 'TERDAFTAR'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        Kejuaraan: {reg.eventName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Edit / Tambah Atlet */}
      <AthleteFormModal
        open={showModal}
        initial={formValues}
        schools={schools}
        onClose={() => setShowModal(false)}
        onSaved={() => {
          setShowModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
