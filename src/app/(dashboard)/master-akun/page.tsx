import { createClient } from '@/lib/supabase/server';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { MasterAkunManager } from '@/components/modules/master-akun-manager';
import { getAllAccountsServer } from '@/lib/data/accounts-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MasterAkunPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = (profile?.role as string) || (user.user_metadata?.role as string) || 'viewer';
  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
    'admin_technical',
    'admin-technical',
  ];

  if (!ADMIN_ROLES.includes(userRole)) {
    redirect('/dashboard-viewer');
  }

  // Ambil seluruh akun & daftar sekolah/klub
  const [accounts, { data: schoolsData }] = await Promise.all([
    getAllAccountsServer(),
    supabase.from('schools').select('id, name, city').order('name', { ascending: true }),
  ]);

  const schools = (schoolsData || []).map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Master Akun & Otoritas' },
          ]}
          className="mb-2"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl font-heading">
            Master Akun &amp; Otoritas Hak Akses
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pusat manajemen akun web, penerbitan kredensial panitia lomba (Pencatat Waktu, Juknis, Keuangan), dan pembagian peran granular.
          </p>
        </div>
      </div>

      <MasterAkunManager initialAccounts={accounts} schools={schools} />
    </div>
  );
}
