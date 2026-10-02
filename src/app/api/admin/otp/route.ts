import { NextResponse } from 'next/server';
import {
  getAdminOtpRecords,
  getMasterBypassOtp,
  setMasterBypassOtp,
} from '@/lib/data/admin-otp-server';
import { issueManualAdminOtp } from '@/lib/auth/otp-service';
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
    const masterCode = getMasterBypassOtp();

    return NextResponse.json({
      success: true,
      data: records,
      masterCode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data OTP.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sesi login berakhir.' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create_manual') {
      const { email, fullName, customCode } = body;
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Alamat email wajib valid.' }, { status: 400 });
      }
      const res = await issueManualAdminOtp({ email, fullName, customCode });
      return NextResponse.json({ success: true, code: res.code });
    }

    if (action === 'update_master_code') {
      const { newMasterCode } = body;
      if (!newMasterCode || newMasterCode.length < 4) {
        return NextResponse.json({ error: 'Master OTP minimal 4 digit angka.' }, { status: 400 });
      }
      const saved = setMasterBypassOtp(newMasterCode);
      return NextResponse.json({ success: true, masterCode: saved });
    }

    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
