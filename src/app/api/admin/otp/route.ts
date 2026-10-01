import { NextResponse } from 'next/server';
import { getAdminOtpRecords } from '@/lib/data/admin-otp-server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verifikasi sesi login (hanya admin/operator/panitia yang berhak melihat antrean OTP)
    if (!user) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses.' }, { status: 401 });
    }

    const records = getAdminOtpRecords();
    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data OTP.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
