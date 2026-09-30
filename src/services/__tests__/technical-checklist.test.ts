import { describe, it, expect } from 'vitest';
import {
  getChecklistServer,
  updateChecklistItemServer,
  addChecklistItemServer,
} from '@/lib/data/technical-checklist-server';

describe('Official Technical Checklist & Pool Recognition Manager', () => {
  it('dapat membaca daftar checklist teknis standar kejuaraan', () => {
    const list = getChecklistServer();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(15);

    // Verifikasi bahwa ada item rekognisi kolam
    const rekognisiItems = list.filter((i) => i.category === 'rekognisi');
    expect(rekognisiItems.length).toBeGreaterThanOrEqual(3);
    expect(rekognisiItems.some((i) => i.title.includes('Rekognisi Resmi Pagi'))).toBe(true);

    // Verifikasi bahwa ada item technical meeting
    const tmItems = list.filter((i) => i.category === 'technical_meeting');
    expect(tmItems.length).toBeGreaterThanOrEqual(2);

    // Verifikasi bahwa ada item timing system
    const timingItems = list.filter((i) => i.category === 'timing_system');
    expect(timingItems.some((i) => i.title.includes('Touchpad'))).toBe(true);
  });

  it('dapat memfilter checklist berdasarkan kategori', () => {
    const rekognisiOnly = getChecklistServer('rekognisi');
    expect(rekognisiOnly.every((i) => i.category === 'rekognisi')).toBe(true);

    const tmOnly = getChecklistServer('technical_meeting');
    expect(tmOnly.every((i) => i.category === 'technical_meeting')).toBe(true);
  });

  it('dapat memperbarui status dan catatan lapangan pada item checklist', () => {
    const list = getChecklistServer();
    const firstItem = list[0];
    expect(firstItem).toBeDefined();

    const updated = updateChecklistItemServer(firstItem.id, {
      status: 'verified',
      notes: 'Suhu kolam 26.5°C stabil, tes sensor berhasil.',
      verifiedBy: 'Drs. H. Bambang Subagyo (TD)',
      verifiedAt: new Date().toISOString(),
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('verified');
    expect(updated?.notes).toContain('26.5°C');
    expect(updated?.verifiedBy).toContain('Bambang');
  });

  it('dapat menambahkan item checklist kustom', () => {
    const newItem = addChecklistItemServer({
      category: 'fasilitas_kolam',
      title: 'Uji Coba Lampu Cadangan Genset Kolam',
      description: 'Simulasi pemadaman listrik PLN dan peralihan otomatis ke genset 150 kVA.',
      scheduledTime: '05:30 WIB',
      location: 'Ruang Genset & Pool Deck',
      pic: 'Teknisi Listrik Gelora',
      status: 'completed',
      notes: 'Waktu peralihan 4 detik, lampu arena tetap menyala.',
      verifiedBy: 'Technical Delegate',
      verifiedAt: new Date().toISOString(),
    });

    expect(newItem.id).toBeDefined();
    expect(newItem.title).toBe('Uji Coba Lampu Cadangan Genset Kolam');

    const all = getChecklistServer();
    const found = all.find((i) => i.id === newItem.id);
    expect(found).toBeDefined();
    expect(found?.pic).toBe('Teknisi Listrik Gelora');
  });
});
