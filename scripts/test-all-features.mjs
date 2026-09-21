import { formatRupiah, formatMsToTime, formatTimeToMs } from '../src/lib/utils/index.js';
import { getExpensesServer, saveExpenseServer, deleteExpenseServer } from '../src/lib/data/expenses-server.js';
import { getServerShowcases } from '../src/lib/data/landing-showcases-server.js';
import { checkEventLiveStatus } from '../src/lib/data/live-scoreboard-settings.js';
import { getEventLiveConfig, saveEventLiveConfig } from '../src/lib/data/live-scoreboard-server.js';

console.log('=== MEMULAI PENGUJIAN SELURUH FUNGSI SISTEM ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log('[PASS]', message);
    passCount++;
  } else {
    console.error('[FAIL]', message);
    failCount++;
  }
}

async function run() {
  // 1. Uji Utility & Formatters
  console.log('--- 1. Uji Fungsi Format Rupiah & Waktu Renang ---');
  assert(formatRupiah(150000).includes('150.000'), 'formatRupiah(150000) menghasilkan "Rp 150.000"');
  assert(formatRupiah(0).includes('0'), 'formatRupiah(0) menghasilkan "Rp 0"');
  assert(formatMsToTime(65120) === '01:05.12', 'formatMsToTime(65120) menghasilkan "01:05.12"');
  assert(formatTimeToMs('01:05.12') === 65120, 'formatTimeToMs("01:05.12") menghasilkan 65120 ms');

  // 2. Uji Modul Expenses (Pengeluaran)
  console.log('\n--- 2. Uji Modul Expenses (Pengeluaran) CRUD ---');
  const initial = await getExpensesServer();
  assert(Array.isArray(initial), 'getExpensesServer mengembalikan array data');

  const testExp = await saveExpenseServer({
    event_id: 'test-event-1',
    type: 'operasional',
    amount: 250000,
    expense_date: '2026-09-18',
    description: 'Biaya cetak sertifikat & piagam uji coba',
  });
  assert(testExp && testExp.id, 'saveExpenseServer berhasil menyimpan data dengan ID');
  assert(testExp.amount === 250000, 'saveExpenseServer menyimpan nominal Rp 250.000');

  const updated = await getExpensesServer();
  assert(updated.some(x => x.id === testExp.id), 'Data pengeluaran baru berhasil ditemukan di daftar');

  const delRes = await deleteExpenseServer(testExp.id);
  assert(delRes === true, 'deleteExpenseServer berhasil menghapus pengeluaran');

  const afterDelete = await getExpensesServer();
  assert(!afterDelete.some(x => x.id === testExp.id), 'Data pengeluaran yang dihapus tidak ada lagi di daftar');

  // 3. Uji Modul Showcases (Poster, Tentang Kami, Pilar)
  console.log('\n--- 3. Uji Modul Showcases Landing Page ---');
  const posters = getServerShowcases('poster');
  assert(Array.isArray(posters) && posters.length > 0, 'Showcases Poster aktif');
  assert(posters[0].imageUrl && posters[0].imageUrl.includes('poster-hthss'), 'Poster menggunakan path resolusi HD');

  const about = getServerShowcases('about');
  assert(Array.isArray(about) && about.length > 0, 'Showcases Tentang Kami aktif');
  assert(about[0].imageUrl && about[0].imageUrl.includes('team-about'), 'Tentang Kami menggunakan foto tim');

  const pillars = getServerShowcases('pillar');
  assert(Array.isArray(pillars) && pillars.length === 5, 'Showcases Pilar memiliki 5 pilar keunggulan lengkap');

  // 4. Uji Kontrol Live Scoreboard (Bisa Ditutup)
  console.log('\n--- 4. Uji Kontrol Live Scoreboard (Bisa Ditutup) ---');
  saveEventLiveConfig('ev-test-unit', 'closed');
  let cfg = getEventLiveConfig('ev-test-unit');
  assert(cfg.mode === 'closed', 'Scoreboard berhasil diubah ke mode "closed" (ditutup)');

  let liveStatus = checkEventLiveStatus({
    id: 'ev-test-unit',
    start_date: '2026-09-18',
    end_date: '2026-09-18',
  }, 'closed');
  assert(liveStatus.isLive === false && liveStatus.reason === 'closed_by_organizer', 'Status scoreboard berhasil ditutup oleh panitia');

  saveEventLiveConfig('ev-test-unit', 'open');
  cfg = getEventLiveConfig('ev-test-unit');
  assert(cfg.mode === 'open', 'Scoreboard berhasil diubah ke mode "open" (dibuka paksa)');

  liveStatus = checkEventLiveStatus({
    id: 'ev-test-unit',
    start_date: '2026-09-18',
    end_date: '2026-09-18',
  }, 'open');
  assert(liveStatus.isLive === true && liveStatus.reason === 'force_open', 'Status scoreboard aktif karena dibuka panitia');

  saveEventLiveConfig('ev-test-unit', 'auto');
  cfg = getEventLiveConfig('ev-test-unit');
  assert(cfg.mode === 'auto', 'Mode scoreboard berhasil direset ke "auto"');

  console.log('\n=================================================');
  console.log(`HASIL AKHIR UJI COBA: ${passCount} BERHASIL (PASS), ${failCount} GAGAL (FAIL)`);
  console.log('=================================================');

  if (failCount > 0) process.exit(1);
}

run().catch(err => {
  console.error('Error saat pengujian:', err);
  process.exit(1);
});
