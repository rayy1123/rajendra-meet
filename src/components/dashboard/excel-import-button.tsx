'use client';

import { useState, useRef } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseAndImportExcel } from '@/services/excel-parser';
import { toast } from 'sonner';

export function ExcelImportButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.info('Memproses & mengimpor Buku Acara Excel...');

    try {
      const res = await parseAndImportExcel(file);
      if (res.success) {
        toast.success(res.message);
        window.location.reload(); // Refresh untuk memperbarui statistik
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error('Gagal memproses file Excel');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
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
        className="gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        )}
        Import Buku Acara (.xlsx)
      </Button>
    </>
  );
}