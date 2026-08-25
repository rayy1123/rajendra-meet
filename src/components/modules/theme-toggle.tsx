'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Toggle tema terang/gelap. Menyimpan preferensi di localStorage
 * (`scms-theme`) dan menerapkan class `.dark` ke <html>.
 * Default mengikuti preferensi sistem (prefers-color-scheme).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('scms-theme');
    const prefersDark =
      saved === null &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
    // Defer setState agar tidak sync dalam effect (hindari cascading renders).
    const id = requestAnimationFrame(() => {
      setDark(isDark);
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('scms-theme', next ? 'dark' : 'light');
  }

  // Hindari flash: sebelum mount, render placeholder netral.
  if (!mounted) {
    return (
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--m-border)] bg-[var(--m-surface)] ${className ?? ''}`}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Mode terang' : 'Mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--m-border)] bg-[var(--m-surface)] text-[var(--m-ink)] transition-ui hover:bg-[var(--m-aqua-soft)] hover:text-[var(--m-aqua-ink)] ${className ?? ''}`}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
