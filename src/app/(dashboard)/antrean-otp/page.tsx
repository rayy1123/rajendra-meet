import { createClient } from '@/lib/supabase/server';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AdminOtpManager } from '@/components/modules/admin-otp-manager';
import { getAdminOtpRecords, getMasterBypassOtp } from '@/lib/data/admin-otp-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AntreanOtpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const initialRecords = getAdminOtpRecords();
  const initialMasterCode = getMasterBypassOtp();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Antrean Kode OTP' },
          ]}
          className="mb-2"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl font-heading">
            Antrean Kode OTP Pendaftaran
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sub halaman khusus penanganan kondisi darurat saat kuota email pengiriman Brevo habis atau email peserta terkendala.
          </p>
        </div>
      </div>

      <AdminOtpManager initialRecords={initialRecords} initialMasterCode={initialMasterCode} />
    </div>
  );
}
