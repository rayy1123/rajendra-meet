import fs from 'fs';
import path from 'path';

export interface ScheduleItem {
  id: string;
  eventId?: string | null;
  time: string; // e.g. "09:00"
  category: string; // e.g. "Pendaftaran", "Technical Meeting", "Teknis Kolam", "Sesi Lomba"
  title: string;
  description: string;
  location?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  orderNo?: number;
  createdAt?: string;
}

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'schedules-store.json');

export const DEFAULT_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '09:00',
    category: 'Pendaftaran',
    title: 'Batas Penutupan Perubahan Nama',
    description: 'Scratch / penggantian perenang di nomor estafet dan nomor individu.',
    location: 'Sekretariat Panitia & Helpdesk IT',
    status: 'completed',
    orderNo: 1,
  },
  {
    id: 'sch-2',
    time: '14:00',
    category: 'Technical Meeting',
    title: 'Technical Meeting & Drawing Seri',
    description: 'Ruang Media Akuatik Senayan & Zoom Live bersama Official & Coach.',
    location: 'Ruang Rapat VIP & Zoom Live',
    status: 'ongoing',
    orderNo: 2,
  },
  {
    id: 'sch-3',
    time: '16:30',
    category: 'Teknis Kolam',
    title: 'Trial Touchpad & Sensor Start',
    description: 'Uji kalibrasi false start detector & touch plates lintasan 1–8.',
    location: 'Kolam Perlombaan Utama (50M)',
    status: 'upcoming',
    orderNo: 3,
  },
  {
    id: 'sch-4',
    time: '07:30',
    category: 'Hari Perlombaan',
    title: 'Pemanasan Atlet & Call Room Buka',
    description: 'Sesi pemanasan resmi kolam pemanasan & absensi atlet Call Room Sesi Pagi.',
    location: 'Call Room & Kolam Pemanasan',
    status: 'upcoming',
    orderNo: 4,
  },
];

export function readLocalSchedules(): ScheduleItem[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error reading local schedules store:', e);
  }
  return DEFAULT_SCHEDULES;
}

export function writeLocalSchedules(items: ScheduleItem[]): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local schedules store:', e);
  }
}

export function getSchedulesServer(eventId?: string): ScheduleItem[] {
  const all = readLocalSchedules();
  if (eventId && eventId !== 'all') {
    return all.filter((s) => !s.eventId || s.eventId === eventId);
  }
  return all;
}

export function saveScheduleServer(item: Omit<ScheduleItem, 'id'> & { id?: string }): ScheduleItem {
  const all = readLocalSchedules();
  const id = item.id || 'sch-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

  const existingIndex = all.findIndex((s) => s.id === id);
  const record: ScheduleItem = {
    ...item,
    id,
    createdAt: item.createdAt || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    all[existingIndex] = record;
  } else {
    all.push(record);
  }

  writeLocalSchedules(all);
  return record;
}

export function deleteScheduleServer(id: string): boolean {
  const all = readLocalSchedules();
  const filtered = all.filter((s) => s.id !== id);
  if (filtered.length !== all.length) {
    writeLocalSchedules(filtered);
    return true;
  }
  return false;
}
