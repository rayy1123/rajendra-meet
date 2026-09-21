import { describe, it, expect } from 'vitest';
import { formatRupiah, formatMsToTime, formatTimeToMs, formatCompEventLabel, generateAthleteNumber } from './index';
import { getExpensesServer, saveExpenseServer, deleteExpenseServer } from '../data/expenses-server';
import { getServerShowcases } from '../data/landing-showcases-server';
import { checkEventLiveStatus } from '../data/live-scoreboard-settings';
import { getEventLiveConfig, saveEventLiveConfig } from '../data/live-scoreboard-server';

describe('1. Pengujian Format Utility (Rupiah & Waktu Renang)', () => {
  it('formatRupiah memformat angka ke mata uang IDR dengan benar', () => {
    expect(formatRupiah(150000)).toBe('Rp 150.000');
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(4500000)).toBe('Rp 4.500.000');
  });

  it('formatMsToTime dan formatTimeToMs akurat mengonversi waktu renang', () => {
    expect(formatMsToTime(65120)).toBe('01:05.12');
    expect(formatTimeToMs('01:05.12')).toBe(65120);
    expect(formatMsToTime(28450)).toBe('28.45');
    expect(formatTimeToMs('28.45')).toBe(28450);
  });

  it('formatCompEventLabel menghasilkan nama acara lengkap', () => {
    const label = formatCompEventLabel({
      name: '50m Gaya Dada Putra KU 1',
      order_no: 12,
    });
    expect(label).toBe('#12 50m Gaya Dada Putra KU 1');
  });
});

describe('2. Pengujian Modul Expenses (Pengeluaran Operasional)', () => {
  it('dapat membuat, membaca, dan menghapus catatan pengeluaran', async () => {
    const initial = await getExpensesServer();
    expect(Array.isArray(initial)).toBe(true);

    const testExp = await saveExpenseServer({
      event_id: 'ev-test-system',
      type: 'operasional',
      amount: 350000,
      expense_date: '2026-09-18',
      description: 'Pengujian otomatis sistem expenses',
    });

    expect(testExp).toBeDefined();
    expect(testExp.id).toBeDefined();
    expect(testExp.amount).toBe(350000);

    const list = await getExpensesServer();
    expect(list.some((x) => x.id === testExp.id)).toBe(true);

    const deleted = await deleteExpenseServer(testExp.id);
    expect(deleted).toBe(true);

    const listAfter = await getExpensesServer();
    expect(listAfter.some((x) => x.id === testExp.id)).toBe(false);
  });
});

describe('3. Pengujian Showcases Beranda (Poster HD, Tentang Kami, 5 Pilar)', () => {
  it('memiliki poster aktif dengan resolusi HD', () => {
    const posters = getServerShowcases('poster');
    expect(posters.length).toBeGreaterThan(0);
    expect(posters[0].imageUrl).toContain('poster-hthss');
  });

  it('memiliki Tentang Kami dengan foto tim', () => {
    const about = getServerShowcases('about');
    expect(about.length).toBeGreaterThan(0);
    expect(about[0].imageUrl).toContain('team-about');
  });

  it('memiliki 5 pilar keunggulan lengkap', () => {
    const pillars = getServerShowcases('pillar');
    expect(pillars.length).toBe(5);
    const titles = pillars.map((p) => p.title);
    expect(titles).toContain('Tim Profesional & Berdedikasi');
    expect(titles).toContain('Technical Official Berlisensi');
    expect(titles).toContain('Ekosistem Semi Digital yang Efisien');
    expect(titles).toContain('Fleksibel & Menyesuaikan Kebutuhan');
    expect(titles).toContain('Jangkauan Layanan Seluruh Indonesia');
  });
});

describe('4. Pengujian Kontrol Visibilitas Live Scoreboard (Bisa Ditutup)', () => {
  it('dapat menutup scoreboard jika kejuaraan belum berjalan atau ditutup panitia', () => {
    saveEventLiveConfig('ev-unit-test', 'closed');
    const cfg = getEventLiveConfig('ev-unit-test');
    expect(cfg.mode).toBe('closed');

    const status = checkEventLiveStatus(
      { start_date: '2026-09-18', end_date: '2026-09-18' },
      cfg
    );
    expect(status.isActive).toBe(false);
    expect(status.reason).toBe('manual_closed');
  });

  it('dapat membuka paksa scoreboard saat kejuaraan berlangsung', () => {
    saveEventLiveConfig('ev-unit-test', 'open');
    const cfg = getEventLiveConfig('ev-unit-test');
    expect(cfg.mode).toBe('open');

    const status = checkEventLiveStatus(
      { start_date: '2026-09-18', end_date: '2026-09-18' },
      cfg
    );
    expect(status.isActive).toBe(true);
    expect(status.reason).toBe('manual_open');

    // Reset ke auto
    saveEventLiveConfig('ev-unit-test', 'auto');
  });
});

describe('5. Pengujian Generator Nomor Atlet Otomatis', () => {
  const currentYear = new Date().getFullYear();

  it('menghasilkan nomor urut pertama jika daftar atlet kosong', () => {
    const num = generateAthleteNumber([]);
    expect(num).toBe(`ATL-${currentYear}-001`);
  });

  it('menghasilkan nomor urut berikutnya berdasarkan jumlah atau index tertinggi', () => {
    const existing = [
      { athlete_number: `ATL-${currentYear}-001` },
      { athlete_number: `ATL-${currentYear}-002` },
    ];
    const num = generateAthleteNumber(existing);
    expect(num).toBe(`ATL-${currentYear}-003`);
  });

  it('mencegah nomor ganda jika candidate sudah ada di dalam sistem', () => {
    const existing = [
      { athlete_number: `ATL-${currentYear}-001` },
      { athlete_number: `ATL-${currentYear}-002` },
      { athlete_number: `ATL-${currentYear}-003` },
    ];
    const num = generateAthleteNumber(existing);
    expect(num).toBe(`ATL-${currentYear}-004`);
  });
});

