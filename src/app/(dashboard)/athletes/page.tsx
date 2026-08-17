import { createClient } from '@/lib/supabase/server';
import { AthleteManager, type AthleteRow, type Opt } from '@/components/modules/athlete-manager';
import { PageHeader } from '@/components/ui/page-header';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AthletesPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

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
      schools ( name )
    `)
    .order('full_name', { ascending: true });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Master Data Atlet"
        description="Kelompok Umur (KU) dihitung otomatis dari tanggal lahir saat disimpan."
        icon={<Users className="h-6 w-6" />}
      />

      <AthleteManager
        athletes={(athletes || []) as unknown as AthleteRow[]}
        schools={(schools || []) as Opt[]}
        events={(events || []) as Opt[]}
      />
    </div>
  );
}
