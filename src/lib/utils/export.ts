import * as XLSX from 'xlsx';

/**
 * 1. Fungsi Ekspor Data ke Format Excel (.xlsx)
 */
export function exportToExcel(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * 2. Fungsi Cetak Halaman (PDF Printer Friendly via Browser Engine)
 */
export function printPage() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}