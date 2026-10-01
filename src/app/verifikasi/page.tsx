import { PublicShell } from '@/components/layout/public-shell';
import { CertificateVerificationView } from '@/components/modules/certificate-verification-view';

export const dynamic = 'force-dynamic';

export default function VerificationIndexPage() {
  return (
    <PublicShell>
      <div className="py-8 px-4 sm:px-6">
        <CertificateVerificationView certData={null} />
      </div>
    </PublicShell>
  );
}
