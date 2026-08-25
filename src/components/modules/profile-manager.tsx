'use client';

import { useState } from 'react';
import { updateProfileName, updatePassword, updateProfilePhoto, type ProfileState } from '@/app/profile/actions';
import { AvatarUpload } from '@/components/modules/avatar-upload';

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
  const [name, setName] = useState(fullName);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [avatar, setAvatar] = useState(avatarUrl);

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    const fd = new FormData();
    fd.set('full_name', name);
    const res: ProfileState = await updateProfileName(fd);
    setSavingName(false);
    setNameMsg(res.ok ? { ok: true, msg: 'Nama tersimpan.' } : { ok: false, msg: res.error ?? 'Gagal.' });
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
    <div className="grid gap-4 lg:grid-cols-2">
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
        <AvatarUpload folder="viewer" uid={userId} currentUrl={avatar} onUploaded={onPhoto} />
        <div>
          <div className="font-semibold text-[var(--m-ink)]">{fullName || '(belum diisi)'}</div>
          <div className="text-sm text-[var(--m-muted)]">{email}</div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {ROLE_LABELS[role] ?? role}
        </span>
      </div>

      {/* Edit nama */}
      <div className="pub-card p-6">
        <h3 className="mb-3 font-semibold text-[var(--m-ink)]">Nama Akun</h3>
        <form onSubmit={saveName} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Nama lengkap"
          />
          {nameMsg && (
            <p className={nameMsg.ok ? 'text-sm text-emerald-600' : 'text-sm text-red-600'}>
              {nameMsg.msg}
            </p>
          )}
          <button
            type="submit"
            disabled={savingName}
            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink disabled:opacity-50"
          >
            {savingName ? 'Menyimpan…' : 'Simpan Nama'}
          </button>
        </form>
      </div>

      {/* Ganti password */}
      <div className="pub-card p-6 lg:col-span-2">
        <h3 className="mb-3 font-semibold text-[var(--m-ink)]">Ubah Password</h3>
        <form onSubmit={savePw} className="grid gap-3 sm:grid-cols-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Password baru"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Konfirmasi"
          />
          <button
            type="submit"
            disabled={savingPw}
            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink disabled:opacity-50"
          >
            {savingPw ? 'Menyimpan…' : 'Ubah Password'}
          </button>
        </form>
        {pwMsg && (
          <p className={`mt-2 text-sm ${pwMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {pwMsg.msg}
          </p>
        )}
      </div>
    </div>
  );
}
