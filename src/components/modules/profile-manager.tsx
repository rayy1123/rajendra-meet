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
import { Pencil, KeyRound, LogOut, X, Loader2 } from 'lucide-react';

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
  const [modal, setModal] = useState<'none' | 'profile' | 'password'>('none');
  const [name, setName] = useState(fullName);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2600);
  }

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.set('full_name', name);
    const res: ProfileState = await updateProfileName(fd);
    setSaving(false);
    if (res.ok) {
      setModal('none');
      showToast(true, 'Profil berhasil diperbarui.');
    } else {
      showToast(false, res.error ?? 'Gagal menyimpan.');
    }
  }

  async function savePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.set('password', pw);
    fd.set('confirm', confirm);
    const res: ProfileState = await updatePassword(fd);
    setSaving(false);
    if (res.ok) {
      setPw('');
      setConfirm('');
      setModal('none');
      showToast(true, 'Password berhasil diubah.');
    } else {
      showToast(false, res.error ?? 'Gagal mengubah password.');
    }
  }

  function cancelModal() {
    setModal('none');
    showToast(false, 'Tidak ada perubahan.');
  }

  async function onPhoto(url: string) {
    setAvatar(url);
    const fd = new FormData();
    fd.set('avatar_url', url);
    await updateProfilePhoto(fd);
  }

  async function doLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Toast popup */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[80] rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

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
            onClick={() => setModal('profile')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Ubah Profil
          </button>
          <button
            type="button"
            onClick={() => setModal('password')}
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

      {/* Modal: Ubah Profil */}
      {modal === 'profile' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--m-ink)]">Ubah Profil</h3>
              <button type="button" onClick={cancelModal} className="rounded-lg p-1.5 text-[var(--m-muted)] hover:bg-[var(--m-soft)]" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 flex flex-col items-center gap-2">
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
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={cancelModal}
                  className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ganti Password */}
      {modal === 'password' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--m-ink)]">Ganti Password</h3>
              <button type="button" onClick={cancelModal} className="rounded-lg p-1.5 text-[var(--m-muted)] hover:bg-[var(--m-soft)]" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
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
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={cancelModal}
                  className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
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
