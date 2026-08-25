'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2 } from 'lucide-react';

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);

    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${uid}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    onUploaded(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        {busy ? 'Mengunggah…' : currentUrl ? 'Ganti Foto' : 'Unggah Foto'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
      </label>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
