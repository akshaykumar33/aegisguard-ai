'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SelectProps {
  label?: string;
  options?: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, label, options = [], value, onChange, placeholder = 'Select…', icon, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }, [isOpen]);

    const handleSelect = (optValue: string) => {
      onChange?.({ target: { value: optValue } });
      setIsOpen(false);
    };

    return (
      <div className="space-y-1.5 w-full" ref={containerRef}>
        {label && (
          <label className="block text-[11px] font-medium text-muted-foreground tracking-widest uppercase font-mono">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Trigger button */}
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between gap-2.5 rounded-lg border border-border bg-card py-2.5 text-[13px] font-medium text-foreground outline-none',
              'transition-all duration-150 ease-out cursor-pointer shadow-xs',
              'hover:border-border-focus hover:bg-card-hover',
              isOpen ? 'border-border-focus ring-1 ring-ring/40 bg-card-hover' : '',
              icon ? 'pl-10 pr-3.5' : 'pl-3.5 pr-3.5',
              disabled && 'opacity-50 pointer-events-none',
              className
            )}
          >
            {icon && (
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                {icon}
              </span>
            )}
            <span className={cn('truncate text-left flex-1', !selectedOption && 'text-muted-foreground')}>
              {selectedOption
                ? `${selectedOption.label}${selectedOption.sublabel ? ` (${selectedOption.sublabel})` : ''}`
                : placeholder}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown popover */}
          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-xl shadow-black/20 py-1 animate-in fade-in-0 zoom-in-95 duration-100">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px] text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-muted-foreground mt-0.5">{opt.sublabel}</span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
