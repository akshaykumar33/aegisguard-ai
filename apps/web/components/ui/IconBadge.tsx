'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type IconBadgeColor =
  | 'primary'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'ruby'
  | 'violet'
  | 'slate';

export interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: IconBadgeColor;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function IconBadge({
  color = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: IconBadgeProps) {
  const colorStyles: Record<IconBadgeColor, string> = {
    primary:
      'bg-secondary text-foreground border-border',
    cyan:
      'bg-accent-light text-accent border-accent/20',
    emerald:
      'bg-success-light text-success border-success/20',
    amber:
      'bg-warning-light text-warning border-warning/20',
    ruby:
      'bg-destructive-light text-destructive border-destructive/20',
    violet:
      'bg-primary-light text-primary border-primary/20',
    slate:
      'bg-muted text-muted-foreground border-border',
  };

  const sizeStyles = {
    xs: 'h-6 w-6 rounded-md text-xs [&>svg]:h-3.5 [&>svg]:w-3.5',
    sm: 'h-7 w-7 rounded-lg text-xs [&>svg]:h-3.5 [&>svg]:w-3.5',
    md: 'h-9 w-9 rounded-lg text-sm [&>svg]:h-4.5 [&>svg]:w-4.5',
    lg: 'h-11 w-11 rounded-xl text-base [&>svg]:h-5.5 [&>svg]:w-5.5',
  };

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center border transition-colors select-none shadow-xs',
        colorStyles[color],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
