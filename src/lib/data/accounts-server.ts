import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types/database';
import { AccountItem, AUTHORITY_DEFINITIONS, AuthorityId } from '@/types/accounts';

export type { AccountItem, AuthorityId };
export { AUTHORITY_DEFINITIONS };

// ponytail: local json store fallback for account management during offline dev; upgrade to direct Supabase Auth admin API when service role key configured
const STORE_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'accounts-store.json');

function ensureStoreFile(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, '[]', 'utf-8');
  } catch (err) {
    console.error('[AccountsStore] Ensure store failed:', err);
  }
}

export function readLocalAccounts(): AccountItem[] {
  try {
    ensureStoreFile();
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('[AccountsStore] Read local accounts failed:', err);
  }
  return [];
}

export function writeLocalAccounts(items: AccountItem[]): void {
  try {
    ensureStoreFile();
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AccountsStore] Write local accounts failed:', err);
  }
}

/**
 * Ambil seluruh akun terdaftar dari Supabase Profiles (dengan fallback local store)
 */
export async function getAllAccountsServer(): Promise<AccountItem[]> {
  const localList = readLocalAccounts();
  const localMap = new Map<string, AccountItem>();
  localList.forEach((acc) => {
    localMap.set(acc.id, acc);
    if (acc.username) localMap.set(acc.username, acc);
  });

  try {
    const supabase = await createClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        role,
        school_id,
        phone,
        created_at,
        schools (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(profiles) && profiles.length > 0) {
      const mergedList: AccountItem[] = profiles.map((p: any) => {
        const local = localMap.get(p.id) || localMap.get(p.username);
        const schoolName = p.schools?.name || local?.school_name || null;
        const role = (p.role as UserRole) || local?.role || 'viewer';

        let classifiedTitle = local?.classified_title;
        if (!classifiedTitle) {
          if (role === 'super_admin') classifiedTitle = 'Meet Director / Super Admin';
          else if (role === 'operator') classifiedTitle = 'Pencatat Waktu / Operator Lomba';
          else if (role === 'admin_technical') classifiedTitle = 'Pembuat Juknis & Buku Acara';
          else if (role === 'admin_keuangan') classifiedTitle = 'Admin Keuangan & Tagihan';
          else if (role === 'admin' || role === 'admin_kejuaraan') classifiedTitle = 'Panitia Pelaksana';
          else if (schoolName) classifiedTitle = 'Pelatih / Official Kontingen';
          else classifiedTitle = 'Atlet / Peserta Mandiri';
        }

        let authorities = local?.authorities;
        if (!authorities || authorities.length === 0) {
          if (role === 'super_admin') authorities = AUTHORITY_DEFINITIONS.map((a) => a.id);
          else if (role === 'operator') authorities = ['results_input', 'scoreboard_live', 'heats_seeding'];
          else if (role === 'admin_technical') authorities = ['buku_acara', 'juknis_manage', 'checklist_teknis', 'nomor_lomba', 'heats_seeding'];
          else if (role === 'admin_keuangan') authorities = ['verifikasi_bayar', 'tagihan_expenses'];
          else if (role === 'viewer' && schoolName) authorities = ['registrasi_atlet'];
          else authorities = [];
        }

        return {
          id: p.id,
          username: p.username || local?.username || `user_${p.id.slice(0, 6)}`,
          email: local?.email || `${p.username || p.id.slice(0, 6)}@rajendra.id`,
          full_name: p.full_name || local?.full_name || 'Pengguna Terdaftar',
          role,
          classified_title: classifiedTitle,
          authorities,
          phone: p.phone || local?.phone || null,
          school_id: p.school_id || local?.school_id || null,
          school_name: schoolName,
          status: local?.status || 'active',
          last_login: local?.last_login || null,
          created_at: p.created_at || local?.created_at || new Date().toISOString(),
          generated_password: local?.generated_password,
        };
      });

      // Tambahkan akun mock local jika belum ada di database Supabase
      localList.forEach((loc) => {
        if (!mergedList.some((m) => m.id === loc.id || m.username === loc.username)) {
          mergedList.push(loc);
        }
      });

      return mergedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch (err) {
    console.warn('[AccountsServer] Supabase profiles fetch notice:', err);
  }

  return localList;
}

/**
 * Generator Akun Panitia (Classified: Pencatat Waktu, Pembuat Juknis+Buku Acara, Bendahara, Super Admin, Kustom)
 */
export async function createCommitteeAccountServer(params: {
  fullName: string;
  username: string;
  email?: string;
  password?: string;
  preset: 'pencatat_waktu' | 'pembuat_juknis' | 'admin_keuangan' | 'super_admin' | 'kustom';
  classifiedTitle?: string;
  authorities: string[];
  phone?: string;
}): Promise<{ ok: boolean; account?: AccountItem; error?: string }> {
  const cleanUsername = params.username.trim().toLowerCase().replace(/\s+/g, '_');
  const cleanFullName = params.fullName.trim();
  const rawPassword = params.password?.trim() || Math.random().toString(36).slice(2, 10);
  const cleanEmail = params.email?.trim().toLowerCase() || `${cleanUsername}@rajendra.id`;

  if (!cleanUsername || !cleanFullName) {
    return { ok: false, error: 'Nama lengkap dan username panitia wajib diisi.' };
  }

  let resolvedRole: UserRole = 'admin_kejuaraan';
  let defaultTitle = 'Panitia Pelaksana';

  if (params.preset === 'pencatat_waktu') {
    resolvedRole = 'operator';
    defaultTitle = 'Pencatat Waktu / Operator Lomba';
  } else if (params.preset === 'pembuat_juknis') {
    resolvedRole = 'admin_technical';
    defaultTitle = 'Pembuat Juknis & Buku Acara';
  } else if (params.preset === 'admin_keuangan') {
    resolvedRole = 'admin_keuangan';
    defaultTitle = 'Admin Keuangan & Tagihan';
  } else if (params.preset === 'super_admin') {
    resolvedRole = 'super_admin';
    defaultTitle = 'Meet Director / Super Admin';
  }

  const accountId = `usr_panitia_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newAccount: AccountItem = {
    id: accountId,
    username: cleanUsername,
    email: cleanEmail,
    full_name: cleanFullName,
    role: resolvedRole,
    classified_title: params.classifiedTitle?.trim() || defaultTitle,
    authorities: params.authorities || [],
    phone: params.phone?.trim() || null,
    school_id: null,
    school_name: 'Panitia Pelaksana',
    status: 'active',
    created_at: now,
    generated_password: rawPassword,
  };

  // 1. Simpan ke local store
  const localList = readLocalAccounts();
  const updated = [newAccount, ...localList.filter((a) => a.username !== cleanUsername)];
  writeLocalAccounts(updated);

  // 2. Coba sinkronisasi ke Supabase Auth & Profiles
  try {
    const supabase = await createClient();
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: rawPassword,
      options: {
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
          role: resolvedRole,
        },
      },
    });

    if (!signUpErr && signUpData?.user) {
      const newUserId = signUpData.user.id;
      newAccount.id = newUserId;
      await supabase.from('profiles').upsert({
        id: newUserId,
        full_name: cleanFullName,
        username: cleanUsername,
        role: resolvedRole,
      });
      // Re-save with Supabase user ID
      const syncList = updated.map((a) => (a.username === cleanUsername ? { ...a, id: newUserId } : a));
      writeLocalAccounts(syncList);
    }
  } catch (err) {
    console.warn('[AccountsServer] Supabase auth registration notice (fallback active):', err);
  }

  return { ok: true, account: newAccount };
}

/**
 * Generator Akun Peserta / Pelatih / Atlet
 */
export async function createUserAccountServer(params: {
  fullName: string;
  username: string;
  email?: string;
  password?: string;
  userType: 'pelatih_klub' | 'atlet_mandiri' | 'wali_penonton';
  schoolId?: string | null;
  schoolName?: string | null;
  phone?: string;
}): Promise<{ ok: boolean; account?: AccountItem; error?: string }> {
  const cleanUsername = params.username.trim().toLowerCase().replace(/\s+/g, '_');
  const cleanFullName = params.fullName.trim();
  const rawPassword = params.password?.trim() || Math.random().toString(36).slice(2, 10);
  const cleanEmail = params.email?.trim().toLowerCase() || `${cleanUsername}@gmail.com`;

  if (!cleanUsername || !cleanFullName) {
    return { ok: false, error: 'Nama lengkap dan username wajib diisi.' };
  }

  let classifiedTitle = 'Atlet / Peserta Mandiri';
  let authorities: string[] = [];

  if (params.userType === 'pelatih_klub') {
    classifiedTitle = 'Pelatih / Official Kontingen';
    authorities = ['registrasi_atlet'];
  } else if (params.userType === 'wali_penonton') {
    classifiedTitle = 'Wali Atlet / Penonton';
  }

  const accountId = `usr_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newAccount: AccountItem = {
    id: accountId,
    username: cleanUsername,
    email: cleanEmail,
    full_name: cleanFullName,
    role: 'viewer',
    classified_title: classifiedTitle,
    authorities,
    phone: params.phone?.trim() || null,
    school_id: params.schoolId || null,
    school_name: params.schoolName || (params.userType === 'pelatih_klub' ? 'Klub Renang' : 'Umum / Mandiri'),
    status: 'active',
    created_at: now,
    generated_password: rawPassword,
  };

  const localList = readLocalAccounts();
  const updated = [newAccount, ...localList.filter((a) => a.username !== cleanUsername)];
  writeLocalAccounts(updated);

  try {
    const supabase = await createClient();
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: rawPassword,
      options: {
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
          role: 'viewer',
          school_id: params.schoolId || null,
        },
      },
    });

    if (!signUpErr && signUpData?.user) {
      const newUserId = signUpData.user.id;
      newAccount.id = newUserId;
      await supabase.from('profiles').upsert({
        id: newUserId,
        full_name: cleanFullName,
        username: cleanUsername,
        role: 'viewer',
        school_id: params.schoolId || null,
      });
      const syncList = updated.map((a) => (a.username === cleanUsername ? { ...a, id: newUserId } : a));
      writeLocalAccounts(syncList);
    }
  } catch (err) {
    console.warn('[AccountsServer] Supabase user registration notice:', err);
  }

  return { ok: true, account: newAccount };
}

