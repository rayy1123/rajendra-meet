import { describe, it, expect } from 'vitest';
import {
  getEquipmentServer,
  saveEquipmentServer,
  deleteEquipmentServer,
} from '@/lib/data/equipment-server';

describe('Manajemen Peralatan & Logistik Arena', () => {
  it('dapat membaca daftar peralatan awal', async () => {
    const list = await getEquipmentServer();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.some((it) => it.name.includes('Touchpad'))).toBe(true);
  });

  it('dapat membuat, memperbarui, dan menghapus logistik peralatan baru', async () => {
    // 1. Tambah peralatan baru
    const created = await saveEquipmentServer({
      name: 'Kabel Ekstensi Audio Start 30M',
      location: 'Gudang Kolam Senayan',
      category: 'Kabel & Jaringan',
      status: 'done',
      due_date: '2026-11-01',
      technician: 'Rian IT',
      note: 'Kabel baru cadangan podium start.',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Kabel Ekstensi Audio Start 30M');

    // 2. Baca kembali
    const all = await getEquipmentServer();
    const found = all.find((it) => it.id === created.id);
    expect(found).toBeDefined();
    expect(found?.technician).toBe('Rian IT');

    // 3. Update peralatan
    const updated = await saveEquipmentServer({
      ...found!,
      status: 'in_progress',
      note: 'Sedang dites kontinuitas pin.',
    });
    expect(updated.status).toBe('in_progress');

    // 4. Hapus peralatan
    const deleted = await deleteEquipmentServer(created.id);
    expect(deleted).toBe(true);

    const listAfter = await getEquipmentServer();
    expect(listAfter.some((it) => it.id === created.id)).toBe(false);
  });
});
