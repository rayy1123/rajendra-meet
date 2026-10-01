import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ClipboardCheck } from 'lucide-react';
import { TechnicalChecklistManager } from '@/components/modules/technical-checklist-manager';
import { getChecklistServer } from '@/lib/data/technical-checklist-server';

export const dynamic = 'force-dynamic';

export default async function ChecklistTeknisPage() {
  const { user, supabase } = await requireRole([
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_technical',
    'admin-technical',
  ]);

  // Ambil nama profil pengguna yang login
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const userName = profile?.full_name || (user.user_metadata?.full_name as string) || 'Technical Delegate';
  const userRole = (profile?.role as string) || (user.user_metadata?.role as string) || 'admin_technical';

  // Ambil data checklist teknis
  const initialItems = getChecklistServer();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-0 print:m-0">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Checklist Teknis (TD)' },
        ]}
        className="mb-2 print:hidden"
      />

      <div className="print:hidden">
        <PageHeader
          title="Checklist Teknis & Rekognisi Arena"
          description="Portal operasional Technical Delegate (TD): pantau jadwal rekognisi pemanasan atlet, technical meeting, pengujian sensor touchpad Omega, hingga berita acara pengesahan arena kolam."
          icon={<ClipboardCheck className="h-6 w-6" />}
        />
      </div>

      <TechnicalChecklistManager
        initialItems={initialItems}
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
}
