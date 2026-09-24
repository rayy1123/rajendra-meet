'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import Image from 'next/image';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function MobileNavDrawer({ open, onClose, title = 'Menu', children, footer }: MobileNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" showCloseButton={false} className="w-72 max-w-[85vw] p-0">
        <SheetHeader className="flex flex-row items-center gap-2 border-b px-5 py-4 text-left space-y-0">
          <Image src="/brand/logo.png" alt="Rajendra Meet" width={28} height={28} className="h-7 w-auto" />
          <SheetTitle className="text-sm font-bold tracking-tight">{title}</SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-[var(--m-muted)] hover:bg-[var(--m-soft)]"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
        {footer && <div className="border-t border-[var(--m-border)] p-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
