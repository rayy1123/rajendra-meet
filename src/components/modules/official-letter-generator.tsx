'use client';

import { useState, useRef, useEffect } from 'react';
import { OfficialLetterSheet } from './official-letter-sheet';
import { OfficialLetterData } from '@/types/letters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  Save,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Sliders,
  Palette,
  ShieldCheck,
  Building2,
  Phone,
  Eye,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { printElement } from '@/lib/utils/print-helper';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface OfficialLetterGeneratorProps {
  initialLetters: OfficialLetterData[];
}

export function OfficialLetterGenerator({ initialLetters }: OfficialLetterGeneratorProps) {
  const [lettersList, setLettersList] = useState<OfficialLetterData[]>(initialLetters);
  const [selectedLetterId, setSelectedLetterId] = useState<string>(
    initialLetters[0]?.id || 'let-01-harahap-series4'
  );

  const currentLetter = lettersList.find((l) => l.id === selectedLetterId) || lettersList[0];
  const [letterData, setLetterData] = useState<OfficialLetterData>(currentLetter || ({} as OfficialLetterData));

  // Editor Tabs
  const [activeTab, setActiveTab] = useState<'kop' | 'meta' | 'body' | 'signature' | 'footer'>('kop');
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadField, setActiveUploadField] = useState<string | null>(null);

  useEffect(() => {
    if (currentLetter) {
      setLetterData(currentLetter);
    }
  }, [selectedLetterId]);

  // Handle Switch Preset
  const handleSelectLetterPreset = (id: string) => {
    setSelectedLetterId(id);
    const target = lettersList.find((l) => l.id === id);
    if (target) setLetterData(target);
  };

  // Upload File Helper
  const triggerUpload = (fieldName: string) => {
    setActiveUploadField(fieldName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadField) return;

    setUploadingTarget(activeUploadField);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'letters');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        if (activeUploadField === 'kopLogo') {
          setLetterData((s) => ({ ...s, kop: { ...s.kop, logoUrl: data.url } }));
        } else if (activeUploadField === 'leftStamp') {
          setLetterData((s) => ({ ...s, leftSignature: { ...s.leftSignature, stampUrl: data.url } }));
        } else if (activeUploadField === 'leftSign') {
          setLetterData((s) => ({ ...s, leftSignature: { ...s.leftSignature, signatureUrl: data.url } }));
        } else if (activeUploadField === 'rightStamp') {
          setLetterData((s) => ({ ...s, rightSignature: { ...s.rightSignature, stampUrl: data.url } }));
        } else if (activeUploadField === 'rightSign') {
          setLetterData((s) => ({ ...s, rightSignature: { ...s.rightSignature, signatureUrl: data.url } }));
        }
        toast.success('Gambar berhasil diunggah!');
      } else {
        toast.error(data.error || 'Gagal mengunggah gambar');
      }
    } catch {
      toast.error('Kesalahan jaringan saat mengunggah');
    } finally {
      setUploadingTarget(null);
      setActiveUploadField(null);
    }
  };

  // Poin Dinamis
  const handleAddPoint = () => {
    setLetterData((prev) => ({
      ...prev,
      numberedPoints: [...(prev.numberedPoints || []), 'Poin baru informasi kejuaraan...'],
    }));
  };

  const handleUpdatePoint = (index: number, val: string) => {
    setLetterData((prev) => {
      const next = [...(prev.numberedPoints || [])];
      next[index] = val;
      return { ...prev, numberedPoints: next };
    });
  };

  const handleRemovePoint = (index: number) => {
    setLetterData((prev) => ({
      ...prev,
      numberedPoints: prev.numberedPoints.filter((_, i) => i !== index),
    }));
  };

  // Cetak Dokumen A4 Portrait
  const handlePrint = () => {
    printElement('official-letter-render-area', {
      title: `${letterData.subject.replace(/\s+/g, '-')}-${letterData.letterNumber.replace(/\//g, '_')}`,
      isLandscape: false,
      pageMargin: '0mm',
    });
  };

  // Simpan Surat
  const handleSaveLetter = async () => {
    try {
      const res = await fetch('/api/admin/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', letter: letterData }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setLettersList((prev) => [data.data, ...prev.filter((l) => l.id !== data.data.id)]);
        setSelectedLetterId(data.data.id);
        toast.success('Surat resmi berhasil disimpan ke sistem!');
      } else {
        toast.error(data.error || 'Gagal menyimpan surat');
      }
    } catch {
      toast.error('Kesalahan jaringan saat menyimpan surat');
    }
  };

  // Duplikasi Sebagai Draft Baru
  const handleDuplicateDraft = () => {
    const newId = `let_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const duplicate: OfficialLetterData = {
      ...letterData,
      id: newId,
      title: `${letterData.title} (Salinan)`,
      letterNumber: `${letterData.letterNumber}/REV`,
      createdAt: new Date().toISOString(),
    };
    setLettersList((prev) => [duplicate, ...prev]);
    setSelectedLetterId(newId);
    setLetterData(duplicate);
    toast.success('Salinan draft surat berhasil dibuat!');
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* ── CSS PRINT A4 PORTRAIT EXACT ── */}
      <style jsx global>{`
        @media print {
          aside,
          header,
          nav,
          footer,
          .no-print {
            display: none !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          #official-letter-render-area {
            display: block !important;
            position: static !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .official-letter-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 12mm 15mm 12mm 15mm !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* ── 1. HEADER CONTROLS & PRESET PICKER ── */}
      <div className="no-print glass-card p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Generator &amp; Percetakan Surat Resmi Organisasi
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Buat surat pemberitahuan, undangan kejuaraan, atau dispensasi sekolah dengan kop, stempel ganda, tanda tangan, dan footer kontak resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDuplicateDraft}
              className="h-9 px-3 text-xs font-semibold gap-1.5 bg-white border-slate-300 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-slate-600" />
              <span>Salin Sebagai Draft</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveLetter}
              className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-white border-blue-300 text-blue-900 hover:bg-blue-50 cursor-pointer shadow-2xs"
            >
              <Save className="h-3.5 w-3.5 text-blue-600" />
              <span>Simpan Surat</span>
            </Button>

            <Button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Surat (A4 Portrait)</span>
            </Button>
          </div>
        </div>

        {/* Preset Selector Badges */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/70 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Pilih Template:
          </span>
          {lettersList.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => handleSelectLetterPreset(l.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                selectedLetterId === l.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              <span>{l.title}</span>
              {selectedLetterId === l.id && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. STUDIO SPLIT: LEFT EDITOR (CONTROLS) & RIGHT LIVE A4 PREVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── KOLOM KIRI (5/12): STUDIO EDITOR TABBED ── */}
        <div className="no-print lg:col-span-5 space-y-4">
          <div className="glass-card p-5 space-y-4 shadow-md">
            {/* Tab Editor Nav */}
            <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'kop', label: '1. Kop', icon: Building2 },
                { id: 'meta', label: '2. Nomor', icon: Sliders },
                { id: 'body', label: '3. Isi', icon: FileText },
                { id: 'signature', label: '4. TTD', icon: ShieldCheck },
                { id: 'footer', label: '5. Footer', icon: Phone },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5',
                      activeTab === tab.id
                        ? 'bg-white text-blue-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ════ TAB 1: KOP SURAT ════ */}
            {activeTab === 'kop' && (
              <div className="space-y-3.5 text-xs">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 block">Logo &amp; Brand Organisasi</span>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg border bg-white p-1 flex items-center justify-center shadow-2xs shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={letterData.kop.logoUrl || '/brand/logo.png'}
                        alt="Logo Kop"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input
                        value={letterData.kop.logoUrl || ''}
                        onChange={(e) =>
                          setLetterData((s) => ({ ...s, kop: { ...s.kop, logoUrl: e.target.value } }))
                        }
                        placeholder="URL Logo (/brand/logo.png)"
                        className="h-7 text-xs bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => triggerUpload('kopLogo')}
                        disabled={uploadingTarget === 'kopLogo'}
                        className="h-6 px-2 text-[10px] font-bold bg-white gap-1 cursor-pointer"
                      >
                        <Upload className="h-3 w-3" />
                        <span>{uploadingTarget === 'kopLogo' ? 'Mengunggah...' : 'Upload Logo Kop'}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Badge Banner Acara (Pill Biru)</label>
                  <Input
                    value={letterData.kop.bannerBadgeText || ''}
                    onChange={(e) =>
                      setLetterData((s) => ({
                        ...s,
                        kop: { ...s.kop, bannerBadgeText: e.target.value },
                      }))
                    }
                    placeholder="Contoh: HOME TOURNAMENT SERIES 4"
                    className="h-8 text-xs bg-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Nama Lembaga / Klub / Organisasi</label>
                  <Input
                    value={letterData.kop.organizationName || ''}
                    onChange={(e) =>
                      setLetterData((s) => ({
                        ...s,
                        kop: { ...s.kop, organizationName: e.target.value },
                      }))
                    }
                    placeholder="HARAHAP SWIMMING SCHOOL / RAJENDRA SWIM SYSTEM"
                    className="h-8 text-xs bg-white font-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Sub-Nama / Teks Merah Bawah Logo</label>
                  <Input
                    value={letterData.kop.subOrganizationName || ''}
                    onChange={(e) =>
                      setLetterData((s) => ({
                        ...s,
                        kop: { ...s.kop, subOrganizationName: e.target.value },
                      }))
                    }
                    placeholder="HARAHAP SWIMMING SCHOOL"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Lokasi / Tempat Pelaksanaan</label>
                  <Input
                    value={letterData.kop.locationLine || ''}
                    onChange={(e) =>
                      setLetterData((s) => ({
                        ...s,
                        kop: { ...s.kop, locationLine: e.target.value },
                      }))
                    }
                    placeholder="KOLAM RENANG GRJS BULUNGAN JAKARTA SELATAN"
                    className="h-8 text-xs bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Tanggal Pelaksanaan Acara</label>
                  <Input
                    value={letterData.kop.dateLine || ''}
                    onChange={(e) =>
                      setLetterData((s) => ({
                        ...s,
                        kop: { ...s.kop, dateLine: e.target.value },
                      }))
                    }
                    placeholder="SABTU, 17 OKTOBER 2026"
                    className="h-8 text-xs bg-white font-semibold"
                  />
                </div>
              </div>
            )}

            {/* ════ TAB 2: NOMOR & METADATA ════ */}
            {activeTab === 'meta' && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Nomor Surat Resmi</label>
                  <Input
                    value={letterData.letterNumber}
                    onChange={(e) => setLetterData((s) => ({ ...s, letterNumber: e.target.value }))}
                    placeholder="0926/HT-S4/HSS/IX/2026"
                    className="h-8 text-xs bg-white font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Lampiran</label>
                    <Input
                      value={letterData.attachment}
                      onChange={(e) => setLetterData((s) => ({ ...s, attachment: e.target.value }))}
                      placeholder="-"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Perihal</label>
                    <Input
                      value={letterData.subject}
                      onChange={(e) => setLetterData((s) => ({ ...s, subject: e.target.value }))}
                      placeholder="Pemberitahuan"
                      className="h-8 text-xs bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t">
                  <label className="font-bold text-slate-800">Tanggal Surat Terbit</label>
                  <Input
                    value={letterData.letterDate}
                    onChange={(e) => setLetterData((s) => ({ ...s, letterDate: e.target.value }))}
                    placeholder="26 September 2026"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Kepada Yth. (Penerima Surat)</label>
                  <textarea
                    rows={4}
                    value={letterData.recipientTitle}
                    onChange={(e) => setLetterData((s) => ({ ...s, recipientTitle: e.target.value }))}
                    placeholder={`Kepada\nYth. Bapak / Ibu\nPeserta Home Tournament\nSeries IV`}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-sans"
                  />
                  <p className="text-[10px] text-slate-400">Gunakan Enter untuk baris baru.</p>
                </div>
              </div>
            )}

            {/* ════ TAB 3: ISI SURAT & POIN ════ */}
            {activeTab === 'body' && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Salam Pembuka</label>
                  <Input
                    value={letterData.salutation}
                    onChange={(e) => setLetterData((s) => ({ ...s, salutation: e.target.value }))}
                    placeholder="Salam Olahraga,"
                    className="h-8 text-xs bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Paragraf Pembuka</label>
                  <textarea
                    rows={3}
                    value={letterData.openingParagraph}
                    onChange={(e) => setLetterData((s) => ({ ...s, openingParagraph: e.target.value }))}
                    placeholder="Diberitahukan bahwa untuk..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-sans"
                  />
                </div>

                {/* Numbered Points Dinamis */}
                <div className="space-y-2 pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Poin-Poin Isi Surat ({letterData.numberedPoints?.length || 0})</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPoint}
                      className="h-6 px-2 text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200 gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Tambah Poin
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(letterData.numberedPoints || []).map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <span className="h-6 w-5 shrink-0 flex items-center justify-center font-bold text-slate-500 font-mono text-xs">
                          {idx + 1}.
                        </span>
                        <textarea
                          rows={2}
                          value={pt}
                          onChange={(e) => handleUpdatePoint(idx, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-900 focus:border-blue-500 outline-none font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePoint(idx)}
                          className="h-6 w-6 text-slate-400 hover:text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                          title="Hapus Poin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t">
                  <label className="font-bold text-slate-800">Paragraf Penutup</label>
                  <textarea
                    rows={2}
                    value={letterData.closingParagraph}
                    onChange={(e) => setLetterData((s) => ({ ...s, closingParagraph: e.target.value }))}
                    placeholder="Demikian hal ini disampaikan..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* ════ TAB 4: TANDA TANGAN & STEMPEL ════ */}
            {activeTab === 'signature' && (
              <div className="space-y-4 text-xs">
                {/* Tanda Tangan Kiri */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
                  <span className="font-bold text-blue-900 block text-xs">Tanda Tangan Kiri (Owner / Pimpinan)</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600">Jabatan Penandatangan</label>
                    <Input
                      value={letterData.leftSignature.roleTitle}
                      onChange={(e) =>
                        setLetterData((s) => ({
                          ...s,
                          leftSignature: { ...s.leftSignature, roleTitle: e.target.value },
                        }))
                      }
                      placeholder="Owner Harahap Swimming School,"
                      className="h-7 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600">Nama Lengkap &amp; Gelar</label>
                    <Input
                      value={letterData.leftSignature.signerName}
                      onChange={(e) =>
                        setLetterData((s) => ({
                          ...s,
                          leftSignature: { ...s.leftSignature, signerName: e.target.value },
                        }))
                      }
                      placeholder="Shafira Ramadhian, S.Pd."
                      className="h-7 text-xs bg-white font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => triggerUpload('leftStamp')}
                      className="h-7 px-2 text-[10px] font-semibold bg-white gap-1 cursor-pointer flex-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>{uploadingTarget === 'leftStamp' ? 'Unggah...' : 'Upload Stempel Kiri'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => triggerUpload('leftSign')}
                      className="h-7 px-2 text-[10px] font-semibold bg-white gap-1 cursor-pointer flex-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>{uploadingTarget === 'leftSign' ? 'Unggah...' : 'Upload TTD Kiri'}</span>
                    </Button>
                  </div>
                </div>

                {/* Tanda Tangan Kanan */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
                  <span className="font-bold text-blue-900 block text-xs">Tanda Tangan Kanan (Ketua Pelaksana)</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600">Jabatan Penandatangan</label>
                    <Input
                      value={letterData.rightSignature.roleTitle}
                      onChange={(e) =>
                        setLetterData((s) => ({
                          ...s,
                          rightSignature: { ...s.rightSignature, roleTitle: e.target.value },
                        }))
                      }
                      placeholder="Ketua Pelaksana,"
                      className="h-7 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600">Nama Lengkap &amp; Gelar</label>
                    <Input
                      value={letterData.rightSignature.signerName}
                      onChange={(e) =>
                        setLetterData((s) => ({
                          ...s,
                          rightSignature: { ...s.rightSignature, signerName: e.target.value },
                        }))
                      }
                      placeholder="Rega Partuasan Damanik, S.Pd."
                      className="h-7 text-xs bg-white font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => triggerUpload('rightStamp')}
                      className="h-7 px-2 text-[10px] font-semibold bg-white gap-1 cursor-pointer flex-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>{uploadingTarget === 'rightStamp' ? 'Unggah...' : 'Upload Stempel Kanan'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => triggerUpload('rightSign')}
                      className="h-7 px-2 text-[10px] font-semibold bg-white gap-1 cursor-pointer flex-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>{uploadingTarget === 'rightSign' ? 'Unggah...' : 'Upload TTD Kanan'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 5: FOOTER KONTAK & WATERMARK ════ */}
            {activeTab === 'footer' && (
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Nomor Admin 1</label>
                    <Input
                      value={letterData.footer.admin1Number}
                      onChange={(e) =>
                        setLetterData((s) => ({
                          ...s,
                          footer: { ...s.footer, admin1Number: e.target.value },
                        }))
                      }
                      placeholder="088 77 151189"
                      className="h-8 text-xs bg-white font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Nomor Admin 2</label>
                    <Input
                      value={letterData.footer.admin2Number}
                      onChange={(e) =>
                        setLetterData((s) => ({
                          ...s,
                          footer: { ...s.footer, admin2Number: e.target.value },
                        }))
                      }
                      placeholder="088 999 151189"
                      className="h-8 text-xs bg-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t">
                  <label className="font-bold text-slate-800">Teks Watermark Samar (Tengah Kertas)</label>
                  <Input
                    value={letterData.watermarkText || ''}
                    onChange={(e) => setLetterData((s) => ({ ...s, watermarkText: e.target.value }))}
                    placeholder="HARAHAP SWIMMING SCHOOL"
                    className="h-8 text-xs bg-white uppercase font-bold"
                  />
                </div>

                <div className="pt-2 border-t flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-watermark-check"
                    checked={letterData.showWatermark !== false}
                    onChange={(e) => setLetterData((s) => ({ ...s, showWatermark: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="show-watermark-check" className="font-bold text-slate-800 cursor-pointer">
                    Aktifkan Watermark Transparan di Tengah Kertas
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── KOLOM KANAN (7/12): LIVE WYSIWYG A4 PREVIEW ── */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between no-print px-1">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-blue-600" />
              Pratinjau Lembar A4 Portrait (Siap Cetak)
            </span>
            <span className="text-[11px] font-mono text-slate-400">Skala 1:1 • Sesuai Standar Cetak</span>
          </div>

          <div className="overflow-x-auto p-2 bg-slate-200/70 rounded-2xl border border-slate-300 flex justify-center">
            <div id="official-letter-render-area" className="w-full max-w-[794px]">
              <OfficialLetterSheet data={letterData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
