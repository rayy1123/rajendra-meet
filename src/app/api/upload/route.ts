import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_FOLDERS = ['posters', 'avatars', 'payments', 'events', 'sponsors', 'gallery', 'viewer'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sesi login tidak valid untuk mengunggah file.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = ((formData.get('folder') as string) || 'posters').trim().toLowerCase();

    // Whitelist & sanitize folder untuk mencegah Path Traversal
    const safeFolder = ALLOWED_FOLDERS.includes(rawFolder as any) ? rawFolder : 'posters';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas maksimal 5 MB' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Format file tidak didukung, harap unggah gambar' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Target direktori di folder public/uploads/[folder]
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nama file unik dan aman (ekstensi dibatasi hanya ekstensi gambar)
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    let ext = path.extname(file.name).toLowerCase();
    if (!allowedExts.includes(ext)) {
      ext = file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/webp' ? '.webp' : '.png';
    }

    const safeName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeName,
      size: file.size,
    });
  } catch (error) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}
