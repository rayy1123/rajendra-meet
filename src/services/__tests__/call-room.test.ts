import { describe, it, expect, beforeEach } from 'vitest';
import {
  readCallRoomStore,
  writeCallRoomStore,
  updateCallRoomStatusServer,
  bulkUpdateCallRoomHeatServer,
  getAllCallRoomCheckins,
  getCallRoomStatus,
  type CallRoomStatus,
} from '@/lib/data/call-room-server';

describe('Call Room (Meja Panggil) Service', () => {
  beforeEach(() => {
    // Reset store with empty checkins
    writeCallRoomStore({ checkins: {} });
  });

  it('harus dapat membaca dan menulis store check-in call room', () => {
    const store = readCallRoomStore();
    expect(store).toBeDefined();
    expect(store.checkins).toEqual({});
  });

  it('harus dapat memperbarui status check-in atlet ke "called" dan "cleared"', () => {
    const assignmentId = 'assign-lane-4';

    // 1. Panggil atlet ke Call Room
    const itemCalled = updateCallRoomStatusServer(assignmentId, {
      heat_id: 'heat-1',
      competition_event_id: 'ce-50m-free',
      event_id: 'event-rajendra-2026',
      lane_number: 4,
      athlete_name: 'Aditya Sihombing',
      athlete_number: '104',
      school_name: 'Hiu Akuatik',
      status: 'called',
      checked_in_by: 'Wasit Call Room 1',
    });

    expect(itemCalled.status).toBe('called');
    expect(itemCalled.lane_number).toBe(4);
    expect(itemCalled.athlete_name).toBe('Aditya Sihombing');
    expect(itemCalled.checked_in_at).toBeDefined();

    // 2. Lepas atlet menuju kolam (cleared)
    const itemCleared = updateCallRoomStatusServer(assignmentId, {
      status: 'cleared',
    });

    expect(itemCleared.status).toBe('cleared');

    // 3. Verifikasi getCallRoomStatus
    const fetched = getCallRoomStatus(assignmentId);
    expect(fetched?.status).toBe('cleared');
    expect(fetched?.athlete_name).toBe('Aditya Sihombing');
  });

  it('harus dapat mencatat atlet yang mengundurkan diri (scratch) dengan alasan', () => {
    const assignmentId = 'assign-lane-2';

    const itemScratched = updateCallRoomStatusServer(assignmentId, {
      heat_id: 'heat-1',
      competition_event_id: 'ce-50m-free',
      event_id: 'event-rajendra-2026',
      lane_number: 2,
      athlete_name: 'Bima Paralayang',
      status: 'scratched',
      scratch_reason: 'Sakit / Demam',
    });

    expect(itemScratched.status).toBe('scratched');
    expect(itemScratched.scratch_reason).toBe('Sakit / Demam');
  });

  it('harus dapat melakukan bulk update untuk seluruh atlet dalam satu Seri (Heat)', () => {
    const mockAssignments = [
      {
        assignment_id: 'a-1',
        heat_id: 'h-1',
        competition_event_id: 'ce-1',
        event_id: 'ev-1',
        lane_number: 1,
        athlete_name: 'Perenang 1',
      },
      {
        assignment_id: 'a-2',
        heat_id: 'h-1',
        competition_event_id: 'ce-1',
        event_id: 'ev-1',
        lane_number: 2,
        athlete_name: 'Perenang 2',
      },
      {
        assignment_id: 'a-3',
        heat_id: 'h-1',
        competition_event_id: 'ce-1',
        event_id: 'ev-1',
        lane_number: 3,
        athlete_name: 'Perenang 3',
      },
    ];

    // Bulk update to called
    const bulkResults = bulkUpdateCallRoomHeatServer(
      'h-1',
      mockAssignments,
      'called',
      'Marshall Meja 1'
    );

    expect(bulkResults.length).toBe(3);
    expect(bulkResults.every((r) => r.status === 'called')).toBe(true);

    // Verify filter by event & compEvent
    const all = getAllCallRoomCheckins('ev-1', 'ce-1');
    expect(all.length).toBe(3);
  });
});
