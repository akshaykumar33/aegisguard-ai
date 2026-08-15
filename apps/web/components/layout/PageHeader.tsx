import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons or filters aligned to the trailing edge. Wraps below on phones. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page heading.
 *
 * Each page previously repeated a 3xl heading with a 7x7 accent icon and a
 * generous divider — marketing-site proportions on a tool that is scanned
 * rather than read. The icon carried no information beyond the words next to
 * it, so it is gone; the type scale is smaller and the rhythm tighter, which
 * puts several more rows of real data above the fold.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border/40 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && (
          <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
