import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.ComponentProps<"div"> {
  title: string;
  description?: string;
  /** Ikon di dalam lencana berwarna brand di kiri judul. */
  icon?: React.ReactNode;
  /** Aksi di sisi kanan (tombol, link, dsb). */
  actions?: React.ReactNode;
}

/**
 * Header standar untuk halaman dashboard: lencana ikon + judul + deskripsi
 * di kiri, aksi di kanan. Menyelaraskan semua halaman ke satu ritme visual.
 */
export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
