import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/layout';
import type { UserRole } from '@/types/database';

const ADMIN_ROLES: UserRole[] = ['super_admin', 'event_admin', 'operator'];

interface ProfileRole {
  role: UserRole;
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proxy sudah mengarahkan yang belum login ke /login.
  // Yang sudah login tapi bukan admin diarahkan ke halaman utama.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile as ProfileRole | null)?.role;
    if (!role || !ADMIN_ROLES.includes(role)) {
      redirect('/');
    }
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
