import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ProfileManager } from '@/components/modules/profile-manager';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Profil' },
          ]}
          className="mb-2"
        />
        <PageHeader title="Profil" description="Kelola data akun Anda." />

        <ProfileManager
          email={user.email ?? ''}
          fullName={profile?.full_name ?? ''}
          role={profile?.role ?? 'viewer'}
        />
      </div>
    </DashboardLayout>
  );
}
