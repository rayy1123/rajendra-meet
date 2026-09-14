import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserAthleteManager, type UserAthleteItem, type SchoolOption } from '@/components/modules/user-athlete-manager';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AtletSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/atlet-saya');
  }

  // Ambil atlet yang dimiliki oleh user yang sedang login
  const { data: athletes } = await supabase
    .from('athletes')
    .select(`
      id,
      athlete_number,
      full_name,
      gender,
      birth_date,
      grade_level,
      class_name,
      age_group,
      school_id,
      schools ( id, name )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Ambil daftar sekolah / klub untuk pilihan
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'Pendaftaran', href: '/daftar-lomba' },
          { label: 'Data Diri Atlet' },
        ]}
        className="mb-2"
      />
      <PageHeader
        title="Data Diri Atlet Saya"
        description="Kelola profil atlet Anda. Data ini akan digunakan saat mendaftarkan nomor lomba kejuaraan."
        icon={<Users className="h-6 w-6" />}
      />

      <UserAthleteManager
        initialAthletes={(athletes || []) as unknown as UserAthleteItem[]}
        schools={(schools || []) as SchoolOption[]}
        userId={user.id}
      />
    </div>
  );
}
