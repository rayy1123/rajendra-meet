'use client';

import { useEffect, useRef } from 'react';

/**
 * Latar aurora untuk halaman utama: perpaduan warna (aqua / cyan / navy)
 * yang bergerak sendiri (blob) dan ikut berubah saat pengguna scroll.
 * - Blob punya parallax (bergerser vertikal mengikuti scroll).
 * - Sebuah overlay gradien muncul perlahan seiring progres scroll,
 *   sehingga "warna berubah" halus tanpa mengganggu keterbacaan.
 * Murni CSS variable + requestAnimationFrame, tanpa dependency.
 */
export function LandingAurora() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const y = window.scrollY || 0;
        const prog = Math.min(y / 700, 1); // 0 → 1 selama 700px scroll
        el.style.setProperty('--sy', `${y * 0.22}px`);
        el.style.setProperty('--prog', String(prog));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Dasar gradien lembut yang memudar seiring scroll */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[var(--m-aqua-soft)] via-[var(--m-bg)] to-[var(--m-bg)]"
        style={{ opacity: 'calc(1 - var(--prog, 0) * 0.55)' }}
      />

      {/* Blob warna bergerak sendiri + parallax saat scroll */}
      <div
        className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-[var(--m-aqua)]/25 blur-3xl animate-blob"
        style={{ transform: 'translateY(var(--sy, 0px))' }}
      />
      <div
        className="absolute -right-10 top-40 h-72 w-72 rounded-full bg-[var(--m-aqua-2)]/25 blur-3xl animate-blob-slow"
        style={{ transform: 'translateY(calc(var(--sy, 0px) * -0.6))' }}
      />
      <div
        className="absolute left-1/4 top-72 h-56 w-56 rounded-full bg-[var(--brand-3)]/20 blur-3xl animate-blob"
        style={{ transform: 'translateY(calc(var(--sy, 0px) * 0.45))' }}
      />

      {/* Overlay perpaduan warna yang muncul saat scroll (morph halus) */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-[var(--m-aqua)]/10 via-transparent to-[var(--m-aqua-2)]/10"
        style={{ opacity: 'var(--prog, 0)' }}
      />
    </div>
  );
}