/**
 * Update Peran & Otoritas Akun
 */
export async function updateAccountAuthorityServer(params: {
  accountId: string;
  role: UserRole;
  classifiedTitle?: string;
  authorities: string[];
  status?: 'active' | 'suspended';
}): Promise<{ ok: boolean; error?: string }> {
  const localList = readLocalAccounts();
  let found = false;

  const updated = localList.map((acc) => {
    if (acc.id === params.accountId || acc.username === params.accountId) {
      found = true;
      return {
        ...acc,
        role: params.role,
        classified_title: params.classifiedTitle || acc.classified_title,
        authorities: params.authorities,
        status: params.status || acc.status,
      };
    }
    return acc;
  });

  if (found) {
    writeLocalAccounts(updated);
  }

  try {
    const supabase = await createClient();
    await supabase
      .from('profiles')
      .update({
        role: params.role,
      })
      .eq('id', params.accountId);
  } catch (err) {
    console.warn('[AccountsServer] Update profile role notice:', err);
  }

  return { ok: true };
}

/**
 * Hapus Akun dari Sistem
 */
export async function deleteAccountServer(accountId: string): Promise<{ ok: boolean; error?: string }> {
  const localList = readLocalAccounts();
  const updated = localList.filter((a) => a.id !== accountId && a.username !== accountId);
  writeLocalAccounts(updated);

  try {
    const supabase = await createClient();
    await supabase.from('profiles').delete().eq('id', accountId);
  } catch (err) {
    console.warn('[AccountsServer] Delete profile notice:', err);
  }

  return { ok: true };
}
