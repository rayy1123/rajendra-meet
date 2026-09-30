import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  ProfileManager,
  type ProfileAthleteItem,
} from '@/components/modules/profile-manager';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';
import { getKuCode } from '@/lib/age-category';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url, username, created_at')
    .eq('id', user.id)
    .single();

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
    'admin_technical',
    'admin-technical',
  ];
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const dashboardHref = isAdmin ? '/dashboard' : '/dashboard-viewer';
  const dashboardLabel = isAdmin ? 'Dasbor Panitia' : 'Dasbor Peserta';

  // 1. Ambil data atlet binaan milik user
  const { data: athletesData } = await supabase
    .from('athletes')
    .select(`
      id,
      full_name,
      athlete_number,
      gender,
      birth_date,
      age_group,
      grade_level,
      schools (
        name
      )
    `)
    .eq('owner_id', user.id)
    .order('full_name', { ascending: true });

  const athletes: ProfileAthleteItem[] = (athletesData || []).map((a: any) => {
    const rawSchool = Array.isArray(a.schools) ? a.schools[0] : a.schools;
    return {
      id: a.id,
      fullName: a.full_name,
      athleteNumber: a.athlete_number || '–',
      gender: a.gender || 'male',
      ageGroup: a.birth_date ? getKuCode(a.birth_date) : (a.age_group || a.grade_level || 'Umum'),
      schoolName: rawSchool?.name || 'Klub Mandiri',
    };
  });

  const myAthleteIds = athletes.map((a) => a.id);

  // 2. Ambil total pendaftaran nomor lomba
  let regQuery = supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true });

  if (myAthleteIds.length > 0) {
    regQuery = regQuery.or(`registrant_id.eq.${user.id},athlete_id.in.(${myAthleteIds.join(',')})`);
  } else {
    regQuery = regQuery.eq('registrant_id', user.id);
  }
  const { count: regCount } = await regQuery;

  // 3. Ambil jumlah podium / prestasi yang berhasil diraih
  let podiumCount = 0;
  if (myAthleteIds.length > 0) {
    const { count } = await supabase
      .from('results')
      .select('id, heat_assignments!inner(registrations!inner(athlete_id))', {
        count: 'exact',
        head: true,
      })
      .in('heat_assignments.registrations.athlete_id', myAthleteIds)
      .eq('status', 'finished');
    podiumCount = count || 0;
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="no-print">
          <Breadcrumb
            items={[
              { label: dashboardLabel, href: dashboardHref },
              { label: 'Profil Pengguna' },
            ]}
            className="mb-2"
          />
          <ViewerSubHeader
            title="Profil Pengguna"
            description="Kelola data penanggung jawab, perbarui kata sandi, dan pantau ringkasan atlet binaan Anda."
          />
        </div>

        <ProfileManager
          userId={user.id}
          email={user.email ?? ''}
          fullName={profile?.full_name ?? ''}
          username={profile?.username ?? ''}
          role={profile?.role ?? 'viewer'}
          avatarUrl={profile?.avatar_url ?? ''}
          createdAt={profile?.created_at}
          athletes={athletes}
          registrationCount={regCount || 0}
          podiumCount={podiumCount}
        />
      </div>
    </DashboardLayout>
  );
}
