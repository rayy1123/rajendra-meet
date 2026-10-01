import fs from 'fs';
import path from 'path';

export interface AdminOtpRecord {
  id: string;
  email: string;
  fullName?: string;
  code: string;
  createdAt: string;
  expiresAt: number;
  status: 'pending' | 'sent' | 'fallback_to_admin' | 'verified' | 'expired';
  viaEmail: boolean;
  errorMessage?: string;
}

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'admin-otp-store.json');

function ensureStoreFile(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('[AdminOtpStore] Error ensuring store file:', err);
  }
}

export function getAdminOtpRecords(): AdminOtpRecord[] {
  try {
    ensureStoreFile();
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const now = Date.now();
        // Update expired items
        return list.map((item: AdminOtpRecord): AdminOtpRecord => {
          if (item.status !== 'verified' && now > item.expiresAt) {
            return { ...item, status: 'expired' as const };
          }
          return item;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
  } catch (err) {
    console.error('[AdminOtpStore] Read error:', err);
  }
  return [];
}

export function saveAdminOtpRecord(record: {
  email: string;
  fullName?: string;
  code: string;
  expiresAt: number;
  status: AdminOtpRecord['status'];
  viaEmail: boolean;
  errorMessage?: string;
}): AdminOtpRecord {
  ensureStoreFile();
  const current = getAdminOtpRecords();
  const now = new Date().toISOString();
  const newRecord: AdminOtpRecord = {
    id: `otp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: record.email.trim().toLowerCase(),
    fullName: record.fullName?.trim() || 'Peserta',
    code: record.code,
    createdAt: now,
    expiresAt: record.expiresAt,
    status: record.status,
    viaEmail: record.viaEmail,
    errorMessage: record.errorMessage,
  };

  // Simpan maksimal 100 entri terbaru
  const filtered = current.filter((r) => r.email !== newRecord.email || r.status === 'verified');
  const updated = [newRecord, ...filtered].slice(0, 100);

  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AdminOtpStore] Write error:', err);
  }

  return newRecord;
}

export function updateAdminOtpStatus(email: string, status: AdminOtpRecord['status']): void {
  ensureStoreFile();
  const current = getAdminOtpRecords();
  const cleanEmail = email.trim().toLowerCase();
  let changed = false;

  const updated = current.map((item) => {
    if (item.email === cleanEmail && item.status !== 'verified') {
      changed = true;
      return { ...item, status };
    }
    return item;
  });

  if (changed) {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('[AdminOtpStore] Update status error:', err);
    }
  }
}
