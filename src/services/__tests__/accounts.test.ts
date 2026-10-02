import { describe, it, expect } from 'vitest';
import {
  getAllAccountsServer,
  createCommitteeAccountServer,
  createUserAccountServer,
  updateAccountAuthorityServer,
  deleteAccountServer,
  AUTHORITY_DEFINITIONS,
} from '@/lib/data/accounts-server';

describe('Master Akun & Authority Generator Manager', () => {
  it('dapat membaca daftar seluruh akun awal', async () => {
    const list = await getAllAccountsServer();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(5);

    // Verifikasi ada super_admin dan operator
    expect(list.some((a) => a.role === 'super_admin')).toBe(true);
    expect(list.some((a) => a.role === 'operator')).toBe(true);
  });

  it('dapat membuat akun panitia pencatat waktu dengan preset yang tepat', async () => {
    const res = await createCommitteeAccountServer({
      fullName: 'Test Operator Waktu',
      username: 'test_operator_99',
      email: 'op99@rajendra.id',
      preset: 'pencatat_waktu',
      authorities: ['results_input', 'scoreboard_live', 'heats_seeding'],
      phone: '081234567890',
    });

    expect(res.ok).toBe(true);
    expect(res.account).toBeDefined();
    expect(res.account?.role).toBe('operator');
    expect(res.account?.classified_title).toContain('Pencatat Waktu');
    expect(res.account?.authorities).toContain('results_input');
    expect(res.account?.authorities).toContain('scoreboard_live');
  });

  it('dapat membuat akun panitia pembuat juknis dan buku acara', async () => {
    const res = await createCommitteeAccountServer({
      fullName: 'Test Seksi Juknis',
      username: 'test_juknis_01',
      email: 'juknis@rajendra.id',
      preset: 'pembuat_juknis',
      authorities: ['buku_acara', 'juknis_manage', 'checklist_teknis'],
    });

    expect(res.ok).toBe(true);
    expect(res.account?.role).toBe('admin_technical');
    expect(res.account?.classified_title).toContain('Pembuat Juknis');
    expect(res.account?.authorities).toContain('buku_acara');
    expect(res.account?.authorities).toContain('juknis_manage');
  });

  it('dapat membuat akun pelatih kontingen', async () => {
    const res = await createUserAccountServer({
      fullName: 'Coach Test Pelatih',
      username: 'coach_test_88',
      email: 'coach88@gmail.com',
      userType: 'pelatih_klub',
      schoolName: 'Tirta Taruna Swimming Club',
    });

    expect(res.ok).toBe(true);
    expect(res.account?.role).toBe('viewer');
    expect(res.account?.classified_title).toContain('Pelatih');
    expect(res.account?.school_name).toBe('Tirta Taruna Swimming Club');
  });

  it('dapat memperbarui otoritas hak akses akun', async () => {
    const updateRes = await updateAccountAuthorityServer({
      accountId: 'test_operator_99',
      role: 'admin_keuangan',
      classifiedTitle: 'Admin Keuangan',
      authorities: ['verifikasi_bayar', 'tagihan_expenses'],
    });

    expect(updateRes.ok).toBe(true);

    const list = await getAllAccountsServer();
    const target = list.find((a) => a.username === 'test_operator_99');
    expect(target).toBeDefined();
    expect(target?.role).toBe('admin_keuangan');
    expect(target?.authorities).toContain('verifikasi_bayar');
  });

  it('dapat menghapus akun', async () => {
    const delRes1 = await deleteAccountServer('test_operator_99');
    const delRes2 = await deleteAccountServer('test_juknis_01');
    const delRes3 = await deleteAccountServer('coach_test_88');

    expect(delRes1.ok).toBe(true);
    expect(delRes2.ok).toBe(true);
    expect(delRes3.ok).toBe(true);
  });
});
