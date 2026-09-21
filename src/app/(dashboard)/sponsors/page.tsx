import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Handshake } from 'lucide-react';
import { SponsorsManager } from '@/components/modules/sponsors-manager';
import { DEFAULT_SPONSORS, type SponsorItem } from '@/lib/data/sponsors';

export const dynamic = 'force-dynamic';

export default async function SponsorsPage() {
  const supabase = await createClient();

  // Coba ambil dari tabel sponsors jika tabel sudah ada di database
  const { data: dbSponsors } = await supabase
    .from('sponsors')
    .select('*')
    .order('order_no', { ascending: true });

  let sponsorList: SponsorItem[] = DEFAULT_SPONSORS;

  if (dbSponsors && dbSponsors.length > 0) {
    sponsorList = dbSponsors.map((s: {
      id: string;
      name: string;
      tier: string;
      logo_url: string;
      website_url?: string | null;
      is_active: boolean;
      order_no: number;
    }) => ({
      id: s.id,
      name: s.name,
      tier: s.tier as SponsorItem['tier'],
      logoUrl: s.logo_url,
      websiteUrl: s.website_url,
      isActive: s.is_active,
      orderNo: s.order_no,
    }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Sponsorship Kejuaraan' },
        ]}
        className="mb-2"
      />
      <PageHeader
        title="Mitra & Sponsorship Kejuaraan"
        description="Kelola mitra resmi dan logo sponsor untuk ditampilkan pada Sertifikat, Buku Acara, dan Petunjuk Teknis (Juknis)."
        icon={<Handshake className="h-6 w-6" />}
      />

      <SponsorsManager initialSponsors={sponsorList} />
    </div>
  );
}
