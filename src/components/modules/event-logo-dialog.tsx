'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Trophy,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Camera
} from 'lucide-react';

interface EventLogoDialogProps {
  eventId: string;
  eventName: string;
  currentLogoUrl?: string | null;
  trigger?: React.ReactNode;
  onLogoUpdated?: (newUrl: string | null) => void;
}

const PRESET_LOGOS = [
  {
    name: 'Rajendra Meet',
    url: '/brand/logo.png',
  },
  {
    name: 'Rajendra Organizer',
    url: '/brand/rajendra-organizer-logo.png',
  },
  {
    name: 'Aquatic Icon',
    url: '/brand/favicon.png',
  },
];

export function EventLogoDialog({
  eventId,
  eventName,
  currentLogoUrl,
  trigger,
  onLogoUpdated,
}: EventLogoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>(currentLogoUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setPreviewUrl(currentLogoUrl || null);
      setUrlInput(currentLogoUrl || '');
      setSelectedFile(null);
      setError('');
      setSuccess(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5 MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUrlInput('');
  };

  const handleSelectPreset = (url: string) => {
    setSelectedFile(null);
    setPreviewUrl(url);
    setUrlInput(url);
    setError('');
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUrlInput('');
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      let finalUrl = previewUrl;

      // 1. Jika ada file yang dipilih, upload terlebih dahulu
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'event-logos');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Gagal mengunggah file logo');
        }

        finalUrl = uploadData.url;
      } else if (urlInput.trim()) {
        finalUrl = urlInput.trim();
      }

      // 2. Simpan logo_url ke API
      const res = await fetch(`/api/events/${eventId}/logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: finalUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan logo ke database');
      }

      setSaving(false);
      setSuccess(true);
      onLogoUpdated?.(finalUrl);

      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        router.refresh();
      }, 700);
    } catch (err: any) {
      setSaving(false);
      setError(err?.message || 'Terjadi kesalahan saat menyimpan logo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
            <Camera className="h-3.5 w-3.5 text-primary" /> Ubah Logo
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ImageIcon className="h-5 w-5 text-primary" /> Ubah Logo Kejuaraan
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Atur logo resmi untuk <strong>{eventName}</strong>
          </p>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Logo kejuaraan berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Logo Preview Box */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-2.5 text-center">
            <div className="h-24 w-24 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden p-2 relative group">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Logo Preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Trophy className="h-10 w-10 text-blue-500 opacity-80" />
              )}
            </div>
            <div className="text-[11px] text-slate-500">
              {previewUrl ? (
                <span className="text-emerald-700 font-semibold">✓ Logo Terpasang</span>
              ) : (
                <span className="text-slate-400">Menggunakan Ikon Trofi Bawaan</span>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Unggah File Logo Baru
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2 text-xs font-bold border-dashed border-slate-300 hover:border-primary py-4"
            >
              <Upload className="h-4 w-4 text-primary" /> Pilih Gambar (PNG, JPG, SVG, WebP)
            </Button>
            <p className="text-[10px] text-slate-400 text-center">
              Maksimal 5MB. Disarankan berlatar transparan (PNG/SVG).
            </p>
          </div>

          {/* Quick Preset Logos */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Atau Pilih Logo Bawaan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_LOGOS.map((preset) => {
                const isSelected = previewUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="h-8 w-8 flex items-center justify-center mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 sm:justify-between">
            {previewUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs font-bold gap-1.5"
              >
                {saving ? 'Menyimpan...' : 'Simpan Logo'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
