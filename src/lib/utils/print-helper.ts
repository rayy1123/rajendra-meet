/**
 * Utility Cetak Presisi Tinggi untuk Rajendra Swim System
 * Menggunakan iframe terisolasi agar hasil cetak dokumen (Invoice, Sertifikat, ID Pass)
 * selalu 100% tampil, warna pekat (exact color adjust), dan terbebas dari bug
 * blank page akibat modal dialog atau scroll-lock Radix UI.
 */

export interface PrintOptions {
  title?: string;
  isLandscape?: boolean;
  pageMargin?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export function printElement(
  target: HTMLElement | string,
  options: PrintOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const {
    title = 'Dokumen Resmi Rajendra Swim System',
    isLandscape = false,
    pageMargin = isLandscape ? '0mm' : '8mm 10mm',
    onBeforePrint,
    onAfterPrint,
  } = options;

  let el: HTMLElement | null = null;
  if (typeof target === 'string') {
    el = document.getElementById(target);
  } else {
    el = target;
  }

  if (!el) {
    console.warn('[PrintHelper] Target element tidak ditemukan, fallback ke window.print()');
    window.print();
    return;
  }

  onBeforePrint?.();

  // 1. Buat iframe terisolasi
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;z-index:-9999;'
  );
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // 2. Kumpulkan seluruh style & font dari dokumen induk
  let stylesHtml = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  // 3. Salin isi elemen target
  const contentHtml = el.outerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${stylesHtml}
        <style>
          @page {
            size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
            margin: 0;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${isLandscape ? '297mm' : '100%'} !important;
            height: ${isLandscape ? '210mm' : 'auto'} !important;
            overflow: ${isLandscape ? 'hidden' : 'visible'} !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .no-print,
          .print\\:hidden,
          .modal-toolbar,
          button {
            display: none !important;
          }
          /* Hilangkan bayangan & paksa border dokumen cetak */
          .invoice-paper,
          .invoice-paper-sheet {
            box-shadow: none !important;
            margin: 0 auto !important;
          }
          .certificate-sheet {
            box-shadow: none !important;
            box-sizing: border-box !important;
            width: 297mm !important;
            height: 210mm !important;
            max-width: 297mm !important;
            max-height: 210mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            padding: 8mm 12mm 6mm 12mm !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
            border-radius: 0 !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `);
  doc.close();

  // 4. Tunggu render/font dan picu dialog print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('[PrintHelper] Gagal memicu print pada iframe:', err);
      window.print();
    } finally {
      onAfterPrint?.();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 300);
}
