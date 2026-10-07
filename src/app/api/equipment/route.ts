import { NextResponse } from 'next/server';
import {
  getEquipmentServer,
  saveEquipmentServer,
  deleteEquipmentServer,
} from '@/lib/data/equipment-server';
import { verifyApiRole } from '@/lib/auth';

const EQUIPMENT_ROLES = [
  'super_admin',
  'admin',
  'admin_technical',
  'admin-technical',
  'event_admin',
  'operator',
] as const;

export async function GET() {
  try {
    const list = await getEquipmentServer();
    return NextResponse.json({ success: true, data: list }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data peralatan.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyApiRole([...EQUIPMENT_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, name, location, category, status, due_date, technician, note } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama peralatan atau logistik wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = await saveEquipmentServer({
      id: id || undefined,
      name: name.trim(),
      location: (location || '').trim(),
      category: category || 'Peralatan Umum',
      status: status || 'scheduled',
      due_date: due_date || null,
      technician: technician ? technician.trim() : null,
      note: note ? note.trim() : null,
    });

    return NextResponse.json(
      { success: true, message: 'Data peralatan berhasil disimpan.', data: saved },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan peralatan.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyApiRole([...EQUIPMENT_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID peralatan wajib disertakan.' }, { status: 400 });
    }

    const ok = await deleteEquipmentServer(id);
    if (!ok) {
      return NextResponse.json({ error: 'Peralatan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Peralatan berhasil dihapus.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus peralatan.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
