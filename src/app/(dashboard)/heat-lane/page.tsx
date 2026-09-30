import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HeatLanePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  redirect('/buku-acara' + (eventId ? `?event=${eventId}` : ''));
}
