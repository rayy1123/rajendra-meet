import { describe, it, expect } from 'vitest';
import {
  getAllLettersServer,
  getLetterByIdServer,
  saveLetterServer,
  deleteLetterServer,
} from '@/lib/data/letters-server';
import { OfficialLetterData } from '@/types/letters';

describe('Official Letter Generator Engine (Image #70 Spec)', () => {
  it('dapat membaca daftar surat resmi yang tersedia', async () => {
    const letters = await getAllLettersServer();
    expect(Array.isArray(letters)).toBe(true);
    expect(letters.length).toBeGreaterThanOrEqual(3);

    // Verifikasi ada template Harahap Home Tournament Series 4 (Image #70)
    const harahap = letters.find((l) => l.id === 'let-01-harahap-series4');
    expect(harahap).toBeDefined();
    expect(harahap?.kop.organizationName).toBe('HARAHAP SWIMMING SCHOOL');
    expect(harahap?.kop.bannerBadgeText).toBe('HOME TOURNAMENT SERIES 4');
    expect(harahap?.letterNumber).toBe('0926/HT-S4/HSS/IX/2026');
    expect(harahap?.leftSignature.signerName).toBe('Shafira Ramadhian, S.Pd.');
    expect(harahap?.rightSignature.signerName).toBe('Rega Partuasan Damanik, S.Pd.');
    expect(harahap?.footer.admin1Number).toBe('088 77 151189');
    expect(harahap?.footer.admin2Number).toBe('088 999 151189');
  });

  it('dapat membaca detail surat spesifik berdasarkan ID', async () => {
    const letter = await getLetterByIdServer('let-01-harahap-series4');
    expect(letter).not.toBeNull();
    expect(letter?.numberedPoints.length).toBe(3);
    expect(letter?.numberedPoints[0]).toContain('Internal Siswa');
  });

  it('dapat menyimpan dan memperbarui surat resmi', async () => {
    const sample: OfficialLetterData = {
      id: 'let-test-custom-01',
      templateType: 'undangan',
      title: 'Surat Undangan Uji Coba',
      kop: {
        organizationName: 'RAJENDRA TEST CLUB',
        locationLine: 'KOLAM RENANG GBK SENAYAN',
        bannerBadgeText: 'SERIES 2026',
        accentColor: '#0284c7',
      },
      letterNumber: '001/TEST/X/2026',
      attachment: '-',
      subject: 'Undangan Test',
      letterDate: '02 Oktober 2026',
      recipientTitle: 'Kepada Yth. Tamu Undangan',
      salutation: 'Salam Olahraga,',
      openingParagraph: 'Berikut ini adalah pengumuman resmi.',
      numberedPoints: ['Poin 1 test', 'Poin 2 test'],
      closingParagraph: 'Terima kasih atas perhatiannya.',
      leftSignature: {
        roleTitle: 'Pimpinan,',
        signerName: 'Test Pimpinan, M.Pd',
      },
      rightSignature: {
        roleTitle: 'Ketua,',
        signerName: 'Test Ketua, S.Pd',
      },
      footer: {
        admin1Number: '0812 0000 1111',
        admin2Number: '0813 0000 2222',
      },
    };

    const res = await saveLetterServer(sample);
    expect(res.ok).toBe(true);
    expect(res.letter?.id).toBe('let-test-custom-01');

    const fetched = await getLetterByIdServer('let-test-custom-01');
    expect(fetched).not.toBeNull();
    expect(fetched?.kop.organizationName).toBe('RAJENDRA TEST CLUB');
  });

  it('dapat menghapus surat uji coba', async () => {
    const delRes = await deleteLetterServer('let-test-custom-01');
    expect(delRes.ok).toBe(true);

    const fetchedAfter = await getLetterByIdServer('let-test-custom-01');
    expect(fetchedAfter).toBeNull();
  });
});
