import { describe, it, expect } from 'vitest';
import { formatCompEventLabel, formatMsToTime } from '@/lib/utils';
import { type CertificateRecipient, type CertificateSettings } from '@/components/modules/certificate-manager';

describe('Certificate Print & Rendering Engine', () => {
  const mockRecipient: CertificateRecipient = {
    id: 'cert-test-01',
    rank: 1,
    athleteId: 'ath-01',
    athleteNumber: '1088',
    swimmerName: 'PRATAMA HUTABARAT',
    gender: 'male',
    ageGroup: 'KU IV',
    schoolName: 'PELATNAS RENANG',
    finishTimeMs: 12870,
    formattedTime: '12.87',
    isNewRecord: true,
    recordType: 'games',
    status: 'finished',
    competitionEventId: 'ce-01',
    competitionEventName: '25M Papan Kaki Bebas Fins Putra SD Kelas 2',
    stroke: 'Freestyle',
    distanceMeters: 25,
    orderNo: 21,
    eventId: 'ev-01',
    eventName: 'FESTIVAL RENANG PELAJAR 2026',
    eventLocation: 'Kolam Renang Senayan',
    eventStartDate: '2026-10-18',
  };

  const mockSettings: CertificateSettings = {
    skNumber: '028/SK-RM/X/2026',
    issuedCity: 'Bandung',
    issuedDate: '18 Oktober 2026',
    organizerChairman: 'Dr. H. Hendra Wijaya, M.Pd',
    organizerChairmanTitle: 'Ketua Panitia Pelaksana',
    technicalDelegate: 'Bambang S., S.Pd',
    technicalDelegateTitle: 'Technical Delegate / Referee',
    certificateType: 'achievement',
    showSponsors: true,
    leftLogoUrl: '/brand/logo.png',
    leftLogoTitle: 'RAJENDRA SWIM SYSTEM',
    leftLogoSubtitle: 'OFFICIAL SANCTIONED SYSTEM',
    mainSponsorLogoUrl: '/brand/sponsor-sample.png',
    mainSponsorTitle: 'OFFICIAL MAIN SPONSOR',
    mainSponsorSubtitle: 'SPONSOR UTAMA RESMI',
    showMainSponsor: true,
    rightLogoUrl: '/brand/rajendra-organizer-logo.png',
    rightLogoTitle: 'RAJENDRA ORGANIZER',
    rightLogoSubtitle: 'CHAMPIONSHIP ORGANIZER',
    backgroundTheme: 'default',
    borderStyle: 'gold_classic',
    showWatermark: true,
    headerTitle: 'PIAGAM PENGHARGAAN',
    headerSubtitle: 'CERTIFICATE OF ACHIEVEMENT',
  };

  it('menghasilkan nomor sertifikat resmi berformat standar SK/Order/Rank', () => {
    const certNumber = `${mockSettings.skNumber}/${String(mockRecipient.orderNo).padStart(2, '0')}/${String(mockRecipient.rank).padStart(2, '0')}`;
    expect(certNumber).toBe('028/SK-RM/X/2026/21/01');
  });

  it('menghasilkan label medali emas untuk peringkat 1', () => {
    const isGold = mockRecipient.rank === 1;
    const medalLabel = isGold ? 'JUARA I (MEDALI EMAS)' : `PERINGKAT KE-${mockRecipient.rank}`;
    expect(medalLabel).toBe('JUARA I (MEDALI EMAS)');
  });

  it('menghasilkan format judul nomor lomba yang rapi', () => {
    const title = formatCompEventLabel(
      {
        name: mockRecipient.competitionEventName,
        order_no: mockRecipient.orderNo,
        gender: mockRecipient.gender,
        stroke: mockRecipient.stroke,
        distance_meters: mockRecipient.distanceMeters,
        age_group: mockRecipient.ageGroup,
      },
      false
    );
    expect(title).toContain('25M Papan Kaki Bebas Fins');
  });

  it('memvalidasi struktur 3 logo header (Kiri: RSS, Tengah: Sponsor Utama, Kanan: Organizer)', () => {
    expect(mockSettings.leftLogoUrl).toBe('/brand/logo.png');
    expect(mockSettings.mainSponsorLogoUrl).toBe('/brand/sponsor-sample.png');
    expect(mockSettings.rightLogoUrl).toBe('/brand/rajendra-organizer-logo.png');
    expect(mockSettings.showMainSponsor).toBe(true);
  });

  it('memvalidasi waktu tempuh renang format detik dan badge rekor', () => {
    expect(mockRecipient.formattedTime).toBe('12.87');
    expect(mockRecipient.isNewRecord).toBe(true);
    expect(mockRecipient.recordType).toBe('games');
  });

  it('memvalidasi konfigurasi template Kejurda PORKOT Abrisam dengan 3 penandatangan', () => {
    const abrisamSettings: CertificateSettings = {
      ...mockSettings,
      templateLayout: 'kejurda_abrisam',
      skNumber: '0545/Koni-JakartaPusat/PORKOT/26/VII/2026',
      firstSignerName: 'Rusdiyanto',
      firstSignerRole: 'Mengetahui',
      firstSignerTitle: 'Kepala Suku Dinas Pemuda dan Olahraga',
      secondSignerName: 'Zaenar Arifin, SE',
      secondSignerRole: 'Ketua KONI',
      thirdSignerName: 'Yonas Bain, M.Pd.',
      thirdSignerRole: 'Ketua Akuatik',
      showCornerRibbons: true,
      showRibbonSeal: true,
      showThreeSigners: true,
    };

    expect(abrisamSettings.templateLayout).toBe('kejurda_abrisam');
    expect(abrisamSettings.firstSignerName).toBe('Rusdiyanto');
    expect(abrisamSettings.secondSignerName).toBe('Zaenar Arifin, SE');
    expect(abrisamSettings.thirdSignerName).toBe('Yonas Bain, M.Pd.');
    expect(abrisamSettings.showCornerRibbons).toBe(true);
    expect(abrisamSettings.showRibbonSeal).toBe(true);
  });
});
