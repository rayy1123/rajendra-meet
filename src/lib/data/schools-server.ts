import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

export interface SchoolItem {
  id: string;
  name: string;
  city?: string | null;
  province?: string | null;
  coach_name?: string | null;
  created_at?: string;
}

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'schools-store.json');

export function readLocalSchools(): SchoolItem[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw) || [];
    }
  } catch (e) {
    console.error('Error reading local schools store:', e);
  }
  return [];
}

export function writeLocalSchools(items: SchoolItem[]): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local schools store:', e);
  }
}

export async function getSchoolsServer(): Promise<SchoolItem[]> {
  const local = readLocalSchools();
  const schoolMap = new Map<string, SchoolItem>();

  // Add local schools first
  local.forEach((s) => {
    schoolMap.set(s.name.toLowerCase().trim(), s);
  });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, city, province, coach_name, created_at')
      .order('name', { ascending: true });

    if (!error && data) {
      data.forEach((s: any) => {
        schoolMap.set(s.name.toLowerCase().trim(), {
          id: s.id,
          name: s.name,
          city: s.city || null,
          province: s.province || null,
          coach_name: s.coach_name || null,
          created_at: s.created_at,
        });
      });
    }
  } catch (e) {
    console.warn('Supabase fetch schools notice:', e);
  }

  return Array.from(schoolMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

export async function saveSchoolServer(input: {
  name: string;
  city?: string | null;
  province?: string | null;
  coach_name?: string | null;
}): Promise<SchoolItem> {
  const cleanName = input.name.trim();
  const cleanCity = input.city?.trim() || null;
  const cleanProvince = input.province?.trim() || null;
  const cleanCoach = input.coach_name?.trim() || null;

  // Check if school already exists by name
  const existingList = await getSchoolsServer();
  const existing = existingList.find((s) => s.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }

  let dbRecord: SchoolItem | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: cleanName,
        city: cleanCity || '',
        province: cleanProvince || '',
        coach_name: cleanCoach || null,
      })
      .select('id, name, city, province, coach_name, created_at')
      .single();

    if (!error && data) {
      dbRecord = {
        id: data.id,
        name: data.name,
        city: data.city || null,
        province: data.province || null,
        coach_name: data.coach_name || null,
        created_at: data.created_at,
      };
    }
  } catch (e) {
    console.warn('Supabase insert school notice:', e);
  }

  const record: SchoolItem = dbRecord || {
    id: 'sch-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    name: cleanName,
    city: cleanCity,
    province: cleanProvince,
    coach_name: cleanCoach,
    created_at: new Date().toISOString(),
  };

  const currentLocal = readLocalSchools();
  if (!currentLocal.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
    currentLocal.push(record);
    writeLocalSchools(currentLocal);
  }

  return record;
}
