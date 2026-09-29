import { NextResponse } from 'next/server';
import { getSchoolsServer, saveSchoolServer } from '@/lib/data/schools-server';

export async function GET() {
  try {
    const list = await getSchoolsServer();
    return NextResponse.json(list, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body?.name?.toString()?.trim();
    const city = body?.city?.toString()?.trim() || null;
    const coach_name = body?.coach_name?.toString()?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: 'Nama klub atau kontingen sekolah wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = await saveSchoolServer({ name, city, coach_name });
    return NextResponse.json(
      { success: true, message: 'Klub/kontingen berhasil ditambahkan.', data: saved },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan data klub.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
