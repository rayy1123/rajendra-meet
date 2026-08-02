import ExcelJS from 'exceljs';

/**
 * 1. Fungsi Ekspor Data ke Format Excel (.xlsx) dengan Lebar Kolom Otomatis
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SCMS';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Data');

  if (data.length === 0) {
    worksheet.addRow(['Tidak ada data']);
  } else {
    const headers = Object.keys(data[0]);

    worksheet.columns = headers.map((header) => {
      // Lebar kolom otomatis: header vs isi terpanjang, dibatasi 10..50
      const longestValue = data.reduce((max, row) => {
        const len = String(row[header] ?? '').length;
        return len > max ? len : max;
      }, header.length);

      return {
        header,
        key: header,
        width: Math.min(Math.max(longestValue + 2, 10), 50),
      };
    });

    worksheet.getRow(1).font = { bold: true };

    data.forEach((row) => {
      worksheet.addRow(row);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 2. Fungsi Cetak Halaman (Print Preview Browser)
 */
export function printPage(): void {
  window.print();
}
