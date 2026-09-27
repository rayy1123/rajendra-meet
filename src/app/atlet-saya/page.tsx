import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/layout';
import { AthleteSayaManager } from '@/components/modules/athlete-saya-manager';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';
import {
  School,
  CalendarDays,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  IdCard,
  Layers,
  Award,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AthleteRow {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  age_group: string;
  grade_level: string;
  class_name: string;
  school_id: string | null;
  schools: { name: string } | null;
  parent_phone: string;
  medical_notes: string;
  height_cm: number | null;
  weight_kg: number | null;
}

export default async function AtletSayaPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole =
    (profile?.role as string) ||
    (user as any)?.user_metadata?.role ||
    (user as any)?.app_metadata?.role ||
    'viewer';
  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  if (ADMIN_ROLES.includes(userRole)) {
    redirect('/athletes');
  }

  const { data: athletes } = await supabase
    .from('athletes')
    .select(
      'id, full_name, gender, birth_date, age_group, grade_level, class_name, school_id, schools(name), parent_phone, medical_notes, height_cm, weight_kg'
    )
    .eq('owner_id', user.id)
    .order('full_name', { ascending: true });

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  // Ambil atlet milik viewer untuk join registrations (status pendaftaran).
  const myIds = (athletes ?? []).map((a) => a.id);
  const { data: regs } = await supabase
    .from('registrations')
    .select(
      'athlete_id, id, status, competition_events(name, stroke, distance_meters), events(name)'
    )
    .in('athlete_id', myIds.length ? myIds : ['00000000-0000-0000-0000-000000000000']);

  const registrations = (regs ?? []).map((r) => ({
    athlete_id: r.athlete_id,
    id: r.id,
    event_name: r.events?.[0]?.name ?? '',
    comp_name: r.competition_events?.[0]?.name ?? '',
    status: r.status ?? '',
  }));

  // Hitung ringkasan statistik atlet untuk Pelatih / Wali
  const totalAthletes = athletes?.length || 0;
  const maleCount = (athletes || []).filter((a) => a.gender === 'male').length;
  const femaleCount = (athletes || []).filter((a) => a.gender === 'female').length;
  const totalRegistrations = registrations.length;
  const uniqueClubsCount = new Set(
    (athletes || []).map((a: any) => a.schools?.name).filter(Boolean)
  ).size;

  return (
    <DashboardLayout role={userRole}>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Data Atlet Saya' },
          ]}
          className="mb-2"
        />
        <ViewerSubHeader
          title="Data Atlet Saya"
          description="Kelola dan lengkapi data perenang binaan Anda sebelum memilih nomor lomba pada kejuaraan renang Rajendra Meet."
        />

        {/* ── BANNER INFORMASI KHUSUS PELATIH & PENGURUS TIM ── */}
        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/70 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs mt-0.5">
                <School className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    <Sparkles className="h-3 w-3 text-blue-700" />
                    PANDUAN KHUSUS PELATIH &amp; KONTINGEN
                  </span>
                </div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Gunakan halaman ini jika Anda mendaftar sebagai Pelatih atau Pengurus Klub
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  Halaman ini dirancang khusus untuk mempermudah Pelatih dan Official Tim mendaftarkan banyak atlet sekaligus. Seluruh data perenang (nama lengkap, tanggal lahir, dan kelompok umur) yang Anda masukkan di sini akan otomatis siap dipilih saat Anda mendaftar di menu <b>Daftar Nomor Lomba</b> tanpa perlu mengetik ulang.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center pl-14 sm:pl-0">
              <Link href="/daftar-lomba">
                <Button
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs rounded-xl"
                >
                  <CalendarDays className="h-4 w-4" /> Daftar Nomor Lomba &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* 3 Keuntungan & Panduan Praktis Pelatih */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 text-xs">
            <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 1. Deteksi KU Otomatis
              </p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Kelompok Umur (KU I s/d KU V) dihitung presisi dari tanggal lahir atlet sesuai regulasi FINA/World Aquatics.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> 2. Satu Data untuk Semua Event
              </p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Data atlet yang tersimpan dapat didaftarkan berulang kali ke berbagai seri kejuaraan Rajendra Meet.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> 3. ID Pass Call Room Siap Cetak
              </p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Setiap atlet langsung memiliki ID Card resmi ber-QR Code untuk pemindaian petugas Call Room &amp; Juri.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4 STATISTIK OVERVIEW ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Atlet</p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalAthletes} <span className="text-xs font-semibold text-slate-500">Perenang</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Kategori Gender</p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  <span className="text-blue-700">{maleCount} Putra</span> • <span className="text-rose-700">{femaleCount} Putri</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <School className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Afiliasi Kontingen</p>
                <p className="text-2xl font-black text-indigo-950 font-mono mt-0.5">
                  {uniqueClubsCount > 0 ? uniqueClubsCount : 1} <span className="text-xs font-semibold text-slate-500">Klub</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Nomor Terdaftar</p>
                <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                  {totalRegistrations} <span className="text-xs font-semibold text-slate-500">Nomor</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABLE DATA ATLET MANAGER ── */}
        <AthleteSayaManager
          athletes={(athletes ?? []) as unknown as AthleteRow[]}
          schools={(schools ?? []).map((s) => ({ id: s.id, name: s.name }))}
          registrations={registrations}
        />
      </div>
    </DashboardLayout>
  );
}
