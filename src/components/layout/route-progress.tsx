'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * RouteProgress: Indikator perpindahan halaman instan di tepi atas layar.
 * Menghilangkan kesan "macet" saat pengguna mengklik tautan atau menu navigasi.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Selesaikan animasi saat rute berhasil berpindah
  useEffect(() => {
    if (navigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Tangkap klik pada tautan internal untuk memberikan feedback visual 0ms instan
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Abaikan link eksternal, tel:, mailto:, download, atau target=_blank
      if (
        !href ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        targetAttr === '_blank'
      ) {
        return;
      }

      // Jika URL tujuan berbeda dengan URL saat ini, picu indikator progress
      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setNavigating(true);
        setProgress(30);

        // Simulasi progres dinamis
        const step1 = setTimeout(() => setProgress(65), 150);
        const step2 = setTimeout(() => setProgress(85), 450);

        return () => {
          clearTimeout(step1);
          clearTimeout(step2);
        };
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  if (!navigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[99999] h-[2.5px] w-full pointer-events-none overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-[var(--m-aqua)] via-sky-400 to-[var(--m-aqua-ink)] shadow-[0_0_8px_rgba(2,132,199,0.7)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: 'width, opacity',
        }}
      />
    </div>
  );
}
