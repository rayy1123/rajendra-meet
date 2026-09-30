import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { RegistrationWizard, type CompEventDTO, type AthleteDTO } from '@/components/modules/registration-wizard';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';
import { getSchoolsServer } from '@/lib/data/schools-server';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Izinkan admin/viewer mengakses halaman daftar lomba tanpa .eq('is_published', true) jika event ada
  let event: any = null;
  const { getEventSettings } = await import('@/lib/data/event-settings-server');
  const storeSettings = getEventSettings(id);

  const { data: fullEvent } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type, description')
    .eq('id', id)
    .maybeSingle();

  let descSettings: any = {};
  if (fullEvent?.description) {
    try {
      const parsed = JSON.parse(fullEvent.description);
      if (parsed && typeof parsed === 'object') {
        descSettings = parsed;
      }
    } catch {
      // not json
    }
  }

  if (fullEvent || storeSettings) {
    event = {
      ...storeSettings,
      ...(fullEvent || {}),
      ...descSettings,
      // Pengaturan dari store atau description diprioritaskan
      fee_per_event: descSettings?.fee_per_event ?? storeSettings?.fee_per_event ?? 50000,
      fee_calculation_mode: descSettings?.fee_calculation_mode ?? storeSettings?.fee_calculation_mode ?? 'per_event',
      flat_package_limit: descSettings?.flat_package_limit ?? storeSettings?.flat_package_limit ?? 3,
      flat_package_price: descSettings?.flat_package_price ?? storeSettings?.flat_package_price ?? 275000,
      extra_fee_per_event: descSettings?.extra_fee_per_event ?? storeSettings?.extra_fee_per_event ?? 80000,
      use_unique_code: descSettings?.use_unique_code ?? storeSettings?.use_unique_code ?? true,
      unique_code_mode: descSettings?.unique_code_mode || storeSettings?.unique_code_mode || 'random_3_digit',
      unique_code_fixed: descSettings?.unique_code_fixed ?? storeSettings?.unique_code_fixed ?? 0,
      unique_code_min: descSettings?.unique_code_min ?? storeSettings?.unique_code_min ?? 100,
      unique_code_max: descSettings?.unique_code_max ?? storeSettings?.unique_code_max ?? 999,
      bank_name: descSettings?.bank_name || storeSettings?.bank_name || 'Bank Central Asia (BCA)',
      bank_account_no: descSettings?.bank_account_no || storeSettings?.bank_account_no || '',
      bank_account_name: descSettings?.bank_account_name || storeSettings?.bank_account_name || 'Panitia Pelaksana Renang',
    };
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="pub-card p-12 text-center">
          <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Kejuaraan tidak tersedia</h3>
          <p className="mt-1 text-sm text-[var(--m-muted)]">Kejuaraan ini belum dipublikasikan atau tidak ditemukan.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name, age_group')
    .eq('event_id', id)
    .order('distance_meters', { ascending: true });

  // Atlet tersimpan (jika admin: tampilkan seluruh atlet kejuaraan untuk pilihan pendaftaran manual panitia)
  let athletesQuery = supabase
    .from('athletes')
    .select('id, full_name, birth_date, gender, grade_level, school_id, schools(name)');

  if (!isAdmin) {
    athletesQuery = athletesQuery.eq('owner_id', user.id);
  }

  const { data: myAthletes } = await athletesQuery
    .order('full_name')
    .limit(500);

  const existingAthletes: AthleteDTO[] = (myAthletes ?? []).map((a: any) => {
    const rawSchool = Array.isArray(a.schools) ? a.schools[0] : a.schools;
    return {
      id: a.id,
      full_name: a.full_name,
      birth_date: a.birth_date,
      gender: a.gender === 'female' ? 'female' : 'male',
      grade_level: a.grade_level ?? '',
      school_id: a.school_id,
      school_name: rawSchool?.name || '',
    };
  });

  // Ambil master database sekolah / klub yang terdaftar
  const schools = await getSchoolsServer();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard-viewer' },
            { label: 'Daftar Lomba', href: '/daftar-lomba' },
            { label: event.name },
          ]}
          className="mb-2"
        />
        <ViewerSubHeader
          title={`Daftar: ${event.name}`}
          description="Isi data atlet, pilih nomor lomba, lalu kirim bukti pembayaran untuk diverifikasi panitia."
        />
        <RegistrationWizard
          eventId={event.id}
          event={event as any}
          competitionEvents={(compEvents ?? []) as CompEventDTO[]}
          existingAthletes={existingAthletes}
          schools={schools}
          isAdmin={isAdmin}
        />
      </div>
    </DashboardLayout>
  );
}
