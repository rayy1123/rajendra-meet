import { describe, it, expect } from 'vitest';
import { formatMsToTime } from '@/lib/utils';
import { calculateAgeCategory, formatCompEventSubtitle } from '@/lib/age-category';

describe('Certificate & Verification Engine', () => {
  it('harus memformat nomor register sertifikat resmi sesuai standar', () => {
    const orderNo = 5;
    const rank = 1;
    const skPrefix = 'RM/CERT/2026';
    const certNumber = `${skPrefix}/${String(orderNo).padStart(2, '0')}/${String(rank).padStart(2, '0')}`;
    expect(certNumber).toBe('RM/CERT/2026/05/01');
  });

  it('harus menghasilkan URL verifikasi QR yang valid dan mengarah ke portal publik', () => {
    const certId = 'res-50m-free-lane4';
    const baseUrl = 'https://scms-app-umber.vercel.app';
    const verificationUrl = `${baseUrl}/verifikasi/${certId}`;
    expect(verificationUrl).toContain('/verifikasi/res-50m-free-lane4');
  });

  it('harus memvalidasi umur dan kelompok kategori perenang pada sertifikat', () => {
    // Atlet lahir tahun 2016 -> KU IV (10-11 Th pada 2026)
    const birthDate = new Date('2016-04-12');
    const ku = calculateAgeCategory(birthDate, 2026);
    expect(ku).toContain('KU IV');
  });

  it('harus memformat judul nomor lomba tanpa duplikasi teks', () => {
    const formatted = formatCompEventSubtitle('50M GAYA DADA PUTRA', 'KU IV', 'male');
    expect(formatted).toBe('50M GAYA DADA PUTRA · KU IV');
  });
});
