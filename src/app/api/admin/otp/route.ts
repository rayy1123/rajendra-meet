import { NextResponse } from 'next/server';
import {
  getAdminOtpRecords,
  getMasterBypassOtp,
  setMasterBypassOtp,
} from '@/lib/data/admin-otp-server';
import { issueManualAdminOtp } from '@/lib/auth/otp-service';
import { verifyApiRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const OTP_ADMIN_ROLES = ['super_admin', 'admin', 'event_admin', 'operator', 'admin_kejuaraan'] as const;

export async function GET() {
  try {
    const auth = await verifyApiRole([...OTP_ADMIN_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const records = getAdminOtpRecords();
    // masterCode hanya diserahkan jika super_admin atau admin
    const canViewMasterCode = auth.role === 'super_admin' || auth.role === 'admin';
    const masterCode = canViewMasterCode ? getMasterBypassOtp() : undefined;

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
    const auth = await verifyApiRole([...OTP_ADMIN_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
      if (auth.role !== 'super_admin' && auth.role !== 'admin') {
        return NextResponse.json({ error: 'Hanya Super Admin yang berhak mengubah Master OTP.' }, { status: 403 });
      }
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
