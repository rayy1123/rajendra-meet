import fs from 'fs';
import path from 'path';

export type CallRoomStatus = 'waiting' | 'called' | 'cleared' | 'scratched' | 'no_show';

export interface CallRoomCheckinItem {
  id: string; // usually heat_assignment_id
  assignment_id: string;
  heat_id: string;
  competition_event_id: string;
  event_id: string;
  lane_number: number;
  athlete_id?: string;
  athlete_name: string;
  athlete_number?: string;
  school_name?: string;
  status: CallRoomStatus;
  checked_in_at?: string | null;
  checked_in_by?: string | null;
  scratch_reason?: string | null;
  notes?: string;
  updated_at: string;
}

interface CallRoomStore {
  checkins: Record<string, CallRoomCheckinItem>;
}

const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'call-room-store.json');

export function readCallRoomStore(): CallRoomStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        return {
          checkins: data.checkins || {},
        };
      }
    }
  } catch (e) {
    console.error('Error reading call room store:', e);
  }
  return { checkins: {} };
}

export function writeCallRoomStore(store: CallRoomStore): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing call room store:', e);
  }
}

export function getCallRoomStatus(assignmentId: string): CallRoomCheckinItem | null {
  const store = readCallRoomStore();
  return store.checkins[assignmentId] || null;
}

export function getAllCallRoomCheckins(eventId?: string, compEventId?: string): CallRoomCheckinItem[] {
  const store = readCallRoomStore();
  const list = Object.values(store.checkins);
  return list.filter((item) => {
    if (eventId && eventId !== 'all' && item.event_id !== eventId) return false;
    if (compEventId && compEventId !== 'all' && item.competition_event_id !== compEventId) return false;
    return true;
  });
}

export function updateCallRoomStatusServer(
  assignmentId: string,
  payload: Partial<CallRoomCheckinItem> & {
    heat_id?: string;
    competition_event_id?: string;
    event_id?: string;
    lane_number?: number;
    athlete_name?: string;
    athlete_number?: string;
    school_name?: string;
  }
): CallRoomCheckinItem {
  const store = readCallRoomStore();
  const existing = store.checkins[assignmentId];

  const now = new Date().toISOString();
  const updated: CallRoomCheckinItem = {
    id: assignmentId,
    assignment_id: assignmentId,
    heat_id: payload.heat_id || existing?.heat_id || '',
    competition_event_id: payload.competition_event_id || existing?.competition_event_id || '',
    event_id: payload.event_id || existing?.event_id || '',
    lane_number: payload.lane_number ?? existing?.lane_number ?? 1,
    athlete_id: payload.athlete_id || existing?.athlete_id,
    athlete_name: payload.athlete_name || existing?.athlete_name || 'Atlet',
    athlete_number: payload.athlete_number || existing?.athlete_number,
    school_name: payload.school_name || existing?.school_name,
    status: payload.status || existing?.status || 'waiting',
    checked_in_at:
      payload.status === 'called' || payload.status === 'cleared'
        ? payload.checked_in_at || existing?.checked_in_at || now
        : existing?.checked_in_at || null,
    checked_in_by: payload.checked_in_by || existing?.checked_in_by || null,
    scratch_reason: payload.scratch_reason !== undefined ? payload.scratch_reason : existing?.scratch_reason || null,
    notes: payload.notes !== undefined ? payload.notes : existing?.notes || '',
    updated_at: now,
  };

  store.checkins[assignmentId] = updated;
  writeCallRoomStore(store);
  return updated;
}

export function bulkUpdateCallRoomHeatServer(
  heatId: string,
  assignments: Array<{
    assignment_id: string;
    heat_id: string;
    competition_event_id: string;
    event_id: string;
    lane_number: number;
    athlete_name: string;
    athlete_number?: string;
    school_name?: string;
  }>,
  targetStatus: CallRoomStatus,
  operatorName?: string
): CallRoomCheckinItem[] {
  const store = readCallRoomStore();
  const now = new Date().toISOString();
  const results: CallRoomCheckinItem[] = [];

  for (const a of assignments) {
    const existing = store.checkins[a.assignment_id];
    // Jangan overwrite yang sudah scratched jika targetStatus adalah called/cleared
    if (existing?.status === 'scratched' && targetStatus !== 'waiting') {
      results.push(existing);
      continue;
    }

    const updated: CallRoomCheckinItem = {
      id: a.assignment_id,
      assignment_id: a.assignment_id,
      heat_id: a.heat_id,
      competition_event_id: a.competition_event_id,
      event_id: a.event_id,
      lane_number: a.lane_number,
      athlete_name: a.athlete_name,
      athlete_number: a.athlete_number || existing?.athlete_number,
      school_name: a.school_name || existing?.school_name,
      status: targetStatus,
      checked_in_at: targetStatus === 'called' || targetStatus === 'cleared' ? now : null,
      checked_in_by: operatorName || 'Call Room Marshall',
      scratch_reason: targetStatus === 'scratched' ? existing?.scratch_reason || 'Scratch Panitia' : null,
      notes: existing?.notes || '',
      updated_at: now,
    };

    store.checkins[a.assignment_id] = updated;
    results.push(updated);
  }

  writeCallRoomStore(store);
  return results;
}
