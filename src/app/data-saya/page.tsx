import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import DashboardLayout from '@/components/layout/layout';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';
import {
  DataSayaManager,
  type DataSayaAthlete,
  type DataSayaRegistration,
} from '@/components/modules/data-saya-manager';

export const dynamic = 'force-dynamic';

export default async function DataSayaPage() {
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
    redirect('/dashboard');
  }

  // 1. Ambil data atlet pribadi yang dimiliki akun ini
  const { data: rawAthlete } = await supabase
    .from('athletes')
    .select(`
      id,
      full_name,
      athlete_number,
      gender,
      birth_date,
      age_group,
      grade_level,
      class_name,
      school_id,
      schools (
        id,
        name
      ),
      parent_phone,
      medical_notes,
      height_cm,
      weight_kg
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Ambil master data sekolah/klub untuk opsi
  const { data: schoolsData } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  const schools = (schoolsData || []).map((s) => ({ id: s.id, name: s.name }));

  let athlete: DataSayaAthlete | null = null;
  let registrations: DataSayaRegistration[] = [];

  if (rawAthlete) {
    const rawSchool = Array.isArray(rawAthlete.schools)
      ? rawAthlete.schools[0]
      : rawAthlete.schools;

    athlete = {
      id: rawAthlete.id,
      fullName: rawAthlete.full_name,
      athleteNumber: rawAthlete.athlete_number,
      gender: rawAthlete.gender,
      birthDate: rawAthlete.birth_date,
      ageGroup: rawAthlete.age_group || 'Umum',
      gradeLevel: rawAthlete.grade_level || '',
      className: rawAthlete.class_name || '',
      schoolId: rawAthlete.school_id,
      schoolName: rawSchool?.name || 'Klub Mandiri',
      parentPhone: rawAthlete.parent_phone || '',
      medicalNotes: rawAthlete.medical_notes || '',
      heightCm: rawAthlete.height_cm,
      weightKg: rawAthlete.weight_kg,
    };

    // Ambil registrasi nomor lomba atlet ini
    const { data: rawRegs } = await supabase
      .from('registrations')
      .select(`
        id,
        seed_time_ms,
        competition_events (
          name
        ),
        events (
          name
        )
      `)
      .eq('athlete_id', rawAthlete.id)
      .order('created_at', { ascending: false });

    registrations = (rawRegs || []).map((r: any) => ({
      id: r.id,
      eventName: r.events?.[0]?.name || r.events?.name || 'Kejuaraan Renang',
      compName: r.competition_events?.[0]?.name || r.competition_events?.name || 'Nomor Perlombaan',
      status: 'Terdaftar',
      paymentStatus: 'Terverifikasi',
      seedTimeMs: r.seed_time_ms || null,
    }));
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Data Saya' },
          ]}
          className="mb-2"
        />

        <ViewerSubHeader
          title="Data Diri Atlet"
          description="Profil data perenang pribadi Anda untuk pendaftaran mandiri pada kejuaraan renang Rajendra Swim System."
        />

        <DataSayaManager
          athlete={athlete}
          schools={schools}
          registrations={registrations}
        />
      </div>
    </DashboardLayout>
  );
}
