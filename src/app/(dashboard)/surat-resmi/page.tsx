import { createClient } from '@/lib/supabase/server';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { OfficialLetterGenerator } from '@/components/modules/official-letter-generator';
import { getAllLettersServer } from '@/lib/data/letters-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OfficialLetterPage() {
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

  const letters = await getAllLettersServer();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Surat Resmi & Generator' },
          ]}
          className="mb-2"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl font-heading">
            Generator Surat Resmi Kejuaraan
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mesin percetakan surat resmi A4: kop surat kustom, dual tanda tangan, stempel basah transparan, dan banner kontak darurat panitia.
          </p>
        </div>
      </div>

      <OfficialLetterGenerator initialLetters={letters} />
    </div>
  );
}
