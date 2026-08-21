import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />
      <PageHeader
        title="Dashboard"
        description="Panel utama Rajendra Meet."
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Gunakan menu di sebelah kiri untuk membuka modul kejuaraan:
          Kejuaraan / Events, Atlet, Sekolah / Klub, Acara &amp; Heat, Input
          Hasil, Perangkingan, Klasemen Medali, dan lainnya.
        </CardContent>
      </Card>
    </div>
  );
}
