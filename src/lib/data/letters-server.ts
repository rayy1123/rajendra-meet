import fs from 'fs';
import path from 'path';
import { OfficialLetterData } from '@/types/letters';

// ponytail: file-backed JSON store for official letters generator; upgrade to Postgres table when multi-tenant isolation required
const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'letters-store.json');

function ensureStoreFile(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, '[]', 'utf-8');
  } catch (err) {
    console.error('[LettersStore] Ensure store failed:', err);
  }
}

export function readLocalLetters(): OfficialLetterData[] {
  try {
    ensureStoreFile();
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('[LettersStore] Read local letters failed:', err);
  }
  return [];
}

export function writeLocalLetters(items: OfficialLetterData[]): void {
  try {
    ensureStoreFile();
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LettersStore] Write local letters failed:', err);
  }
}

export async function getAllLettersServer(): Promise<OfficialLetterData[]> {
  return readLocalLetters();
}

export async function getLetterByIdServer(id: string): Promise<OfficialLetterData | null> {
  const all = readLocalLetters();
  return all.find((l) => l.id === id) || null;
}

export async function saveLetterServer(letter: OfficialLetterData): Promise<{ ok: boolean; letter?: OfficialLetterData; error?: string }> {
  try {
    const all = readLocalLetters();
    const now = new Date().toISOString();
    const id = letter.id || `let_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const record: OfficialLetterData = {
      ...letter,
      id,
      updatedAt: now,
      createdAt: letter.createdAt || now,
    };

    const exists = all.some((l) => l.id === id);
    const updated = exists ? all.map((l) => (l.id === id ? record : l)) : [record, ...all];
    writeLocalLetters(updated);

    return { ok: true, letter: record };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan surat.';
    return { ok: false, error: msg };
  }
}

export async function deleteLetterServer(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const all = readLocalLetters();
    const updated = all.filter((l) => l.id !== id);
    writeLocalLetters(updated);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus surat.';
    return { ok: false, error: msg };
  }
}
