'use client';

import { Trophy, Waves } from 'lucide-react';

interface SampleRow {
  rank: number;
  name: string;
  school: string;
  time: string;
  split: string;
  final: string;
  lane: number;
}

const DATA: SampleRow[] = [
  { rank: 1, name: 'Adi Pratama', school: 'Klub Renang A', time: '00:32.10', split: '00:21.40', final: '00:53.50', lane: 4 },
  { rank: 2, name: 'Rendi Saputra', school: 'Sekolah B', time: '00:32.45', split: '00:21.70', final: '00:54.15', lane: 5 },
  { rank: 3, name: 'Fajar Nugroho', school: 'Klub C', time: '00:33.05', split: '00:22.10', final: '00:55.15', lane: 3 },
  { rank: 4, name: 'Dimas Wijaya', school: 'Sekolah D', time: '00:33.40', split: '00:22.25', final: '00:55.65', lane: 2 },
];

function rankClass(rank: number) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-n';
}

export function ResultsTableSample() {
  return (
    <div className="pub-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--m-border)] px-5 py-4">
        <div>
          <div className="text-sm font-bold text-[var(--m-ink)]">50m Gaya Bebas Putra</div>
          <div className="text-xs text-[var(--m-muted)]">Daftar Final — Heat 3 of 3</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--m-muted)]">
          <Waves className="h-4 w-4 text-[var(--m-aqua)]" /> KLIK OLEH: 08:24:53
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--m-soft)] text-xs uppercase text-[var(--m-muted)]">
            <tr>
              <th className="px-3 py-2 text-center">Rank</th>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Sekolah/Klub</th>
              <th className="px-3 py-2 text-right">Time 50</th>
              <th className="px-3 py-2 text-right">Split 300</th>
              <th className="px-3 py-2 text-right">Final</th>
              <th className="px-3 py-2 text-center">Lane</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {DATA.map((row) => (
              <tr key={row.rank} className="transition-colors hover:bg-muted/40">
                <td className="px-3 py-3 text-center">
                  <span className={rankClass(row.rank)}>{row.rank}</span>
                </td>
                <td className="px-3 py-3 text-sm font-medium text-[var(--m-ink)]">{row.name}</td>
                <td className="px-3 py-3 text-xs text-[var(--m-muted)]">{row.school}</td>
                <td className="px-3 py-3 text-right font-mono text-xs text-[var(--m-muted)]">{row.time}</td>
                <td className="px-3 py-3 text-right font-mono text-xs text-[var(--m-muted)]">{row.split}</td>
                <td className="px-3 py-3 text-right font-mono text-sm font-semibold text-[var(--m-ink)]">{row.final}</td>
                <td className="px-3 py-3 text-center text-xs text-[var(--m-muted)]">{row.lane}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-[var(--m-muted)]">
        <span>Powered by Rajendra Meet SCMS</span>
        <span className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> Live Result
        </span>
      </div>
    </div>
  );
}
