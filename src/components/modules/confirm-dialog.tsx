'use client';

import { ReactNode } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-bold text-[var(--m-ink)]">{title}</h3>
        <div className="mt-2 text-sm text-[var(--m-muted)]">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700'
                : 'rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-ink'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
