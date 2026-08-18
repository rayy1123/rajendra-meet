import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { GalleryGrid } from '@/components/modules/gallery-grid';
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const GALERI_DIR = path.join(process.cwd(), 'public', 'galeri');
const ACCEPTED = /\.(jpe?g|png|webp|gif|avif)$/i;

interface Photo {
  src: string;
  name: string;
  group: string;
}

function loadPhotos(): Photo[] {
  if (!existsSync(GALERI_DIR)) return [];
  return readdirSync(GALERI_DIR)
    .filter((f) => ACCEPTED.test(f))
    .sort()
    .map((f) => ({
      src: `/galeri/${f}`,
      name: f.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      group: inferGroup(f),
    }));
}

// Kelompokkan berdasar kata kunci nama file (sesuai preferensi Stitch: Action / Award / Behind)
function inferGroup(f: string): string {
  const n = f.toLowerCase();
  if (n.includes('medal') || n.includes('award') || n.includes('pod') || n.includes('upacara'))
    return 'Award Ceremonies';
  if (n.includes('coach') || n.includes('persiapan') || n.includes('prep') || n.includes('tim'))
    return 'Behind the Scenes';
  return 'Action Shots';
}

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false })
    .limit(1);
  const photos = loadPhotos();

  return (
    <PublicShell
      title="Galeri Foto Kejuaraan"
      subtitle="Dokumentasi visual: aksi perlombaan, upacara medali, dan momen di balik layar kolam renang."
    >
      <div className="pub-container pb-16">
        <div className="mb-4 text-xs text-[var(--m-muted)]">
          {events?.[0]?.name ?? 'Rajendra Meet'}
        </div>
        <GalleryGrid photos={photos} />
      </div>
    </PublicShell>
  );
}
