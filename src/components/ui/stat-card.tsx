import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.ComponentProps<"div"> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** Bila diisi, seluruh kartu menjadi tautan. */
  href?: string;
  hint?: string;
}

/**
 * Kartu statistik ringkas untuk dashboard. Opsional terhubung ke halaman lain.
 */
export function StatCard({
  label,
  value,
  icon,
  href,
  hint,
  className,
  ...props
}: StatCardProps) {
  const inner = (
    <div
      className={cn(
        "group flex h-full flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-all",
        href && "hover:border-primary/40 hover:shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none">
        {inner}
      </Link>
    );
  }
  return inner;
}
