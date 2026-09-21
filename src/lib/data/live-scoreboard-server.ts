import fs from 'fs';
import path from 'path';
import { EventLiveConfig, LiveScoreboardMode } from './live-scoreboard-settings';

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'live-scoreboard-store.json');

export function getEventLiveConfig(eventId: string): EventLiveConfig {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data: Record<string, EventLiveConfig> = JSON.parse(raw);
      if (data && data[eventId]) {
        return data[eventId];
      }
    }
  } catch (e) {
    console.error('Error reading live scoreboard store:', e);
  }

  // Default mode adalah 'auto'
  return {
    eventId,
    mode: 'auto',
  };
}

export function getAllLiveConfigs(): Record<string, EventLiveConfig> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.error('Error reading live scoreboard store:', e);
  }
  return {};
}

export function saveEventLiveConfig(eventId: string, mode: LiveScoreboardMode): boolean {
  try {
    let allData: Record<string, EventLiveConfig> = {};
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      allData = JSON.parse(raw) || {};
    }

    allData[eventId] = {
      eventId,
      mode,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORE_PATH, JSON.stringify(allData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving live scoreboard store:', e);
    return false;
  }
}
