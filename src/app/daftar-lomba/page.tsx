import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { MapPin, CalendarDays, Waves, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaPage() {
  // Syarat login: requireUser akan redirect ke /login kalau belum masuk.
  const { supabase } = await requireUser();

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type')
    .eq('is_published', true)
    .order('start_date', { ascending: false });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Daftar Lomba' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Daftar Lomba"
          description="Pilih kejuaraan untuk mendaftarkan atlet Anda ke nomor-nomor lomba. Pembayaran akan diverifikasi oleh panitia."
        />

        {!events || events.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada kejuaraan dibuka</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Panitia belum mempublikasikan kejuaraan yang dibuka pendaftarannya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="pub-card flex flex-col gap-4 p-5 transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-[var(--m-ink)] leading-snug">{event.name}</h3>
                  <span className="pub-chip shrink-0">{event.lane_count || 8} lintasan</span>
                </div>
                <div className="space-y-1.5 text-sm text-[var(--m-muted)]">
                  {event.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--m-aqua)]" /> {event.location}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[var(--m-aqua)]" />
                    {event.start_date} s/d {event.end_date}
                  </p>
                  {event.pool_type && (
                    <p className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-[var(--m-aqua)]" /> {event.pool_type}
                    </p>
                  )}
                </div>
                <Link href={`/daftar-lomba/${event.id}`} className="pub-btn-primary mt-auto w-full">
                  Daftar Atlet <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
