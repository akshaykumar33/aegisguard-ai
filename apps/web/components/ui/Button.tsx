import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.97] cursor-pointer whitespace-nowrap leading-none';

    const variants = {
      primary:
        'bg-foreground text-background hover:bg-foreground/90 border border-foreground/80 shadow-xs font-semibold',
      secondary:
        'bg-card text-foreground hover:bg-card-hover border border-border/60 shadow-xs',
      outline:
        'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/60 hover:border-zinc-600',
      ghost:
        'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
      danger:
        'bg-red-500/8 text-red-400 hover:bg-red-500/15 border border-red-500/15 hover:border-red-500/30 font-medium',
      glow:
        'bg-foreground text-background hover:bg-foreground/90 border border-foreground/80 shadow-[0_0_16px_-3px_rgba(255,255,255,0.25)] font-semibold',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-[11px] gap-1.5 rounded-md',
      sm: 'h-8 px-3.5 text-[12px] gap-2 rounded-lg',
      md: 'h-9 px-4 text-[13px] gap-2 rounded-lg',
      lg: 'h-10 px-5 text-[14px] gap-2.5 rounded-lg font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
