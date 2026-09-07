'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera } from 'lucide-react';

const ALLOWED_MIME_PREFIXES = ['image/'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function AvatarUpload({
  folder,
  uid,
  currentUrl,
  onUploaded,
}: {
  folder: 'viewer' | 'athlete';
  uid: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);

    if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      setErr('Format tidak didukung. Unggah hanya file gambar.');
      setBusy(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErr('Ukuran file melebihi 2MB.');
      setBusy(false);
      return;
    }

    try {
      const supabase = createClient();
      const ext = file.type.split('/')[1] || 'jpg';
      const path = `${folder}/${uid}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal mengunggah foto.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent">
        <Camera className="h-3.5 w-3.5" />
        {currentUrl ? 'Ganti Foto' : 'Unggah Foto'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={busy}
        />
      </label>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
