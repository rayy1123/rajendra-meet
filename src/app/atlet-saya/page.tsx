import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AthleteSayaManager } from '@/components/modules/athlete-saya-manager';

export const dynamic = 'force-dynamic';

interface AthleteRow {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  grade_level: string;
  class_name: string;
  school_id: string | null;
  schools: { name: string } | null;
}

export default async function AtletSayaPage() {
  const { supabase, user } = await requireUser();

  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, full_name, gender, birth_date, grade_level, class_name, school_id, schools(name)')
    .eq('owner_id', user.id)
    .order('full_name', { ascending: true });

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Atlet Saya' }]} className="mb-2" />
      <PageHeader
        title="Atlet Saya"
        description="Kelola data atlet Anda secara manual. Atlet yang dibuat di sini bisa digunakan saat mendaftar ke nomor lomba."
      />

      <AthleteSayaManager
        athletes={(athletes ?? []) as unknown as AthleteRow[]}
        schools={(schools ?? []).map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
