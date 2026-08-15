import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({
  value,
  max = 100,
  variant,
  size = 'md',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const determinedVariant =
    variant || (percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : 'primary');

  const variantStyles = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-muted border border-border/40', sizes[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', variantStyles[determinedVariant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
