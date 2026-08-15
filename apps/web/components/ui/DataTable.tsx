'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  /** Column heading. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  /** Right-align numeric columns so figures line up. */
  align?: 'left' | 'right';
  /** Hide on the stacked small-screen layout — use for low-value columns. */
  hideOnCard?: boolean;
  /** Promote to the card title on the stacked layout. */
  primary?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  /** Caption for assistive technology; visually hidden. */
  caption?: string;
  className?: string;
}

/**
 * One table implementation for the whole application.
 *
 * Six pages previously hand-rolled the same markup inside an overflow container,
 * which on a phone meant dragging a six-column grid sideways to read a single
 * record. Here the same data renders as a table from the medium breakpoint up
 * and as stacked records below it, so nothing is ever hidden off-screen.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  caption,
  className
}: DataTableProps<T>) {
  const interactive = Boolean(onRowClick);

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden shadow-xs', className)}>
      {/* Table — medium screens and up */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border-subtle last:border-b-0 transition-colors',
                  interactive && 'cursor-pointer hover:bg-muted/60'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={cn(
                      'px-3.5 py-2.5 align-middle text-xs',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked records — below the medium breakpoint */}
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((row, i) => {
          const primary = columns.find((c) => c.primary);
          const rest = columns.filter((c) => !c.primary && !c.hideOnCard);

          return (
            <li key={rowKey(row, i)}>
              <div
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'flex flex-col gap-2 rounded-lg border border-border bg-card p-3',
                  interactive && 'cursor-pointer transition-colors hover:bg-card-hover'
                )}
              >
                {primary && <div className="text-sm font-medium">{primary.cell(row)}</div>}

                <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
                  {rest.map((col) => (
                    <React.Fragment key={col.header}>
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground pt-0.5">
                        {col.header}
                      </dt>
                      <dd className="min-w-0 text-right">{col.cell(row)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
