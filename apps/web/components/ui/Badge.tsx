import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    success: 'bg-success-light text-success border-success/20',
    warning: 'bg-warning-light text-warning border-warning/20',
    danger: 'bg-destructive-light text-destructive border-destructive/20',
    outline: 'bg-transparent text-muted-foreground border-border',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-muted-foreground',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    outline: 'bg-muted-foreground',
    neutral: 'bg-muted-foreground',
  };

  const sizes = {
    sm: 'text-[10px] px-2.5 py-1 gap-1.5 leading-none font-semibold',
    md: 'text-[11px] px-3 py-1 gap-2 leading-none font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border tracking-wide select-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-[6px] w-[6px] shrink-0">
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dotColors[variant])} />
          <span className={cn('relative inline-flex h-[6px] w-[6px] rounded-full', dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}
