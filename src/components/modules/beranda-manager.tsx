'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  type ShowcaseItem,
  mapRow,
  getDefaultsByType,
  getCachedShowcases,
  saveCachedShowcases,
} from '@/lib/data/landing-showcases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Image as ImageIcon,
  BarChart3,
  GalleryHorizontalEnd,
  Package,
  Award,
  Info,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Building2,
  Upload,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'poster' | 'stat' | 'gallery' | 'service' | 'pillar' | 'about' | 'client';

const TABS: { value: TabType; label: string; icon: typeof ImageIcon }[] = [
  { value: 'poster', label: 'Poster Lomba', icon: ImageIcon },
  { value: 'stat', label: 'Counter Statistik', icon: BarChart3 },
  { value: 'gallery', label: 'Galeri Kolam', icon: GalleryHorizontalEnd },
  { value: 'service', label: 'Layanan & Paket', icon: Package },
  { value: 'pillar', label: 'Pilar Keunggulan', icon: Award },
  { value: 'about', label: 'Tentang Kami', icon: Info },
  { value: 'client', label: 'Client Kami', icon: Building2 },
];

export function BerandaManager() {
  const [tab, setTab] = useState<TabType>('poster');
  const [items, setItems] = useState<ShowcaseItem[]>(() => getCachedShowcases('poster') ?? getDefaultsByType('poster'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async (type: TabType) => {
    setLoading(true);
    try {
      // 1. Ambil dari API route (penyimpanan server yang persisten)
      const res = await fetch(`/api/showcases?type=${type}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.items) && json.items.length > 0) {
          setItems(json.items);
          saveCachedShowcases(type, json.items);
          setLoading(false);
          return;
        }
      }

      // 2. Coba ambil dari Supabase
      const { data, error } = await supabase
        .from('landing_showcases')
        .select('*')
        .eq('type', type)
        .order('order_no', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapRow);
        setItems(mapped);
        saveCachedShowcases(type, mapped);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Fetch showcases fallback to cache:', e);
    }

    // 3. Fallback ke cache browser atau default bawaan
    const cached = getCachedShowcases(type);
    setItems(cached ?? getDefaultsByType(type));
    setLoading(false);
  }, [supabase]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    const cached = getCachedShowcases(newTab);
    setItems(cached ?? getDefaultsByType(newTab));
    fetchItems(newTab);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/showcases?type=${tab}`);
        if (res.ok) {
          const json = await res.json();
          if (active && json.success && Array.isArray(json.items) && json.items.length > 0) {
            setItems(json.items);
            saveCachedShowcases(tab, json.items);
            return;
          }
        }
      } catch {}

      const cached = getCachedShowcases(tab);
      if (active && cached) {
        setItems(cached);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tab]);

  const addItem = () => {
    const newItem: ShowcaseItem = {
      id: `new-${Date.now()}`,
      type: tab,
      title: tab === 'about' ? 'Tentang Kami' : '',
      subtitle: tab === 'pillar' ? 'Users' : null,
      imageUrl: null,
      linkUrl: null,
      value: tab === 'stat' ? '0+' : null,
      orderNo: items.length + 1,
      isActive: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, field: keyof ShowcaseItem, val: string | boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const toggleActive = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, isActive: !it.isActive } : it,
      ),
    );
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const triggerUpload = (itemId: string) => {
    setUploadTargetId(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;

    if (!file.type.startsWith('image/')) {
      showToast('Format file tidak didukung. Harap pilih gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast('Ukuran file maksimal 25MB.');
      return;
    }

    setUploading(true);
    showToast('Sedang memproses dan mengunggah gambar resolusi HD...');

    try {
      // 1. Simpan file asli ke server via /api/upload (Kualitas 100% Full HD asli tanpa kompresi)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', tab === 'poster' ? 'posters' : 'gallery');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          updateItem(uploadTargetId, 'imageUrl', data.url);
          showToast('Poster HD berhasil diunggah! Jangan lupa klik "Simpan" di pojok kanan atas.');
          return;
        }
      }

      // 2. Coba simpan ke Supabase Storage jika API server tidak merespons
      try {
        const ext = file.name.split('.').pop() || 'png';
        const path = `posters/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('posters')
          .upload(path, file, { upsert: true, contentType: file.type });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('posters').getPublicUrl(path);
          if (urlData?.publicUrl) {
            updateItem(uploadTargetId, 'imageUrl', urlData.publicUrl);
            showToast('Poster HD berhasil diunggah ke storage! Klik "Simpan".');
            return;
          }
        }
      } catch {}

      // 3. Fallback: Baca langsung sebagai DataURL asli (tanpa downscale/kompresi lossy)
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          updateItem(uploadTargetId, 'imageUrl', dataUrl);
          showToast('Gambar berhasil dimuat! Klik "Simpan" di pojok kanan atas.');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      showToast('Gagal mengunggah file gambar.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // 1. Simpan ke server storage via API route
      await fetch('/api/showcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab, items }),
      });

      // 2. Simpan ke local cache browser
      saveCachedShowcases(tab, items);

      // 3. Trigger custom event untuk komponen yang sedang aktif
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('scms_showcases_updated', { detail: { type: tab, items } }),
        );
      }

      // 4. Upayakan simpan ke Supabase jika tabel tersedia
      try {
        await supabase.from('landing_showcases').delete().eq('type', tab);
        if (items.length > 0) {
          const rows = items.map((it, idx) => ({
            type: tab,
            title: it.title,
            subtitle: it.subtitle || null,
            image_url: it.imageUrl || null,
            link_url: it.linkUrl || null,
            value: it.value || null,
            order_no: idx + 1,
            is_active: it.isActive,
          }));
          await supabase.from('landing_showcases').insert(rows);
        }
      } catch {}

      showToast('Data berhasil disimpan dan siap tampil di beranda!');
    } catch (err) {
      console.error('Save error:', err);
      saveCachedShowcases(tab, items);
      showToast('Tersimpan di cache lokal browser');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for uploading poster & gallery images */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex rounded-lg bg-muted p-1 text-muted-foreground flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTabChange(t.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all',
                  tab === t.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchItems(tab)} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          {tab !== 'about' && (
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          )}
          <Button size="sm" onClick={saveAll} disabled={saving} className="gap-2 font-bold bg-primary text-primary-foreground">
            <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary/40" />
          <p className="mt-3 text-sm">Memuat data...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 font-semibold text-foreground">Belum ada data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik tombol &quot;Tambah&quot; untuk menambahkan konten.
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          {/* ===== 1. POSTER TAB ===== */}
          {tab === 'poster' && (
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={item.id} className="flex flex-col md:flex-row items-start gap-6 p-5 transition-colors hover:bg-slate-50/40">
                  {/* Poster Thumbnail + Upload Trigger */}
                  <div className="shrink-0 flex flex-col items-center gap-2.5 mx-auto md:mx-0">
                    <div
                      onClick={() => triggerUpload(item.id)}
                      className="group relative h-52 w-36 sm:h-56 sm:w-40 rounded-xl border-2 border-dashed border-border overflow-hidden bg-slate-100 cursor-pointer shadow-sm hover:border-primary hover:shadow-md transition-all flex items-center justify-center"
                      title="Klik untuk memilih file poster dari komputer"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title || 'Poster'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-1" />
                          <span className="text-[11px] font-medium">Belum ada gambar</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-center">
                        <Camera className="h-7 w-7 mb-1 text-white" />
                        <span className="text-xs font-bold">Ganti Poster</span>
                        <span className="text-[10px] text-white/80 mt-0.5">Klik untuk upload file</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => triggerUpload(item.id)}
                      disabled={uploading}
                      className="w-full text-xs gap-1.5 h-8 font-semibold shadow-none border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <Upload className="h-3.5 w-3.5" /> {uploading ? 'Memproses...' : 'Ganti Poster'}
                    </Button>
                  </div>

                  {/* Form Details */}
                  <div className="flex-1 w-full space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px] font-bold">#{idx + 1}</Badge>
                        <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[11px]">
                          {item.isActive ? 'Aktif (Tampil di Beranda)' : 'Nonaktif (Disembunyikan)'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => toggleActive(item.id)}
                        >
                          {item.isActive ? (
                            <>
                              <Eye className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-medium">Tampil</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Sembunyi</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                          title="Hapus poster"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Nama Lomba / Judul Poster</label>
                        <Input
                          placeholder="Nama lomba (contoh: HT HSS S4)"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                          className="text-sm font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Subjudul / Seri Kejuaraan</label>
                        <Input
                          placeholder="Subjudul (contoh: Home Tournament Series IV)"
                          value={item.subtitle ?? ''}
                          onChange={(e) => updateItem(item.id, 'subtitle', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-foreground">URL / File Gambar Poster</label>
                          {item.imageUrl && item.imageUrl !== '/brand/poster-hthss.png' && (
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, 'imageUrl', '/brand/poster-hthss.png')}
                              className="text-[11px] text-primary hover:underline font-medium"
                            >
                              Reset ke Poster Bawaan
                            </button>
                          )}
                        </div>
                        <Input
                          placeholder="URL gambar flyer poster"
                          value={item.imageUrl?.startsWith('data:') ? '(File Gambar Lokal Terpilih)' : (item.imageUrl ?? '')}
                          onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Tautan Pendaftaran (Link URL)</label>
                        <Input
                          placeholder="URL tautan pendaftaran (contoh: /daftar-lomba)"
                          value={item.linkUrl ?? ''}
                          onChange={(e) => updateItem(item.id, 'linkUrl', e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-slate-600 text-xs">
                      <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                      <div>
                        <span><strong>Petunjuk:</strong> Klik foto di sebelah kiri atau tombol <strong>Ganti Poster</strong> untuk memilih gambar baru dari komputer/laptop Anda. Setelah poster berubah, klik tombol <strong>Simpan</strong> di kanan atas.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== 2. STAT TAB ===== */}
          {tab === 'stat' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Label Capaian</TableHead>
                  <TableHead className="w-44">Nilai Counter</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <Input
                        placeholder="Label (contoh: Peserta)"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                        className="text-sm font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Nilai (contoh: 250+)"
                        value={item.value ?? ''}
                        onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                        className="text-sm font-bold font-mono text-primary"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(item.id)}>
                        {item.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* ===== 3. GALLERY TAB ===== */}
          {tab === 'gallery' && (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item, idx) => (
                <div key={item.id} className="rounded-2xl border overflow-hidden bg-white/60 shadow-sm">
                  <div
                    onClick={() => triggerUpload(item.id)}
                    className="group relative h-36 w-full cursor-pointer bg-muted overflow-hidden flex items-center justify-center"
                    title="Klik untuk mengganti foto galeri"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-36 w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                      <Upload className="h-4 w-4" /> Ganti Foto
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(item.id)}>
                          {item.isActive ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Caption foto"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="URL foto (/slider/hero-1.jpg)"
                      value={item.imageUrl?.startsWith('data:') ? '(File Gambar Lokal Terpilih)' : (item.imageUrl ?? '')}
                      onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== 4. SERVICE / LAYANAN TAB ===== */}
          {tab === 'service' && (
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">Paket #{idx + 1}</Badge>
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(item.id)}>
                        {item.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Nama Layanan / Paket</label>
                      <Input
                        placeholder="Contoh: IT Event Renang"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                        className="text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Biaya / Harga</label>
                      <Input
                        placeholder="Contoh: Rp 5.000 / nomor peserta"
                        value={item.value ?? ''}
                        onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                        className="text-sm font-bold text-primary font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Deskripsi Singkat</label>
                    <Input
                      placeholder="Jasa manajemen sistem teknologi informasi untuk event renang Anda"
                      value={item.subtitle ?? ''}
                      onChange={(e) => updateItem(item.id, 'subtitle', e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Daftar Fasilitas (Pisahkan dengan tanda titik koma &apos;;&apos;)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Tenaga IT; Tenaga Admin Pendaftaran; Tenaga Admin Penginputan Hasil; Print Out Buku Acara; Print Out Form Timer; PDF Rekap Keuangan; PDF Hasil Register"
                      value={item.imageUrl ?? ''}
                      onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Catatan & Ketentuan (Pisahkan dengan tanda titik koma &apos;;&apos;)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Jika event diluar Jabodetabek dikenakan biaya Akomodasi dan Transportasi; Penyelenggara wajib menyediakan konsumsi untuk tim; Biaya wajib dibayarkan paling lambat 1 pekan sebelum pelaksanaan; Maksimal jam kerja adalah s/d Jam 17.00 per hari"
                      value={item.linkUrl ?? ''}
                      onChange={(e) => updateItem(item.id, 'linkUrl', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== 5. PILLAR / KEUNGGULAN TAB ===== */}
          {tab === 'pillar' && (
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">Pilar #{idx + 1}</Badge>
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(item.id)}>
                        {item.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Judul Pilar (Contoh: Tim Profesional & Berdedikasi)"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      className="text-sm font-bold"
                    />
                    <Input
                      placeholder="Nama Icon (Users, Award, MonitorSmartphone, Sliders, MapPin)"
                      value={item.subtitle ?? ''}
                      onChange={(e) => updateItem(item.id, 'subtitle', e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Uraian keunggulan..."
                    value={item.value ?? ''}
                    onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ===== 6. ABOUT TAB ===== */}
          {tab === 'about' && (
            <div className="p-6 space-y-4">
              {items.slice(0, 1).map((item) => (
                <div key={item.id} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Judul Bagian</label>
                    <Input
                      placeholder="Tentang Kami"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      className="text-base font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Paragraf 1 (Sejarah & Dedikasi)</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={item.subtitle ?? ''}
                      onChange={(e) => updateItem(item.id, 'subtitle', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Paragraf 2 (Visi & Misi)</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={item.value ?? ''}
                      onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">URL Foto Dokumentasi</label>
                    <Input
                      placeholder="/slider/about-1.jpg"
                      value={item.imageUrl ?? ''}
                      onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== 7. CLIENT TAB ===== */}
          {tab === 'client' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              {items.map((item, idx) => (
                <div key={item.id} className="rounded-2xl border p-4 bg-white/70 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-bold">Client #{idx + 1}</Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(item.id)}>
                        {item.isActive ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50 border p-2">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Nama Client / Mitra</label>
                    <Input
                      placeholder="Nama Client"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">URL Logo Client</label>
                    <Input
                      placeholder="/brand/clients/..."
                      value={item.imageUrl ?? ''}
                      onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Link */}
      <div className="flex items-center justify-end">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Buka Tampilan Beranda Publik &rarr;
        </a>
      </div>
    </div>
  );
}
