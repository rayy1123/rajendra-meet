import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateSessionId,
  setActiveSession,
  clearActiveSession,
  getActiveSession,
} from '@/lib/auth/session-limiter';

/**
 * Endpoint Pengelolaan Sesi Tunggal / Pembatasan Konkurensi Login.
 * POST: Daftarkan session aktif baru saat user login (menggantikan session lama).
 * GET: Cek status session aktif saat ini.
 * DELETE: Bersihkan session aktif saat logout.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let targetUserId = user?.id;

    // Jika client mengirim userId saat login
    if (!targetUserId) {
      try {
        const body = await request.json();
        if (body?.userId) targetUserId = body.userId;
      } catch {
        // body may be empty
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Pengguna tidak terautentikasi.' }, { status: 401 });
    }

    const sessionId = generateSessionId();
    await setActiveSession(targetUserId, sessionId);

    const response = NextResponse.json({
      success: true,
      message: 'Sesi aktif berhasil didaftarkan.',
      sessionId,
    });

    response.cookies.set('scms_session_id', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan sesi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const activeSession = await getActiveSession(user.id);
    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      activeSession,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memeriksa sesi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await clearActiveSession(user.id);
    }

    const response = NextResponse.json({ success: true, message: 'Sesi dibersihkan.' });
    response.cookies.set('scms_session_id', '', {
      path: '/',
      httpOnly: true,
      maxAge: 0,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus sesi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
