import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Waves } from 'lucide-react';
import Link from 'next/link';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';
import { ViewerEventCard } from '@/components/modules/viewer-event-card';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaPage() {
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
        <ViewerSubHeader
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
              <ViewerEventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
