import { describe, it, expect } from 'vitest';
import {
  getSchedulesServer,
  saveScheduleServer,
  deleteScheduleServer,
} from '@/lib/data/schedules-server';

describe('Manajemen Jadwal & Agenda Kejuaraan', () => {
  it('dapat membaca daftar jadwal awal (default)', () => {
    const list = getSchedulesServer();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.some((s) => s.title.includes('Batas Penutupan'))).toBe(true);
  });

  it('dapat membuat, membaca, dan menghapus agenda baru', () => {
    const newAgenda = saveScheduleServer({
      time: '19:00',
      category: 'Upacara',
      title: 'Upacara Pembukaan & Parade Kontingen',
      description: 'Defile seluruh perenang dan sambutan ketua panitia.',
      location: 'Grand Ballroom Venue Akuatik',
      status: 'upcoming',
    });

    expect(newAgenda.id).toBeDefined();
    expect(newAgenda.time).toBe('19:00');

    const updatedList = getSchedulesServer();
    const found = updatedList.find((s) => s.id === newAgenda.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Upacara Pembukaan & Parade Kontingen');

    // Hapus agenda uji coba
    const deleted = deleteScheduleServer(newAgenda.id);
    expect(deleted).toBe(true);

    const listAfter = getSchedulesServer();
    expect(listAfter.some((s) => s.id === newAgenda.id)).toBe(false);
  });
});
