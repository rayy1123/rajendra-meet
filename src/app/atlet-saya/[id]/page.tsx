import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AthleteProfileActions } from '@/components/modules/athlete-profile-actions';
import type { AthleteFormValues } from '@/components/modules/athlete-form-modal';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

function age(birth: string): number {
  if (!birth) return 0;
  const d = new Date(birth);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: athlete } = await supabase
    .from('athletes')
    .select(
      'id, full_name, gender, birth_date, age_group, grade_level, class_name, school_id, schools(name), parent_phone, medical_notes, height_cm, weight_kg, photo_url'
    )
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (!athlete) notFound();

  const { data: regs } = await supabase
    .from('registrations')
    .select('id, status, competition_events(name, stroke, distance_meters), events(name)')
    .eq('athlete_id', id)
    .eq('registrant_id', user.id);

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  const formValues: AthleteFormValues = {
    id: athlete.id,
    full_name: athlete.full_name,
    gender: athlete.gender,
    birth_date: athlete.birth_date,
    grade_level: athlete.grade_level,
    class_name: athlete.class_name,
    school_id: athlete.school_id ?? '',
    parent_phone: athlete.parent_phone,
    medical_notes: athlete.medical_notes,
    height_cm: athlete.height_cm?.toString() ?? '',
    weight_kg: athlete.weight_kg?.toString() ?? '',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Atlet Saya', href: '/atlet-saya' },
            { label: athlete.full_name },
          ]}
          className="mb-2"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-primary/10">
              {athlete.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={athlete.photo_url} alt={athlete.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold text-primary">
                  {initials(athlete.full_name)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--m-ink)]">{athlete.full_name}</h1>
              <p className="text-xs text-[var(--m-muted)]">
                {athlete.gender === 'female' ? 'Putri' : 'Putra'}
                {athlete.grade_level ? ` · ${athlete.grade_level}` : ''}
                {athlete.class_name ? ` ${athlete.class_name}` : ''} · {age(athlete.birth_date)} thn
                {athlete.age_group ? ` · ${athlete.age_group}` : ''}
              </p>
            </div>
          </div>
          <AthleteProfileActions
            id={athlete.id}
            userId={user.id}
            initial={formValues}
            photoUrl={athlete.photo_url ?? ''}
            schools={(schools ?? []).map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="pub-card p-6">
            <h3 className="mb-3 font-semibold text-[var(--m-ink)]">Data Atlet</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--m-muted)]">Sekolah / Klub</dt>
                <dd className="font-medium">{athlete.schools?.[0]?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--m-muted)]">Tanggal Lahir</dt>
                <dd className="font-medium">{athlete.birth_date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--m-muted)]">Kelompok Usia</dt>
                <dd className="font-medium">{athlete.age_group || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--m-muted)]">Tinggi / Berat</dt>
                <dd className="font-medium">
                  {athlete.height_cm ?? '—'} cm / {athlete.weight_kg ?? '—'} kg
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--m-muted)]">Kontak Orang Tua</dt>
                <dd className="font-medium">{athlete.parent_phone || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--m-muted)]">Catatan Medis</dt>
                <dd className="font-medium">{athlete.medical_notes || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="pub-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--m-ink)]">Status Pendaftaran</h3>
              <Link href="/daftar-lomba" className="text-xs font-semibold text-primary hover:underline">
                + Daftar Lomba
              </Link>
            </div>
            {!regs || regs.length === 0 ? (
              <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-[var(--m-muted)]">
                Belum terdaftar di nomor lomba mana pun.
              </div>
            ) : (
              <div className="space-y-2">
                {regs.map((r) => (
                  <div key={r.id} className="rounded-lg border px-3 py-2 text-sm">
                    <div className="font-medium">{r.competition_events?.[0]?.name ?? 'Nomor lomba'}</div>
                    <div className="text-xs text-[var(--m-muted)]">
                      {r.events?.[0]?.name} · <span className="capitalize">{r.status?.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link
          href="/atlet-saya"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--m-muted)] hover:text-[var(--m-ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Atlet Saya
        </Link>
      </div>
    </DashboardLayout>
  );
}
