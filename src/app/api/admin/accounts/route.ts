import { NextResponse } from 'next/server';
import {
  getAllAccountsServer,
  createCommitteeAccountServer,
  createUserAccountServer,
  updateAccountAuthorityServer,
  deleteAccountServer,
} from '@/lib/data/accounts-server';
import { verifyApiRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ADMIN_ALLOWED_ROLES = ['super_admin', 'admin', 'admin_kejuaraan'] as const;

export async function GET() {
  try {
    const auth = await verifyApiRole([...ADMIN_ALLOWED_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const accounts = await getAllAccountsServer();
    return NextResponse.json({ success: true, data: accounts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil master akun.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyApiRole([...ADMIN_ALLOWED_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create_committee') {
      const res = await createCommitteeAccountServer(body);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.account });
    }

    if (action === 'create_user') {
      const res = await createUserAccountServer(body);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.account });
    }

    if (action === 'update_authority') {
      const res = await updateAccountAuthorityServer(body);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_account') {
      const res = await deleteAccountServer(body.accountId);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
