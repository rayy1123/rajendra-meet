import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ProfileManager } from '@/components/modules/profile-manager';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url, username')
    .eq('id', user.id)
    .single();

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
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const dashboardHref = isAdmin ? '/dashboard' : '/dashboard-viewer';
  const dashboardLabel = isAdmin ? 'Dasbor Panitia' : 'Dasbor';

  return (
    <DashboardLayout role={userRole}>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: dashboardLabel, href: dashboardHref },
            { label: 'Profil' },
          ]}
          className="mb-2"
        />
        <ViewerSubHeader title="Profil" description="Kelola data akun Anda." />

        <ProfileManager
          userId={user.id}
          email={user.email ?? ''}
          fullName={profile?.full_name ?? ''}
          username={profile?.username ?? ''}
          role={profile?.role ?? 'viewer'}
          avatarUrl={profile?.avatar_url ?? ''}
        />
      </div>
    </DashboardLayout>
  );
}
