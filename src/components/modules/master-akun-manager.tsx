'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  Receipt,
  Award,
  Sliders,
  Copy,
  MessageCircle,
  Trash2,
  Edit3,
  Check,
  Building2,
  User,
  Sparkles,
  Lock,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type AccountItem,
  AUTHORITY_DEFINITIONS,
  type AuthorityId,
} from '@/types/accounts';
import { UserRole } from '@/types/database';

export interface MasterAkunManagerProps {
  initialAccounts: AccountItem[];
  schools: { id: string; name: string; city?: string | null }[];
}

export function MasterAkunManager({
  initialAccounts,
  schools = [],
}: MasterAkunManagerProps) {
  const [accounts, setAccounts] = useState<AccountItem[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'panitia' | 'coach' | 'athlete'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [openCommitteeModal, setOpenCommitteeModal] = useState(false);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [editAuthorityAccount, setEditAuthorityAccount] = useState<AccountItem | null>(null);

  // Form Generator Akun Panitia
  const [committeeForm, setCommitteeForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    preset: 'pencatat_waktu' as 'pencatat_waktu' | 'pembuat_juknis' | 'admin_keuangan' | 'super_admin' | 'kustom',
    classifiedTitle: 'Pencatat Waktu / Operator Lomba',
    authorities: ['results_input', 'scoreboard_live', 'heats_seeding'] as string[],
    phone: '',
  });

  // Form Generator Akun User
  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    userType: 'pelatih_klub' as 'pelatih_klub' | 'atlet_mandiri' | 'wali_penonton',
    schoolId: schools[0]?.id || '',
    phone: '',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/accounts');
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setAccounts(json.data);
        toast.success('Daftar master akun berhasil disinkronkan');
      }
    } catch {
      toast.error('Gagal memperbarui master akun');
    } finally {
      setRefreshing(false);
    }
  };

  // Helper Auto-Generate Secure Password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Update Preset Panitia Form
  const applyCommitteePreset = (preset: typeof committeeForm.preset) => {
    let title = 'Panitia Pelaksana';
    let auths: string[] = [];

    if (preset === 'pencatat_waktu') {
      title = 'Pencatat Waktu / Operator Lomba';
      auths = ['results_input', 'scoreboard_live', 'heats_seeding'];
    } else if (preset === 'pembuat_juknis') {
      title = 'Pembuat Juknis & Buku Acara';
      auths = ['buku_acara', 'juknis_manage', 'checklist_teknis', 'nomor_lomba', 'heats_seeding'];
    } else if (preset === 'admin_keuangan') {
      title = 'Admin Keuangan & Tagihan';
      auths = ['verifikasi_bayar', 'tagihan_expenses'];
    } else if (preset === 'super_admin') {
      title = 'Meet Director / Super Admin';
      auths = AUTHORITY_DEFINITIONS.map((a) => a.id);
    } else {
      title = 'Panitia Khusus (Kustom)';
      auths = ['results_input', 'buku_acara'];
    }

    setCommitteeForm((prev) => ({
      ...prev,
      preset,
      classifiedTitle: title,
      authorities: auths,
    }));
  };

  const toggleAuthority = (authId: string) => {
    setCommitteeForm((prev) => {
      const exists = prev.authorities.includes(authId);
      const next = exists
        ? prev.authorities.filter((a) => a !== authId)
        : [...prev.authorities, authId];
      return { ...prev, authorities: next, preset: 'kustom' };
    });
  };

  const toggleEditAuthority = (authId: string) => {
    if (!editAuthorityAccount) return;
    const exists = editAuthorityAccount.authorities.includes(authId);
    const next = exists
      ? editAuthorityAccount.authorities.filter((a) => a !== authId)
      : [...editAuthorityAccount.authorities, authId];
    setEditAuthorityAccount({ ...editAuthorityAccount, authorities: next });
  };

  // Submit Generator Panitia
  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeForm.fullName.trim() || !committeeForm.username.trim()) {
      toast.error('Nama lengkap dan username panitia wajib diisi');
      return;
    }

    const payload = {
      action: 'create_committee',
      fullName: committeeForm.fullName.trim(),
      username: committeeForm.username.trim(),
      email: committeeForm.email.trim() || `${committeeForm.username.trim()}@rajendra.id`,
      password: committeeForm.password.trim() || generateRandomPassword(),
      preset: committeeForm.preset,
      classifiedTitle: committeeForm.classifiedTitle.trim(),
      authorities: committeeForm.authorities,
      phone: committeeForm.phone.trim(),
    };

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAccounts((prev) => [data.data, ...prev.filter((a) => a.id !== data.data.id)]);
        setOpenCommitteeModal(false);
        toast.success(`Akun panitia "${payload.fullName}" berhasil dibuat!`);
        // Reset form
        setCommitteeForm({
          fullName: '',
          username: '',
          email: '',
          password: '',
          preset: 'pencatat_waktu',
          classifiedTitle: 'Pencatat Waktu / Operator Lomba',
          authorities: ['results_input', 'scoreboard_live', 'heats_seeding'],
          phone: '',
        });
      } else {
        toast.error(data.error || 'Gagal membuat akun panitia');
      }
    } catch {
      toast.error('Kesalahan jaringan saat membuat akun');
    }
  };

  // Submit Generator User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.fullName.trim() || !userForm.username.trim()) {
      toast.error('Nama lengkap dan username peserta wajib diisi');
      return;
    }

    const selSchool = schools.find((s) => s.id === userForm.schoolId);
    const payload = {
      action: 'create_user',
      fullName: userForm.fullName.trim(),
      username: userForm.username.trim(),
      email: userForm.email.trim() || `${userForm.username.trim()}@gmail.com`,
      password: userForm.password.trim() || generateRandomPassword(),
      userType: userForm.userType,
      schoolId: userForm.userType === 'pelatih_klub' ? userForm.schoolId : null,
      schoolName: userForm.userType === 'pelatih_klub' ? selSchool?.name : 'Umum / Mandiri',
      phone: userForm.phone.trim(),
    };

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAccounts((prev) => [data.data, ...prev.filter((a) => a.id !== data.data.id)]);
        setOpenUserModal(false);
        toast.success(`Akun peserta "${payload.fullName}" berhasil dibuat!`);
        setUserForm({
          fullName: '',
          username: '',
          email: '',
          password: '',
          userType: 'pelatih_klub',
          schoolId: schools[0]?.id || '',
          phone: '',
        });
      } else {
        toast.error(data.error || 'Gagal membuat akun user');
      }
    } catch {
      toast.error('Kesalahan jaringan saat membuat akun');
    }
  };

  // Update Authority Modal Submit
  const handleSaveEditAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAuthorityAccount) return;

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_authority',
          accountId: editAuthorityAccount.id,
          role: editAuthorityAccount.role,
          classifiedTitle: editAuthorityAccount.classified_title,
          authorities: editAuthorityAccount.authorities,
        }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === editAuthorityAccount.id
              ? {
                  ...a,
                  role: editAuthorityAccount.role,
                  classified_title: editAuthorityAccount.classified_title,
                  authorities: editAuthorityAccount.authorities,
                }
              : a
          )
        );
        setEditAuthorityAccount(null);
        toast.success('Otoritas akun berhasil diperbarui!');
      } else {
        toast.error('Gagal memperbarui otoritas akun');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  // Direct Role Switcher in Table
  const handleDirectRoleChange = async (accountId: string, newRole: UserRole) => {
    let title = 'Pengguna';
    let auths: string[] = [];

    if (newRole === 'super_admin') {
      title = 'Meet Director / Super Admin';
      auths = AUTHORITY_DEFINITIONS.map((a) => a.id);
    } else if (newRole === 'operator') {
      title = 'Pencatat Waktu / Operator Lomba';
      auths = ['results_input', 'scoreboard_live', 'heats_seeding'];
    } else if (newRole === 'admin_technical') {
      title = 'Pembuat Juknis & Buku Acara';
      auths = ['buku_acara', 'juknis_manage', 'checklist_teknis', 'nomor_lomba', 'heats_seeding'];
    } else if (newRole === 'admin_keuangan') {
      title = 'Admin Keuangan & Tagihan';
      auths = ['verifikasi_bayar', 'tagihan_expenses'];
    } else {
      title = 'Peserta / Atlet / Klub';
      auths = ['registrasi_atlet'];
    }

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_authority',
          accountId,
          role: newRole,
          classifiedTitle: title,
          authorities: auths,
        }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId
              ? { ...a, role: newRole, classified_title: title, authorities: auths }
              : a
          )
        );
        toast.success('Peran akun berhasil diubah!');
      }
    } catch {
      toast.error('Gagal mengubah peran akun');
    }
  };

  // Hapus Akun
  const handleDeleteAccount = async (accountId: string, name: string) => {
    if (!confirm(`Hapus akun "${name}" secara permanen dari sistem?`)) return;

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_account', accountId }),
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        toast.success(`Akun "${name}" berhasil dihapus.`);
      }
    } catch {
      toast.error('Gagal menghapus akun');
    }
  };

  // Copy Credentials
  const handleCopyCredentials = (acc: AccountItem) => {
    const text = `KREDENSIAL AKUN RAJENDRA SWIM SYSTEM\nNama: ${acc.full_name}\nUsername: ${acc.username}\nEmail: ${acc.email}\nPeran: ${acc.classified_title}\nPassword: ${acc.generated_password || '(Kata Sandi Terdaftar)'}\nLogin: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    navigator.clipboard.writeText(text);
    toast.success(`Kredensial ${acc.username} disalin ke clipboard!`);
  };

  // Share WhatsApp
  const handleShareWhatsApp = (acc: AccountItem) => {
    const text = encodeURIComponent(
      `Halo *${acc.full_name}*, berikut kredensial login resmi Anda di *Rajendra Swim System*:\n\n👤 *Username:* ${acc.username}\n📧 *Email:* ${acc.email}\n🔑 *Password:* ${acc.generated_password || '(Gunakan kata sandi terdaftar)'}\n🔰 *Akses/Peran:* ${acc.classified_title}\n\nSilakan masuk melalui link: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\nTerima kasih.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator', 'admin', 'admin_kejuaraan', 'admin_keuangan', 'admin_technical', 'admin-technical'];
    return accounts.filter((acc) => {
      const isAdmin = ADMIN_ROLES.includes(acc.role);
      const isCoach = !isAdmin && (acc.school_name || acc.classified_title?.toLowerCase().includes('pelatih'));
      const isAthlete = !isAdmin && !isCoach;

      if (tabFilter === 'panitia' && !isAdmin) return false;
      if (tabFilter === 'coach' && !isCoach) return false;
      if (tabFilter === 'athlete' && !isAthlete) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (acc.full_name || '').toLowerCase().includes(q);
        const matchUser = (acc.username || '').toLowerCase().includes(q);
        const matchEmail = (acc.email || '').toLowerCase().includes(q);
        const matchTitle = (acc.classified_title || '').toLowerCase().includes(q);
        const matchSchool = (acc.school_name || '').toLowerCase().includes(q);
        return matchName || matchUser || matchEmail || matchTitle || matchSchool;
      }

      return true;
    });
  }, [accounts, tabFilter, searchQuery]);

  // KPI Stats
  const stats = useMemo(() => {
    const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator', 'admin', 'admin_kejuaraan', 'admin_keuangan', 'admin_technical', 'admin-technical'];
    const total = accounts.length;
    const panitia = accounts.filter((a) => ADMIN_ROLES.includes(a.role)).length;
    const coach = accounts.filter((a) => !ADMIN_ROLES.includes(a.role) && (a.school_name || a.classified_title?.toLowerCase().includes('pelatih'))).length;
    const athlete = accounts.filter((a) => !ADMIN_ROLES.includes(a.role) && !a.school_name && !a.classified_title?.toLowerCase().includes('pelatih')).length;
    return { total, panitia, coach, athlete };
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* ── 1. KPI STATS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Akun */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-blue-600 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Seluruh Akun</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {stats.total} <span className="text-xs font-semibold text-muted-foreground">User</span>
            </p>
          </div>
        </div>

        {/* Panitia & Operator */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-amber-500 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Panitia &amp; Operator</p>
            <p className="text-2xl font-black text-amber-600 font-mono mt-0.5">
              {stats.panitia} <span className="text-xs font-semibold text-muted-foreground">Petugas</span>
            </p>
          </div>
        </div>

        {/* Pelatih & Kontingen */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-indigo-500 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pelatih &amp; Klub</p>
            <p className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
              {stats.coach} <span className="text-xs font-semibold text-muted-foreground">Kontingen</span>
            </p>
          </div>
        </div>

        {/* Atlet Mandiri */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Atlet &amp; Mandiri</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              {stats.athlete} <span className="text-xs font-semibold text-muted-foreground">Perenang</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. HEADER CONTROLS & GENERATOR BUTTONS ── */}
      <div className="glass-card p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-blue-600" />
              Master Akun &amp; Generator Hak Akses Panitia
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola seluruh akun terdaftar, terbitkan akun panitia khusus (Pencatat Waktu, Juknis, Keuangan), dan atur hak akses granular.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-semibold border-slate-300 gap-1.5 cursor-pointer bg-white"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              <span>Sinkron</span>
            </Button>

            <Button
              type="button"
              onClick={() => {
                setCommitteeForm((prev) => ({
                  ...prev,
                  password: generateRandomPassword(),
                }));
                setOpenCommitteeModal(true);
              }}
              size="sm"
              className="h-9 px-3.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>+ Generator Akun Panitia</span>
            </Button>

            <Button
              type="button"
              onClick={() => {
                setUserForm((prev) => ({
                  ...prev,
                  password: generateRandomPassword(),
                }));
                setOpenUserModal(true);
              }}
              size="sm"
              className="h-9 px-3.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Generator Akun User</span>
            </Button>
          </div>
        </div>

        {/* Search & Tabs Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama, username, email, kontingen, peran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* Tabs Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            <button
              type="button"
              onClick={() => setTabFilter('all')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                tabFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Semua ({accounts.length})
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('panitia')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1',
                tabFilter === 'panitia'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              )}
            >
              <ShieldCheck className="h-3 w-3" />
              Panitia ({stats.panitia})
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('coach')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1',
                tabFilter === 'coach'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-800 hover:text-indigo-950'
              )}
            >
              <Building2 className="h-3 w-3" />
              Pelatih / Klub ({stats.coach})
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('athlete')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1',
                tabFilter === 'athlete'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              )}
            >
              <User className="h-3 w-3" />
              Atlet ({stats.athlete})
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. TABEL MASTER AKUN LENGKAP ── */}
      <div className="glass-card overflow-hidden p-0 border border-white/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Pengguna / Kredensial</th>
                <th className="py-3 px-3">Klasifikasi &amp; Peran</th>
                <th className="py-3 px-3">Hak Otoritas Khusus</th>
                <th className="py-3 px-3">Kontingen / Instansi</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center w-40">Aksi &amp; Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-xs">Tidak ada akun yang sesuai kriteria filter.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gunakan tombol generator di atas untuk menerbitkan akun baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator', 'admin', 'admin_kejuaraan', 'admin_keuangan', 'admin_technical', 'admin-technical'];
                  const isPanitia = ADMIN_ROLES.includes(acc.role);

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Pengguna & Kredensial */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {acc.full_name}
                            {acc.role === 'super_admin' && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black border border-amber-300">
                                OWNER
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[11px] text-blue-700 font-semibold">
                            @{acc.username}
                          </p>
                          <p className="text-[10.5px] text-slate-500 truncate max-w-[200px]">
                            {acc.email}
                          </p>
                        </div>
                      </td>

                      {/* 2. Peran & Direct Role Switcher */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <select
                            value={acc.role}
                            onChange={(e) => handleDirectRoleChange(acc.id, e.target.value as UserRole)}
                            className={cn(
                              'h-7 rounded-lg border text-[11px] font-bold px-2 py-0.5 transition-colors cursor-pointer outline-none',
                              isPanitia
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold'
                                : 'bg-slate-50 border-slate-300 text-slate-800'
                            )}
                          >
                            <option value="super_admin">👑 Super Admin / Director</option>
                            <option value="operator">⏱️ Pencatat Waktu (Operator)</option>
                            <option value="admin_technical">📖 Pembuat Juknis &amp; Buku Acara</option>
                            <option value="admin_keuangan">💰 Admin Keuangan &amp; Kasir</option>
                            <option value="admin_kejuaraan">🔰 Panitia Pelaksana</option>
                            <option value="viewer">👤 Peserta / Pelatih / Atlet</option>
                          </select>
                          <p className="text-[10px] text-slate-500 italic">
                            {acc.classified_title || 'Pengguna Terdaftar'}
                          </p>
                        </div>
                      </td>

                      {/* 3. Hak Otoritas Khusus */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {acc.authorities && acc.authorities.length > 0 ? (
                              acc.authorities.slice(0, 3).map((aId) => {
                                const def = AUTHORITY_DEFINITIONS.find((d) => d.id === aId);
                                return (
                                  <span
                                    key={aId}
                                    className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-900 border border-blue-200"
                                  >
                                    {def?.label.split('&')[0] || aId}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-slate-400">— Standar Viewer —</span>
                            )}
                            {acc.authorities && acc.authorities.length > 3 && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                +{acc.authorities.length - 3} lainnya
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditAuthorityAccount(acc)}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <Sliders className="h-3 w-3" /> Edit Otoritas
                          </button>
                        </div>
                      </td>

                      {/* 4. Kontingen / Instansi */}
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800 text-xs leading-snug">
                          {acc.school_name || 'Umum / Mandiri'}
                        </p>
                        {acc.phone && (
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Tel: {acc.phone}
                          </p>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Aktif
                        </span>
                      </td>

                      {/* 6. Aksi Cepat & Kredensial */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyCredentials(acc)}
                            className="h-7 px-2 text-[10.5px] font-bold rounded-lg border-slate-300 hover:bg-blue-50 text-blue-700 gap-1 cursor-pointer"
                            title="Salin Kredensial Login"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Salin</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleShareWhatsApp(acc)}
                            className="h-7 px-2 text-[10.5px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer shadow-2xs"
                            title="Kirim Kredensial via WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WA</span>
                          </Button>

                          {acc.role !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc.id, acc.full_name)}
                              className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════ MODAL 1: GENERATOR AKUN PANITIA ════ */}
      <Dialog open={openCommitteeModal} onOpenChange={setOpenCommitteeModal}>
        <DialogContent className="max-w-2xl p-6 no-print backdrop-blur-xl bg-white/98 border border-white/90 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Generator Akun Panitia &amp; Petugas Lomba
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCommittee} className="space-y-4 pt-2 text-xs">
            {/* Pilihan Preset Cepat Klasifikasi Panitia */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 block text-xs">
                Pilih Klasifikasi Tugas Panitia:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'pencatat_waktu',
                    title: '⏱️ Pencatat Waktu (Operator)',
                    desc: 'Input waktu hasil seri & live scoreboard',
                    color: 'border-blue-300 bg-blue-50/60 text-blue-950',
                  },
                  {
                    id: 'pembuat_juknis',
                    title: '📖 Pembuat Juknis & Buku Acara',
                    desc: 'Susunan start list, juknis, checklist TD',
                    color: 'border-indigo-300 bg-indigo-50/60 text-indigo-950',
                  },
                  {
                    id: 'admin_keuangan',
                    title: '💰 Admin Keuangan & Kasir',
                    desc: 'Approval transfer, tagihan klub, expenses',
                    color: 'border-emerald-300 bg-emerald-50/60 text-emerald-950',
                  },
                  {
                    id: 'super_admin',
                    title: '👑 Meet Director (Super Admin)',
                    desc: 'Akses penuh ke seluruh sistem SCMS',
                    color: 'border-amber-300 bg-amber-50/60 text-amber-950',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyCommitteePreset(item.id as any)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-0.5',
                      committeeForm.preset === item.id
                        ? `${item.color} ring-2 ring-blue-500/30 font-bold shadow-2xs`
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    )}
                  >
                    <p className="font-bold text-xs">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Identitas Akun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Nama Lengkap &amp; Gelar</label>
                <Input
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Pd"
                  value={committeeForm.fullName}
                  onChange={(e) => setCommitteeForm((s) => ({ ...s, fullName: e.target.value }))}
                  className="h-8 text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Username Login</label>
                <Input
                  type="text"
                  placeholder="Contoh: wasit_waktu_01"
                  value={committeeForm.username}
                  onChange={(e) => setCommitteeForm((s) => ({ ...s, username: e.target.value }))}
                  className="h-8 text-xs bg-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Email Resmi Panitia</label>
                <Input
                  type="email"
                  placeholder="wasit01@rajendra.id"
                  value={committeeForm.email}
                  onChange={(e) => setCommitteeForm((s) => ({ ...s, email: e.target.value }))}
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Kata Sandi (Password)</label>
                  <button
                    type="button"
                    onClick={() => setCommitteeForm((s) => ({ ...s, password: generateRandomPassword() }))}
                    className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Generate Acak
                  </button>
                </div>
                <Input
                  type="text"
                  value={committeeForm.password}
                  onChange={(e) => setCommitteeForm((s) => ({ ...s, password: e.target.value }))}
                  placeholder="Kata sandi aman"
                  className="h-8 text-xs bg-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Matriks Otoritas Granular */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <label className="font-bold text-slate-900 block text-xs">
                Pilih Otoritas Akses Modul ({committeeForm.authorities.length} Dipilih):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200">
                {AUTHORITY_DEFINITIONS.map((auth) => {
                  const isChecked = committeeForm.authorities.includes(auth.id);
                  return (
                    <label
                      key={auth.id}
                      className={cn(
                        'flex items-start gap-2 p-2 rounded-lg border text-[11px] transition-all cursor-pointer',
                        isChecked
                          ? 'border-blue-300 bg-blue-50/80 text-blue-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100/60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAuthority(auth.id)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600"
                      />
                      <div className="min-w-0">
                        <p className="leading-tight">{auth.label}</p>
                        <p className="text-[9.5px] text-slate-400 font-normal truncate mt-0.5">{auth.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenCommitteeModal(false)}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Terbitkan Akun Panitia
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════ MODAL 2: GENERATOR AKUN USER (PELATIH / ATLET) ════ */}
      <Dialog open={openUserModal} onOpenChange={setOpenUserModal}>
        <DialogContent className="max-w-md p-6 no-print backdrop-blur-xl bg-white/98 border border-white/90 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Generator Akun Peserta &amp; Pelatih
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Tipe Pengguna</label>
              <select
                value={userForm.userType}
                onChange={(e) => setUserForm((s) => ({ ...s, userType: e.target.value as any }))}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold"
              >
                <option value="pelatih_klub">🏊 Pelatih / Official Kontingen Tim</option>
                <option value="atlet_mandiri">👤 Atlet Mandiri / Perorangan</option>
                <option value="wali_penonton">👁️ Wali Atlet / Penonton</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Nama Lengkap</label>
              <Input
                type="text"
                placeholder="Nama pelatih / atlet"
                value={userForm.fullName}
                onChange={(e) => setUserForm((s) => ({ ...s, fullName: e.target.value }))}
                className="h-8 text-xs bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Username</label>
                <Input
                  type="text"
                  placeholder="username_atlet"
                  value={userForm.username}
                  onChange={(e) => setUserForm((s) => ({ ...s, username: e.target.value }))}
                  className="h-8 text-xs bg-white font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-800">No. WhatsApp</label>
                <Input
                  type="tel"
                  placeholder="0812..."
                  value={userForm.phone}
                  onChange={(e) => setUserForm((s) => ({ ...s, phone: e.target.value }))}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            {userForm.userType === 'pelatih_klub' && (
              <div className="space-y-1 pt-1 border-t">
                <label className="font-bold text-slate-800">Pilih Klub / Kontingen Binaan</label>
                <select
                  value={userForm.schoolId}
                  onChange={(e) => setUserForm((s) => ({ ...s, schoolId: e.target.value }))}
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} {sch.city ? `(${sch.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 pt-1 border-t">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Kata Sandi (Password)</label>
                <button
                  type="button"
                  onClick={() => setUserForm((s) => ({ ...s, password: generateRandomPassword() }))}
                  className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  Generate Acak
                </button>
              </div>
              <Input
                type="text"
                value={userForm.password}
                onChange={(e) => setUserForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="Kata sandi akun"
                className="h-8 text-xs bg-white font-mono font-bold"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenUserModal(false)}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Terbitkan Akun
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════ MODAL 3: EDIT OTORITAS AKUN GRANULAR ════ */}
      <Dialog open={!!editAuthorityAccount} onOpenChange={(open) => !open && setEditAuthorityAccount(null)}>
        <DialogContent className="max-w-lg p-6 no-print backdrop-blur-xl bg-white/98 border border-white/90 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <SlidersHorizontal className="h-5 w-5 text-blue-600" />
              Sesuaikan Otoritas Akses: {editAuthorityAccount?.full_name}
            </DialogTitle>
          </DialogHeader>

          {editAuthorityAccount && (
            <form onSubmit={handleSaveEditAuthority} className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-xs">{editAuthorityAccount.full_name}</p>
                <p className="text-[11px] font-mono text-slate-500">@{editAuthorityAccount.username} • {editAuthorityAccount.email}</p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-900 block text-xs">
                  Pilih Akses Modul ({editAuthorityAccount.authorities.length} Aktif):
                </label>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200">
                  {AUTHORITY_DEFINITIONS.map((auth) => {
                    const isChecked = editAuthorityAccount.authorities.includes(auth.id);
                    return (
                      <label
                        key={auth.id}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded-lg border text-[11px] transition-all cursor-pointer',
                          isChecked
                            ? 'border-blue-300 bg-blue-50/80 text-blue-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100/60'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditAuthority(auth.id)}
                          className="mt-0.5 rounded border-slate-300 text-blue-600"
                        />
                        <div className="min-w-0">
                          <p className="leading-tight">{auth.label}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditAuthorityAccount(null)}
                  className="text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Simpan Otoritas
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
