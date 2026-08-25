import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { RegistrationWizard, type CompEventDTO, type AthleteDTO } from '@/components/modules/registration-wizard';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: event } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type')
    .eq('id', id)
    .eq('is_published', true)
    .single();

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
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', id)
    .order('distance_meters', { ascending: true });

  // Atlet yang sudah terdaftar di event ini (milik viewer).
  const existingAthletes: AthleteDTO[] = [];
  {
    const { data: regs } = await supabase
      .from('registrations')
      .select('athlete_id, athletes(id, full_name, birth_date, gender, grade_level, school_id)')
      .eq('event_id', id)
      .eq('registrant_id', user.id);
    const seen = new Set<string>();
    for (const r of regs ?? []) {
      const a = (r as unknown as { athletes: AthleteDTO | null }).athletes;
      if (a && !seen.has(a.id)) {
        seen.add(a.id);
        existingAthletes.push(a);
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Daftar Lomba', href: '/daftar-lomba' },
            { label: event.name },
          ]}
          className="mb-2"
        />
        <PageHeader
          title={`Daftar: ${event.name}`}
          description="Isi data atlet, pilih nomor lomba, lalu kirim bukti pembayaran untuk diverifikasi panitia."
        />
        <RegistrationWizard
          eventId={event.id}
          competitionEvents={(compEvents ?? []) as CompEventDTO[]}
          existingAthletes={existingAthletes}
        />
      </div>
    </DashboardLayout>
  );
}
