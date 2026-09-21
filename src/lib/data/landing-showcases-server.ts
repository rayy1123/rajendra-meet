import fs from 'fs';
import path from 'path';
import { ShowcaseItem, getDefaultsByType } from './landing-showcases';

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'showcases-store.json');

export function getServerShowcases(type: ShowcaseItem['type']): ShowcaseItem[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data[type]) && data[type].length > 0) {
        return data[type];
      }
    }
  } catch (e) {
    console.error('Error reading server showcases:', e);
  }
  return getDefaultsByType(type);
}

export function saveServerShowcases(type: ShowcaseItem['type'], items: ShowcaseItem[]): boolean {
  try {
    let allData: Record<string, ShowcaseItem[]> = {};
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      allData = JSON.parse(raw);
    }
    allData[type] = items;
    fs.writeFileSync(STORE_PATH, JSON.stringify(allData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving server showcases:', e);
    return false;
  }
}
