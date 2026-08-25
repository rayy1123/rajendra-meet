'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  updateProfileName,
  updatePassword,
  updateProfilePhoto,
  type ProfileState,
} from '@/app/profile/actions';
import { AvatarUpload } from '@/components/modules/avatar-upload';
import { ConfirmDialog } from '@/components/modules/confirm-dialog';
import { Pencil, KeyRound, LogOut } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  event_admin: 'Event Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileManager({
  userId,
  email,
  fullName,
  role,
  avatarUrl,
}: {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string;
}) {
  const [active, setActive] = useState<'none' | 'profile' | 'password'>('none');
  const [name, setName] = useState(fullName);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [avatar, setAvatar] = useState(avatarUrl);

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function doLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    const fd = new FormData();
    fd.set('full_name', name);
    const res: ProfileState = await updateProfileName(fd);
    setSavingName(false);
    setNameMsg(res.ok ? { ok: true, msg: 'Nama tersimpan.' } : { ok: false, msg: res.error ?? 'Gagal.' });
    if (res.ok) setActive('none');
  }

  async function savePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg(null);
    const fd = new FormData();
    fd.set('password', pw);
    fd.set('confirm', confirm);
    const res: ProfileState = await updatePassword(fd);
    setSavingPw(false);
    if (res.ok) {
      setPw('');
      setConfirm('');
      setPwMsg({ ok: true, msg: 'Password diubah.' });
      setActive('none');
    } else {
      setPwMsg({ ok: false, msg: res.error ?? 'Gagal.' });
    }
  }

  async function onPhoto(url: string) {
    setAvatar(url);
    const fd = new FormData();
    fd.set('avatar_url', url);
    await updateProfilePhoto(fd);
  }

  return (
    <div className="space-y-4">
      {/* Kartu identitas */}
      <div className="pub-card flex flex-col items-center gap-3 p-6 text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-primary/10">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
              {initials(fullName || email)}
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold text-[var(--m-ink)]">{fullName || '(belum diisi)'}</div>
          <div className="text-sm text-[var(--m-muted)]">{email}</div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {ROLE_LABELS[role] ?? role}
        </span>

        {/* Sub-option */}
        <div className="mt-2 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => setActive(active === 'profile' ? 'none' : 'profile')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Ubah Profil
          </button>
          <button
            type="button"
            onClick={() => setActive(active === 'password' ? 'none' : 'password')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <KeyRound className="h-4 w-4" /> Ganti Password
          </button>
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </div>

      {/* Section: Ubah Profil */}
      {active === 'profile' && (
        <div className="pub-card space-y-4 p-6">
          <h3 className="font-semibold text-[var(--m-ink)]">Ubah Profil</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-primary/10">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                  {initials(fullName || email)}
                </div>
              )}
            </div>
            <AvatarUpload folder="viewer" uid={userId} currentUrl={avatar} onUploaded={onPhoto} />
          </div>
          <form onSubmit={saveName} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Nama lengkap"
              />
            </div>
            {nameMsg && (
              <p className={nameMsg.ok ? 'text-sm text-emerald-600' : 'text-sm text-red-600'}>
                {nameMsg.msg}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingName}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink disabled:opacity-50"
              >
                {savingName ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => setActive('none')}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold hover:bg-accent"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section: Ganti Password */}
      {active === 'password' && (
        <div className="pub-card space-y-4 p-6">
          <h3 className="font-semibold text-[var(--m-ink)]">Ganti Password</h3>
          <form onSubmit={savePw} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Password Baru</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Konfirmasi</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Ulangi password"
              />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                {pwMsg.msg}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingPw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink disabled:opacity-50"
              >
                {savingPw ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => setActive('none')}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold hover:bg-accent"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={showLogout}
        title="Keluar dari akun?"
        message="Anda akan keluar dan perlu login kembali untuk mengakses dashboard."
        destructive
        confirmLabel={loggingOut ? 'Memproses…' : 'Ya, Keluar'}
        onConfirm={doLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
