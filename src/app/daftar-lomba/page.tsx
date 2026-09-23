import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Waves } from 'lucide-react';
import Link from 'next/link';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';
import { ViewerEventCard } from '@/components/modules/viewer-event-card';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

export default async function DaftarLombaPage() {
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
  if (ADMIN_ROLES.includes(userRole)) {
    redirect('/events');
  }

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
          <EmptyState
            icon={<Waves className="h-6 w-6 text-primary" />}
            title="Belum ada kejuaraan dibuka"
            description="Panitia belum mempublikasikan kejuaraan yang dibuka pendaftarannya."
          />
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
