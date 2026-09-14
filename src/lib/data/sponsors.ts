export interface SponsorItem {
  id: string;
  name: string;
  tier: 'title' | 'platinum' | 'gold' | 'silver' | 'partner';
  logoUrl: string;
  websiteUrl?: string | null;
  isActive: boolean;
  orderNo: number;
}

export const DEFAULT_SPONSORS: SponsorItem[] = [
  {
    id: 'sp-1',
    name: 'Rajendra Aquatic Official',
    tier: 'title',
    logoUrl: '/brand/logo.png',
    websiteUrl: 'https://rajendra.id',
    isActive: true,
    orderNo: 1,
  },
  {
    id: 'sp-2',
    name: 'Speedo Indonesia',
    tier: 'platinum',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Speedo_logo.svg/320px-Speedo_logo.svg.png',
    websiteUrl: 'https://speedo.com',
    isActive: true,
    orderNo: 2,
  },
  {
    id: 'sp-3',
    name: 'Arena Water Instinct',
    tier: 'platinum',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Arena_logo.svg/320px-Arena_logo.svg.png',
    websiteUrl: 'https://arenawaterinstinct.com',
    isActive: true,
    orderNo: 3,
  },
  {
    id: 'sp-4',
    name: 'Bank Central Asia (BCA)',
    tier: 'gold',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/320px-Bank_Central_Asia.svg.png',
    websiteUrl: 'https://bca.co.id',
    isActive: true,
    orderNo: 4,
  },
  {
    id: 'sp-5',
    name: 'Pocari Sweat',
    tier: 'gold',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Pocari_Sweat_logo.svg/320px-Pocari_Sweat_logo.svg.png',
    websiteUrl: 'https://pocarisweat.id',
    isActive: true,
    orderNo: 5,
  },
  {
    id: 'sp-6',
    name: 'Hydro Coco',
    tier: 'partner',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Kalbe_Farma.svg/320px-Kalbe_Farma.svg.png',
    websiteUrl: 'https://hydrococo.com',
    isActive: true,
    orderNo: 6,
  },
];

export const SPONSORS_STORAGE_KEY = 'scms_sponsors_list';

export function getCachedSponsors(fallback: SponsorItem[] = DEFAULT_SPONSORS): SponsorItem[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(SPONSORS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse cached sponsors:', e);
  }
  return fallback;
}

export function saveCachedSponsors(sponsors: SponsorItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(sponsors));
  } catch (e) {
    console.error('Failed to save sponsors to cache:', e);
  }
}

export function resetCachedSponsors(): SponsorItem[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SPONSORS_STORAGE_KEY);
    } catch {}
  }
  return DEFAULT_SPONSORS;
}
