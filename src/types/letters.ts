export interface LetterSignature {
  roleTitle: string; // e.g. "Owner Harahap Swimming School,"
  signerName: string; // e.g. "Shafira Ramadhian, S.Pd."
  signerTitle?: string; // e.g. "NIP / Pembina"
  signatureUrl?: string | null; // Digital signature image (transparent PNG / SVG)
  stampUrl?: string | null; // Stamp / stempel image (transparent PNG / SVG)
  showSignature?: boolean;
  showStamp?: boolean;
}

export interface LetterKop {
  logoUrl?: string | null;
  bannerBadgeText?: string; // e.g. "HOME TOURNAMENT SERIES 4"
  organizationName: string; // e.g. "HARAHAP SWIMMING SCHOOL"
  subOrganizationName?: string;
  locationLine: string; // e.g. "KOLAM RENANG GRJS BULUNGAN JAKARTA SELATAN"
  dateLine?: string; // e.g. "SABTU, 17 OKTOBER 2026"
  logoSecondaryUrl?: string | null;
  accentColor?: string; // e.g. "#0052cc"
}

export interface LetterFooter {
  admin1Label?: string;
  admin1Number: string; // e.g. "088 77 151189"
  admin2Label?: string;
  admin2Number: string; // e.g. "088 999 151189"
  showPartners?: boolean;
  partnerLogos?: { id: string; name: string; logoUrl: string }[];
  backgroundColor?: string;
}

export interface OfficialLetterData {
  id: string;
  templateType: 'pemberitahuan' | 'undangan' | 'dispensasi' | 'keterangan' | 'kustom';
  title: string; // e.g. "Pemberitahuan Perubahan Home Tournament Series 4"

  // Kop Surat
  kop: LetterKop;

  // Metadata Surat
  letterNumber: string; // e.g. "0926/HT-S4/HSS/IX/2026"
  attachment: string; // e.g. "-"
  subject: string; // e.g. "Pemberitahuan"
  letterDate: string; // e.g. "26 September 2026"
  recipientTitle: string; // e.g. "Kepada\nYth. Bapak / Ibu\nPeserta Home Tournament\nSeries IV"

  // Isi Surat
  salutation: string; // e.g. "Salam Olahraga,"
  openingParagraph: string; // e.g. "Diberitahukan bahwa untuk Home Tournament Series 4 Harahap Swimming School ada beberapa perubahan, antara lain :"
  numberedPoints: string[]; // e.g. ["Peserta diputuskan hanya untuk Internal...", ...]
  closingParagraph: string; // e.g. "Demikian hal ini disampaikan, atas perhatiannya diucapkan terima kasih."

  // Watermark
  watermarkText?: string; // e.g. "HARAHAP SWIMMING SCHOOL"
  showWatermark?: boolean;

  // Tanda Tangan
  leftSignature: LetterSignature;
  rightSignature: LetterSignature;

  // Footer Kontak & Sponsor
  footer: LetterFooter;

  createdAt?: string;
  updatedAt?: string;
}
