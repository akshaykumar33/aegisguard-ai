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
    primary: 'bg-primary/10 text-primary border-primary/25',
    secondary: 'bg-accent/10 text-accent border-accent/25',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
    danger: 'bg-destructive/10 text-destructive border-destructive/25',
    outline: 'bg-transparent text-muted-foreground border-border',
    neutral: 'bg-muted text-muted-foreground border-border/60',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    outline: 'bg-muted-foreground',
    neutral: 'bg-muted-foreground',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors select-none font-mono',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
