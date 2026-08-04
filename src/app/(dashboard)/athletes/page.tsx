import { createClient } from '@/lib/supabase/server';
import { AthleteManager } from '@/components/modules/athlete-manager';

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Master Data Atlet</h1>
          <p className="text-sm text-muted-foreground">
            Kelompok Umur (KU) dihitung otomatis dari tanggal lahir saat disimpan.
          </p>
        </div>
      </div>

      <AthleteManager
        athletes={(athletes || []) as any}
        schools={(schools || []) as any}
        events={(events || []) as any}
      />
    </div>
  );
}
