'use client';

import { useRouter } from 'next/navigation';

export function RouteEventSelect({
  events,
  current,
  basePath,
}: {
  events: { id: string; name: string }[];
  current: string;
  basePath: string;
}) {
  const router = useRouter();
  return (
    <select
      className="rounded-lg border border-[var(--m-border)] bg-[var(--m-surface)] px-3 py-2 text-sm font-medium text-[var(--m-ink)]"
      value={current}
      onChange={(e) => router.push(`${basePath}?event=${e.target.value}`)}
    >
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.name}
        </option>
      ))}
    </select>
  );
}
