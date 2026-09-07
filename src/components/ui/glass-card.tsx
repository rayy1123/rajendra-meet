import * as React from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('glass-card', className)} {...props} />;
}
