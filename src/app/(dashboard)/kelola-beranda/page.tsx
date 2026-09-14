import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { LayoutTemplate } from 'lucide-react';
import { BerandaManager } from '@/components/modules/beranda-manager';

export const dynamic = 'force-dynamic';

export default async function KelolaBerandaPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Kelola Beranda' },
        ]}
        className="mb-2"
      />
      <PageHeader
        title="Kelola Konten Beranda"
        description="Atur poster lomba yang akan datang, counter statistik capaian, dan galeri dokumentasi untuk ditampilkan di halaman utama."
        icon={<LayoutTemplate className="h-6 w-6" />}
      />

      <BerandaManager />
    </div>
  );
}
