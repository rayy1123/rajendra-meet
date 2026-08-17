import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { RegistrationWizard, type CompEventDTO, type AthleteDTO } from '@/components/modules/registration-wizard';
import { Waves } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!event) {
    return (
      <PublicShell title="Kejuaraan tidak ditemukan">
        <div className="pub-container pb-16">
          <div className="pub-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Kejuaraan tidak tersedia</h3>
            <Link href="/daftar-lomba" className="pub-btn-primary mt-4 inline-flex">Kembali ke Daftar Lomba</Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', id)
    .order('distance_meters', { ascending: true });

  // Atlet milik user di event ini = atlet dari registrasinya
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const existingAthletes: AthleteDTO[] = [];
  if (user) {
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
    <PublicShell title={`Daftar: ${event.name}`} subtitle="Isi data atlet, pilih nomor lomba, lalu kirim bukti pembayaran untuk diverifikasi panitia.">
      <div className="pub-container pb-16">
        {!user ? (
          <div className="pub-card p-10 text-center">
            <h3 className="font-semibold text-[var(--m-ink)]">Masuk untuk mendaftar</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">Anda perlu login sebagai penonton/viewer untuk mendaftarkan atlet.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href={`/login?redirect=/daftar-lomba/${id}`} className="pub-btn-primary">Masuk</Link>
              <Link href="/register" className="pub-btn-ghost">Daftar</Link>
            </div>
          </div>
        ) : (
          <RegistrationWizard
            eventId={event.id}
            competitionEvents={(compEvents ?? []) as CompEventDTO[]}
            existingAthletes={existingAthletes}
          />
        )}
      </div>
    </PublicShell>
  );
}
