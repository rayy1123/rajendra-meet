import { NextResponse } from 'next/server';
import {
  getAllLettersServer,
  getLetterByIdServer,
  saveLetterServer,
  deleteLetterServer,
} from '@/lib/data/letters-server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const letter = await getLetterByIdServer(id);
      if (!letter) return NextResponse.json({ error: 'Surat tidak ditemukan.' }, { status: 404 });
      return NextResponse.json({ success: true, data: letter });
    }

    const letters = await getAllLettersServer();
    return NextResponse.json({ success: true, data: letters });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data surat.';
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
    const { action, letter, id } = body;

    if (action === 'save') {
      const res = await saveLetterServer(letter);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.letter });
    }

    if (action === 'delete') {
      const res = await deleteLetterServer(id);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat menyimpan surat.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
