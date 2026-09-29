'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseAndImportExcel, downloadExcelTemplate } from '@/services/excel-parser';
import { toast } from 'sonner';

export function ExcelImportButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.info('Memproses & mengimpor Buku Acara Excel...');

    try {
      const res = await parseAndImportExcel(file);
      if (res.success) {
        toast.success(res.message || 'Berhasil mengimpor data');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal mengimpor file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses file Excel';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      toast.info('Menyiapkan & mengunduh Template Excel Resmi Rajendra Meet...');
      await downloadExcelTemplate();
      toast.success('Template Excel berhasil diunduh!');
    } catch {
      toast.error('Gagal mengunduh template Excel.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
      <Button
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
        {loading ? 'Mengimpor...' : 'Import Buku Acara (.xlsx)'}
      </Button>

      <Button
        variant="outline"
        onClick={handleDownloadTemplate}
        className="gap-1.5 border-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50"
        title="Unduh contoh template Excel resmi untuk diisi"
      >
        <Download className="w-3.5 h-3.5 text-blue-600" />
        Template Contoh
      </Button>
    </div>
  );
}
