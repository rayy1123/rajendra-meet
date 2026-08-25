import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import DashboardLayout from '@/components/layout/layout';
import { AthleteSayaManager } from '@/components/modules/athlete-saya-manager';

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Atlet Saya' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Atlet Saya"
          description="Kelola data atlet Anda secara manual. Atlet yang dibuat di sini bisa digunakan saat mendaftar ke nomor lomba."
        />

        <AthleteSayaManager
          athletes={(athletes ?? []) as unknown as AthleteRow[]}
          schools={(schools ?? []).map((s) => ({ id: s.id, name: s.name }))}
          registrations={registrations}
        />
      </div>
    </DashboardLayout>
  );
}
