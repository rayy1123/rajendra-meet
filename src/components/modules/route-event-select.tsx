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
      className="pub-field w-full min-w-52 font-medium text-[var(--m-ink)] sm:w-auto"
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
