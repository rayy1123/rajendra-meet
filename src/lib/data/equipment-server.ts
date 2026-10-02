import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

export interface EquipmentItem {
  id: string;
  name: string;
  location: string;
  category: string;
  status: 'done' | 'in_progress' | 'scheduled' | 'overdue';
  due_date?: string | null;
  technician?: string | null;
  note?: string | null;
  created_at?: string;
}

// ponytail: atomic JSON file persistence for arena telemetries; upgrade to Postgres pub/sub if telemetry ingestion rate > 50 msg/sec
const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'equipment-store.json');

export const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'eq-1',
    name: 'Set Touchpad OSV9 Lintasan 1–8',
    location: 'Dinding Kolam Finish (50M)',
    category: 'Touchpad Plates',
    status: 'done',
    due_date: '2026-10-15',
    technician: 'Tim Swiss Timing & Budi Santoso',
    note: 'Sensitivitas 2.5 kg terkalibrasi normal, bebas bocor air.',
  },
  {
    id: 'eq-2',
    name: 'Konsol Utama Swiss Timing Quantum',
    location: 'Meja Operator Utama / Ruang Timing',
    category: 'Timing Console',
    status: 'done',
    due_date: '2026-10-18',
    technician: 'Budi Santoso (Head IT)',
    note: 'Firmware v4.8 terinstal, backup baterai UPS standby 4 jam.',
  },
  {
    id: 'eq-3',
    name: 'Kabel Terminal BUS & Horn False Start',
    location: 'Podium Starting Block 1–8',
    category: 'Sensor Start',
    status: 'in_progress',
    due_date: '2026-10-12',
    technician: 'Tim Logistik Kolam',
    note: 'Pengecekan kontinuitas jalur kabel lintasan 4 & 5 sedang dilakukan.',
  },
  {
    id: 'eq-4',
    name: 'Videotron / LED Matrix P10 HD Arena',
    location: 'Tribun Barat Kolam Akuatik',
    category: 'Scoreboard LED',
    status: 'scheduled',
    due_date: '2026-10-20',
    technician: 'Vendor Display Arena',
    note: 'Jadwal uji coba transmisi HDMI & kontroler Novastar.',
  },
  {
    id: 'eq-5',
    name: 'Stopwatch Cadangan Seiko S141 (8 Unit)',
    location: 'Meja Call Room & Chief Timer',
    category: 'Timer Manual',
    status: 'done',
    due_date: '2026-10-25',
    technician: 'Koordinator Juri Waktu',
    note: '8 unit baterai baru, memory 300 lap siap pakai untuk juri cadangan.',
  },
];

export function readLocalEquipment(): EquipmentItem[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error reading local equipment store:', e);
  }
  return DEFAULT_EQUIPMENT;
}

export function writeLocalEquipment(items: EquipmentItem[]): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local equipment store:', e);
  }
}

export async function getEquipmentServer(): Promise<EquipmentItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('equipment_maintenance')
      .select('*')
      .order('due_date', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as EquipmentItem[];
    }
  } catch (e) {
    // Supabase fallback to local
  }
  return readLocalEquipment();
}

export async function saveEquipmentServer(
  input: Omit<EquipmentItem, 'id' | 'created_at'> & { id?: string }
): Promise<EquipmentItem> {
  const id = input.id || 'eq-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  const record: EquipmentItem = {
    ...input,
    id,
    created_at: now,
  };

  try {
    const supabase = await createClient();
    if (input.id) {
      await supabase
        .from('equipment_maintenance')
        .update({
          name: input.name,
          location: input.location,
          category: input.category,
          status: input.status,
          due_date: input.due_date,
          technician: input.technician,
          note: input.note,
        })
        .eq('id', input.id);
    } else {
      await supabase.from('equipment_maintenance').insert({
        id,
        name: input.name,
        location: input.location,
        category: input.category,
        status: input.status,
        due_date: input.due_date,
        technician: input.technician,
        note: input.note,
      });
    }
  } catch (e) {
    // Sync to local
  }

  // Sync to local JSON store
  const current = readLocalEquipment();
  const existingIdx = current.findIndex((it) => it.id === id);
  if (existingIdx >= 0) {
    current[existingIdx] = record;
  } else {
    current.push(record);
  }
  writeLocalEquipment(current);

  return record;
}

export async function deleteEquipmentServer(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    await supabase.from('equipment_maintenance').delete().eq('id', id);
  } catch (e) {
    // local fallback
  }

  const current = readLocalEquipment();
  const filtered = current.filter((it) => it.id !== id);
  if (filtered.length !== current.length) {
    writeLocalEquipment(filtered);
    return true;
  }
  return false;
}
