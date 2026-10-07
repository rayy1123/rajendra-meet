import { NextResponse } from 'next/server';
import {
  getSchedulesServer,
  saveScheduleServer,
  deleteScheduleServer,
} from '@/lib/data/schedules-server';
import { verifyApiRole } from '@/lib/auth';

const SCHEDULE_ROLES = [
  'super_admin',
  'admin',
  'event_admin',
  'operator',
  'admin_technical',
  'admin-technical',
  'admin_kejuaraan',
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || undefined;
    const items = getSchedulesServer(eventId);
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data jadwal.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyApiRole([...SCHEDULE_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { time, category, title, description, location, status, eventId, id } = body;

    if (!time || !title) {
      return NextResponse.json(
        { error: 'Waktu dan judul agenda wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = saveScheduleServer({
      id: id || undefined,
      time: String(time).trim(),
      category: String(category || 'Agenda Umum').trim(),
      title: String(title).trim(),
      description: String(description || '').trim(),
      location: String(location || '').trim(),
      status: (status as any) || 'upcoming',
      eventId: eventId || null,
    });

    return NextResponse.json(
      { success: true, message: 'Jadwal berhasil disimpan.', data: saved },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan agenda.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyApiRole([...SCHEDULE_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID jadwal wajib disertakan.' }, { status: 400 });
    }

    const ok = deleteScheduleServer(id);
    if (!ok) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Jadwal berhasil dihapus.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus jadwal.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
