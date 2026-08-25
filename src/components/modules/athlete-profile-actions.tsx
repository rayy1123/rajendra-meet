'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AthleteFormModal, type AthleteFormValues } from '@/components/modules/athlete-form-modal';
import { ConfirmDialog } from '@/components/modules/confirm-dialog';
import { AvatarUpload } from '@/components/modules/avatar-upload';
import { deleteAthlete, updateAthletePhoto, type AthleteFormState } from '@/app/atlet-saya/actions';

export function AthleteProfileActions({
  id,
  userId,
  initial,
  photoUrl,
  schools,
}: {
  id: string;
  userId: string;
  initial: AthleteFormValues;
  photoUrl: string;
  schools: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [photo, setPhoto] = useState(photoUrl);

  async function doDelete() {
    const fd = new FormData();
    fd.set('id', id);
    const res: AthleteFormState = await deleteAthlete(fd);
    setConfirm(false);
    if (res.ok) location.href = '/atlet-saya';
  }

  async function onPhoto(url: string) {
    setPhoto(url);
    const fd = new FormData();
    fd.set('id', id);
    fd.set('photo_url', url);
    await updateAthletePhoto(fd);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <AvatarUpload folder="athlete" uid={userId} currentUrl={photo} onUploaded={onPhoto} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Pencil className="h-4 w-4" /> Edit
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Hapus
        </button>
      </div>

      <AthleteFormModal
        open={open}
        initial={initial}
        schools={schools}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          location.reload();
        }}
      />

      <ConfirmDialog
        open={confirm}
        title="Hapus atlet?"
        message="Atlet akan dihapus permanen."
        destructive
        confirmLabel="Hapus"
        onConfirm={doDelete}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
