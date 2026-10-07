import { NextResponse } from 'next/server';
import {
  getChecklistServer,
  updateChecklistItemServer,
  addChecklistItemServer,
  readLocalChecklist,
  writeLocalChecklist,
  type ChecklistCategory,
  type ChecklistStatus,
} from '@/lib/data/technical-checklist-server';
import { verifyApiRole } from '@/lib/auth';

const TD_ALLOWED_ROLES = [
  'super_admin',
  'admin',
  'admin_technical',
  'admin-technical',
  'event_admin',
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const items = getChecklistServer(category);
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data checklist teknis.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await verifyApiRole([...TD_ALLOWED_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, status, notes, verifiedBy } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID checklist wajib disertakan.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status as ChecklistStatus;
    if (typeof notes === 'string') updates.notes = notes.trim();
    if (verifiedBy !== undefined) {
      updates.verifiedBy = verifiedBy || auth.user.email;
      updates.verifiedAt = verifiedBy ? new Date().toISOString() : null;
    }

    const updated = updateChecklistItemServer(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Item checklist tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Checklist berhasil diperbarui.', data: updated },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui item checklist.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyApiRole([...TD_ALLOWED_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { title, description, category, scheduledTime, pic, location, status, notes } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Judul dan kategori checklist wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = addChecklistItemServer({
      title: String(title).trim(),
      description: String(description || '').trim(),
      category: category as ChecklistCategory,
      scheduledTime: scheduledTime ? String(scheduledTime).trim() : undefined,
      pic: String(pic || auth.user.email).trim(),
      location: String(location || 'Arena Kolam').trim(),
      status: (status as ChecklistStatus) || 'pending',
      notes: notes ? String(notes).trim() : undefined,
      verifiedBy: null,
      verifiedAt: null,
    });

    return NextResponse.json(
      { success: true, message: 'Item checklist baru berhasil ditambahkan.', data: saved },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menambahkan item checklist.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Reset data ke default jika diperlukan
export async function PUT() {
  try {
    const auth = await verifyApiRole(['super_admin', 'admin']);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const defaultData = readLocalChecklist();
    writeLocalChecklist(defaultData);
    return NextResponse.json({ success: true, message: 'Data checklist siap.' }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses request.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
