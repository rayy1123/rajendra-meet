import fs from 'fs';
import path from 'path';
import { EventLiveConfig, LiveScoreboardMode, ResultsVisibilityMode } from './live-scoreboard-settings';

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'live-scoreboard-store.json');

export function getEventLiveConfig(eventId: string): EventLiveConfig {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data: Record<string, EventLiveConfig> = JSON.parse(raw);
      if (data && data[eventId]) {
        const item = data[eventId];
        return {
          eventId,
          mode: item.mode || 'auto',
          resultsMode: item.resultsMode || 'auto',
          updatedAt: item.updatedAt,
          updatedBy: item.updatedBy,
        };
      }
    }
  } catch (e) {
    console.error('Error reading live scoreboard store:', e);
  }

  // Default mode adalah 'auto'
  return {
    eventId,
    mode: 'auto',
    resultsMode: 'auto',
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

    const current = allData[eventId] || {
      eventId,
      mode: 'auto',
      resultsMode: 'auto',
    };

    allData[eventId] = {
      ...current,
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

export function saveEventResultsConfig(eventId: string, resultsMode: ResultsVisibilityMode): boolean {
  try {
    let allData: Record<string, EventLiveConfig> = {};
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      allData = JSON.parse(raw) || {};
    }

    const current = allData[eventId] || {
      eventId,
      mode: 'auto',
      resultsMode: 'auto',
    };

    allData[eventId] = {
      ...current,
      eventId,
      resultsMode,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORE_PATH, JSON.stringify(allData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving results visibility config:', e);
    return false;
  }
}

