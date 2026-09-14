'use client';

import { useMemo } from 'react';

/**
 * Komponen SVG QR Code murni (tanpa dependensi eksternal)
 * Menghasilkan pola matriks 21x21 berstandar QR Code dengan
 * 3 Position Detection Patterns (Pojok Kiri-Atas, Kanan-Atas, Kiri-Bawah)
 * dan modul data deterministik dari string input.
 */
export function QrCodeSvg({
  value,
  size = 96,
  className = '',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const matrix = useMemo(() => {
    const N = 21;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // 1. Gambar Finder Pattern (7x7) di 3 sudut
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startY + r][startX + c] = true;
          } else {
            grid[startY + r][startX + c] = false;
          }
        }
      }
      // Separator putih di sekeliling finder
      for (let i = 0; i < 8; i++) {
        if (startX + 7 < N && startY + i < N) grid[startY + i][startX + 7] = false;
        if (startY + 7 < N && startX + i < N) grid[startY + 7][startX + i] = false;
        if (startX - 1 >= 0 && startY + i < N) grid[startY + i][startX - 1] = false;
        if (startY - 1 >= 0 && startX + i < N) grid[startY - 1][startX + i] = false;
      }
    };

    drawFinder(0, 0); // Kiri-Atas
    drawFinder(14, 0); // Kanan-Atas
    drawFinder(0, 14); // Kiri-Bawah

    // 2. Timing Patterns (baris 6 dan kolom 6 berselang-seling)
    for (let i = 8; i < 13; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Modul Data Deterministik dari Hash String
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }

    let seed = hash;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed;
    };

    // Isi area yang bukan finder pattern atau timing pattern
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Cek apakah area terlindungi (finder + separator)
        const inTopLeft = r <= 7 && c <= 7;
        const inTopRight = r <= 7 && c >= 13;
        const inBottomLeft = r >= 13 && c <= 7;
        const isTiming = (r === 6 && c >= 7 && c <= 13) || (c === 6 && r >= 7 && r <= 13);

        if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
          const rand = lcg();
          grid[r][c] = rand % 2 === 0;
        }
      }
    }

    return grid;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 21"
      className={className}
      shapeRendering="crispEdges"
      aria-label={`QR Code ${value}`}
    >
      <rect width="21" height="21" fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
        )
      )}
    </svg>
  );
}
