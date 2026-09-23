'use client';

import { BrandedLoading } from '@/components/ui/branded-loading';

export function LoadingScreen({ text }: { text?: string }) {
  return <BrandedLoading text={text} />;
}

