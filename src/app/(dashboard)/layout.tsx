import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/layout';
import type { UserRole } from '@/types/database';

const ADMIN_ROLES: UserRole[] = [
  'super_admin',
  'event_admin',
  'operator',
  'admin',
  'admin_kejuaraan',
  'admin_keuangan',
];

interface ProfileRole {
  role: UserRole;
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let role: UserRole = 'viewer';
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const fetchedRole =
    (profile as ProfileRole | null)?.role ||
    (user.user_metadata?.role as UserRole) ||
    (user.app_metadata?.role as UserRole);
  if (fetchedRole) {
    role = fetchedRole;
  }
  if (!ADMIN_ROLES.includes(role)) {
    redirect('/dashboard-viewer');
  }

  return <DashboardLayout role={role}>{children}</DashboardLayout>;
}
