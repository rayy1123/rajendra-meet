/* eslint-disable @typescript-eslint/no-explicit-any */
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Activity } from 'lucide-react';
import { EquipmentTelemetryManager } from '@/components/modules/equipment-telemetry-manager';
import { getEquipmentServer } from '@/lib/data/equipment-server';

export const dynamic = 'force-dynamic';

export default async function EquipmentPage() {
  const items = await getEquipmentServer();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Peralatan & Telemetri Arena' }]} className="mb-2" />
      <PageHeader
        title="Status Peralatan & Telemetri Arena"
        description="Pantau telemetri real-time Swiss Timing Omega Console, sensor touchpad 8 lintasan, papan skor digital LED, dan kalibrasi logistik kolam."
        icon={<Activity className="h-6 w-6" />}
      />

      <EquipmentTelemetryManager maintenanceItems={items} />
    </div>
  );
}
