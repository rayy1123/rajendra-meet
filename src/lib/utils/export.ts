import * as XLSX from 'xlsx';

/**
 * 1. Fungsi Ekspor Data ke Format Excel (.xlsx) dengan Lebar Kolom Otomatis
 */
export function exportToExcel(data: Record<string, any>[], fileName: string) {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Menghitung lebar kolom secara otomatis berdasarkan isi data terpanjang
  const objectKeys = Object.keys(data[0]);
  const colWidths = objectKeys.map((key) => {
    const maxContentLength = Math.max(
      key.length,
      ...data.map((row) => (row[key] ? String(row[key]).length : 0))
    );
    return { wch: Math.min(Math.max(maxContentLength + 3, 10), 50) }; // min 10, max 50 char
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * 2. Fungsi Cetak Halaman (PDF Printer Friendly)
 */
export function printPage() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}