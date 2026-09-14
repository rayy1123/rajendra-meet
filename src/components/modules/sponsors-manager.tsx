'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Handshake,
  CheckCircle2,
  XCircle,
  Eye,
  ScrollText,
  BookOpen,
  UploadCloud,
  Image as ImageIcon,
  FileCheck2,
  AlertCircle,
  RotateCcw,
  FileText,
} from 'lucide-react';
import {
  type SponsorItem,
  getCachedSponsors,
  saveCachedSponsors,
  resetCachedSponsors,
} from '@/lib/data/sponsors';
import { SponsorLogosStrip } from './sponsor-logos-strip';
import Link from 'next/link';

const MAX_LOGO_FILE_SIZE = 1024 * 1024; // 1 MB (1,048,576 bytes)

export function SponsorsManager({
  initialSponsors,
}: {
  initialSponsors: SponsorItem[];
}) {
  const [sponsors, setSponsors] = useState<SponsorItem[]>(() => getCachedSponsors(initialSponsors));
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    sizeKb: number;
  } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    tier: SponsorItem['tier'];
    logoUrl: string;
    websiteUrl: string;
    isActive: boolean;
    orderNo: number;
  }>({
    name: '',
    tier: 'gold',
    logoUrl: '',
    websiteUrl: '',
    isActive: true,
    orderNo: 1,
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setUploadedFileInfo(null);
    setShowUrlInput(false);
    setForm({
      name: '',
      tier: 'gold',
      logoUrl: '',
      websiteUrl: '',
      isActive: true,
      orderNo: sponsors.length + 1,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (sponsor: SponsorItem) => {
    setEditingId(sponsor.id);
    setUploadedFileInfo(null);
    setShowUrlInput(false);
    setForm({
      name: sponsor.name,
      tier: sponsor.tier,
      logoUrl: sponsor.logoUrl,
      websiteUrl: sponsor.websiteUrl || '',
      isActive: sponsor.isActive,
      orderNo: sponsor.orderNo,
    });
    setOpenModal(true);
  };

  const handleFileProcess = (file: File) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error('Format gambar tidak didukung! Gunakan format PNG, JPG, SVG, atau WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Syarat wajib: Ukuran file harus di bawah 1 MB
    if (file.size > MAX_LOGO_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(
        `Ukuran file terlalu besar (${sizeMb} MB)! Syarat logo maksimal adalah di bawah 1 MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setForm((prev) => ({ ...prev, logoUrl: result }));
        setUploadedFileInfo({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
        });
        toast.success(`Logo "${file.name}" (${Math.round(file.size / 1024)} KB) berhasil diunggah!`);
      }
    };
    reader.onerror = () => {
      toast.error('Gagal membaca file logo. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: '' }));
    setUploadedFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nama sponsor wajib diisi.');
      return;
    }

    let updatedList: SponsorItem[];

    if (editingId) {
      updatedList = sponsors.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: form.name.trim(),
              tier: form.tier,
              logoUrl: form.logoUrl.trim(),
              websiteUrl: form.websiteUrl.trim() || null,
              isActive: form.isActive,
              orderNo: form.orderNo,
            }
          : s
      );
      toast.success('Data sponsor berhasil diperbarui!');
    } else {
      const newSponsor: SponsorItem = {
        id: `sp-${Date.now()}`,
        name: form.name.trim(),
        tier: form.tier,
        logoUrl: form.logoUrl.trim(),
        websiteUrl: form.websiteUrl.trim() || null,
        isActive: form.isActive,
        orderNo: form.orderNo,
      };
      updatedList = [...sponsors, newSponsor];
      toast.success('Sponsor baru berhasil ditambahkan!');
    }

    setSponsors(updatedList);
    saveCachedSponsors(updatedList);
    setOpenModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sponsor "${name}"?`)) {
      const updatedList = sponsors.filter((s) => s.id !== id);
      setSponsors(updatedList);
      saveCachedSponsors(updatedList);
      toast.success(`Sponsor "${name}" berhasil dihapus.`);
    }
  };

  const handleToggleActive = (id: string) => {
    const updatedList = sponsors.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    setSponsors(updatedList);
    saveCachedSponsors(updatedList);
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan daftar sponsor ke data awal default kejuaraan?')) {
      const defaults = resetCachedSponsors();
      setSponsors(defaults);
      toast.success('Daftar sponsor berhasil dikembalikan ke default.');
    }
  };

  const getTierBadge = (tier: SponsorItem['tier']) => {
    switch (tier) {
      case 'title':
        return <Badge className="bg-amber-600 text-white font-bold text-[10px]">Title Sponsor</Badge>;
      case 'platinum':
        return <Badge className="bg-slate-800 text-white font-bold text-[10px]">Platinum</Badge>;
      case 'gold':
        return <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">Gold</Badge>;
      case 'silver':
        return <Badge className="bg-slate-400 text-slate-900 font-bold text-[10px]">Silver</Badge>;
      case 'partner':
      default:
        return <Badge variant="outline" className="font-bold text-[10px]">Official Partner</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card & Quick Actions */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Manajemen Sponsorship Kejuaraan
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Kelola sponsor resmi turnamen. Logo sponsor aktif akan otomatis disematkan pada <b>Sertifikat & Piagam Penghargaan</b>, <b>Buku Acara (Start List)</b>, dan <b>Buku Juknis (Petunjuk Teknis)</b>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefault}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9"
                title="Kembalikan daftar sponsor ke setelan default"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Default
              </Button>
              <Link href="/sertifikat">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold h-9">
                  <ScrollText className="h-3.5 w-3.5 text-amber-600" /> Lihat di Sertifikat
                </Button>
              </Link>
              <Link href="/buku-acara">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold h-9">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" /> Buka Buku Acara
                </Button>
              </Link>
              <Link href="/juknis">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold h-9">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" /> Buka Juknis
                </Button>
              </Link>
              <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 text-xs font-bold h-9">
                <Plus className="h-4 w-4" /> Tambah Sponsor Baru
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pratinjau Live Banner Sponsor */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Pratinjau Tampilan Logo Sponsor (Live Preview)
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {sponsors.filter((s) => s.isActive).length} sponsor aktif
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
            <SponsorLogosStrip sponsors={sponsors} size="md" />
          </div>
        </CardContent>
      </Card>

      {/* Grid Daftar Sponsor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsors.map((s) => (
          <Card
            key={s.id}
            className={`overflow-hidden transition-all border ${
              s.isActive ? 'border-slate-200 shadow-xs' : 'border-slate-200/50 opacity-60 bg-muted/20'
            }`}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 rounded-lg border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">NO LOGO</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground line-clamp-1">{s.name}</h4>
                    <div className="mt-1">{getTierBadge(s.tier)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(s.id)}
                  title={s.isActive ? 'Sponsor Aktif (Klik untuk Nonaktifkan)' : 'Sponsor Nonaktif (Klik untuk Aktifkan)'}
                  className="shrink-0"
                >
                  {s.isActive ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 hover:text-emerald-700" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>

              {s.websiteUrl && (
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <a
                    href={s.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-primary"
                  >
                    {s.websiteUrl}
                  </a>
                </p>
              )}

              <div className="pt-3 border-t flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  Urutan: #{s.orderNo}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(s)}
                    className="h-7 px-2 text-xs font-semibold gap-1"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(s.id, s.name)}
                    className="h-7 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Dialog Tambah / Edit Sponsor */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Handshake className="h-5 w-5 text-primary" />
              {editingId ? 'Edit Data Sponsor' : 'Tambah Sponsor Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">
                Nama Sponsor / Mitra <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Speedo Indonesia"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Kategori / Tier Sponsor</label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm((s) => ({ ...s, tier: v as SponsorItem['tier'] }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title Sponsor (Utama)</SelectItem>
                    <SelectItem value="platinum">Platinum Sponsor</SelectItem>
                    <SelectItem value="gold">Gold Sponsor</SelectItem>
                    <SelectItem value="silver">Silver Sponsor</SelectItem>
                    <SelectItem value="partner">Official Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Urutan Tampilan</label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={form.orderNo}
                  onChange={(e) => setForm((s) => ({ ...s, orderNo: parseInt(e.target.value) || 1 }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Logo Sponsor: Unggah File (< 1 MB) atau Input URL */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Logo Sponsor <span className="text-muted-foreground font-normal">(Maks. 1 MB)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  {showUrlInput ? '« Unggah File Gambar' : 'Input URL Gambar »'}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!showUrlInput ? (
                <div>
                  {form.logoUrl ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
                      <div className="flex items-center justify-center p-3 rounded-md bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] min-h-[80px] border border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.logoUrl}
                          alt="Logo Sponsor"
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium truncate">
                          <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[170px]">
                            {uploadedFileInfo
                              ? `${uploadedFileInfo.name} (${uploadedFileInfo.sizeKb} KB)`
                              : 'Logo terpilih'}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50 py-0 h-4 shrink-0"
                          >
                            &lt; 1 MB Valid
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-6 px-2 text-[10px] font-semibold"
                          >
                            Ganti
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="h-6 px-2 text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all ${
                        isDragging
                          ? 'border-primary bg-primary/5 scale-[0.99]'
                          : 'border-slate-300 hover:border-primary/60 hover:bg-white bg-white/80'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="font-semibold text-slate-800 text-xs">
                          Klik untuk memilih gambar atau seret file ke sini
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Format PNG (transparan disarankan), JPG, SVG, WebP
                        </p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1">
                          <AlertCircle className="h-3 w-3" />
                          Syarat Wajib: Ukuran File di Bawah 1 MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    placeholder="https://.../logo.png atau /brand/logo.png"
                    value={form.logoUrl}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, logoUrl: e.target.value }));
                      setUploadedFileInfo(null);
                    }}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Bisa menggunakan URL gambar publik atau path lokal seperti <code>/brand/logo.png</code>.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Website Sponsor (Opsional)</label>
              <Input
                placeholder="https://sponsor.com"
                value={form.websiteUrl}
                onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-active-check"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              <label htmlFor="is-active-check" className="font-medium text-foreground cursor-pointer">
                Aktifkan sponsor ini (Tampilkan di Sertifikat & Buku Acara)
              </label>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpenModal(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-bold text-xs">
                {editingId ? 'Simpan Perubahan' : 'Tambahkan Sponsor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
