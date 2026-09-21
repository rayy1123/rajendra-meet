import fs from 'fs';
import path from 'path';

export interface EventSettings {
  eventId: string;
  fee_per_event: number;
  use_unique_code: boolean;
  unique_code_mode: string;
  unique_code_fixed: number;
  unique_code_min: number;
  unique_code_max: number;
  bank_name: string;
  bank_account_no: string;
  bank_account_name: string;
  updatedAt?: string;
}

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'event-settings-store.json');

export const DEFAULT_EVENT_SETTINGS: Omit<EventSettings, 'eventId'> = {
  fee_per_event: 100000,
  use_unique_code: true,
  unique_code_mode: 'random_3_digit',
  unique_code_fixed: 0,
  unique_code_min: 100,
  unique_code_max: 999,
  bank_name: 'Bank Central Asia (BCA)',
  bank_account_no: '123347485',
  bank_account_name: 'Panitia Pelaksana Renang',
};

export function getEventSettings(eventId: string): EventSettings {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data: Record<string, EventSettings> = JSON.parse(raw);
      if (data && data[eventId]) {
        return {
          ...DEFAULT_EVENT_SETTINGS,
          ...data[eventId],
          eventId,
        };
      }
    }
  } catch (e) {
    console.error('Error reading event-settings-store.json:', e);
  }

  return {
    ...DEFAULT_EVENT_SETTINGS,
    eventId,
  };
}

export function saveEventSettings(eventId: string, settings: Partial<EventSettings>): EventSettings {
  try {
    let allData: Record<string, EventSettings> = {};
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      allData = JSON.parse(raw) || {};
    }

    const current = allData[eventId] || {
      ...DEFAULT_EVENT_SETTINGS,
      eventId,
    };

    const updated: EventSettings = {
      ...current,
      ...settings,
      eventId,
      updatedAt: new Date().toISOString(),
    };

    allData[eventId] = updated;

    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(allData, null, 2), 'utf-8');

    return updated;
  } catch (e) {
    console.error('Error writing event-settings-store.json:', e);
    return {
      ...DEFAULT_EVENT_SETTINGS,
      ...settings,
      eventId,
    };
  }
}
