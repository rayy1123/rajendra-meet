import fs from 'fs';
import path from 'path';

export type ChecklistCategory =
  | 'rekognisi'
  | 'technical_meeting'
  | 'timing_system'
  | 'fasilitas_kolam'
  | 'perangkat_wasit'
  | 'administrasi_td';

export type ChecklistStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

export interface TechnicalChecklistItem {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string;
  scheduledTime?: string;
  status: ChecklistStatus;
  pic: string;
  location: string;
  notes?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  orderNo: number;
}

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'technical-checklist-store.json');

export function readLocalChecklist(): TechnicalChecklistItem[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error reading local technical checklist store:', e);
  }
  return [];
}

export function writeLocalChecklist(items: TechnicalChecklistItem[]): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local technical checklist store:', e);
  }
}

export function getChecklistServer(category?: string): TechnicalChecklistItem[] {
  const all = readLocalChecklist();
  if (category && category !== 'all') {
    return all.filter((item) => item.category === category);
  }
  return all.sort((a, b) => a.orderNo - b.orderNo);
}

export function updateChecklistItemServer(
  id: string,
  updates: Partial<TechnicalChecklistItem>
): TechnicalChecklistItem | null {
  const all = readLocalChecklist();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const updated: TechnicalChecklistItem = {
    ...all[index],
    ...updates,
    id: all[index].id, // id immutable
  };

  all[index] = updated;
  writeLocalChecklist(all);
  return updated;
}

export function addChecklistItemServer(
  item: Omit<TechnicalChecklistItem, 'id' | 'orderNo'> & { id?: string; orderNo?: number }
): TechnicalChecklistItem {
  const all = readLocalChecklist();
  const id = item.id || 'chk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const orderNo = item.orderNo ?? (all.length > 0 ? Math.max(...all.map((i) => i.orderNo)) + 1 : 1);

  const newItem: TechnicalChecklistItem = {
    ...item,
    id,
    orderNo,
  };

  all.push(newItem);
  writeLocalChecklist(all);
  return newItem;
}
