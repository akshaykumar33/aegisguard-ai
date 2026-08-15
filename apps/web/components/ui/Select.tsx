'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
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
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      label,
      options = [],
      value,
      onChange,
      placeholder = 'Select…',
      icon,
      disabled,
      pageSize = DEFAULT_PAGE_SIZE,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    // Reset pagination and search on open/close
    useEffect(() => {
      if (isOpen) {
        setVisibleCount(pageSize);
        setSearchQuery('');
      }
    }, [isOpen, pageSize]);

    // Filter options
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase();
      return options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
          o.value.toLowerCase().includes(q)
      );
    }, [options, searchQuery]);

    // Sliced options for lazy loading (10 per scroll)
    const displayedOptions = useMemo(() => {
      return filteredOptions.slice(0, visibleCount);
    }, [filteredOptions, visibleCount]);

    // Handle scroll for lazy loading
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      // When within 30px of bottom, lazy load next batch of 10 items
      if (scrollHeight - scrollTop - clientHeight < 30) {
        if (visibleCount < filteredOptions.length) {
          setVisibleCount((prev) => Math.min(prev + pageSize, filteredOptions.length));
        }
      }
    };

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
          <label className="block text-[11px] font-semibold text-muted-foreground tracking-widest uppercase font-mono">
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

          {/* Dropdown popover with scrollable lazy-loading (10 per scroll) */}
          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/40 py-1.5 animate-in fade-in-0 zoom-in-95 duration-100">
              {/* Optional search input when many options exist */}
              {options.length > 8 && (
                <div className="p-2 border-b border-border/50">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setVisibleCount(pageSize);
                      }}
                      placeholder="Search options…"
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-muted/60 border border-border/50 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-border-focus focus:ring-1 focus:ring-ring/30"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Scrollable list container */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="max-h-64 overflow-y-auto overscroll-contain py-1 space-y-0.5 divide-y-0 scrollbar-thin"
              >
                {displayedOptions.length > 0 ? (
                  displayedOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px] text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-secondary text-secondary-foreground font-semibold'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-[11px] text-muted-foreground mt-0.5 font-mono">{opt.sublabel}</span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No matching options found
                  </div>
                )}
              </div>

              {/* Lazy loading indicator / count status */}
              {filteredOptions.length > pageSize && (
                <div className="px-3.5 py-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between font-mono bg-muted/20">
                  <span>
                    Showing {displayedOptions.length} of {filteredOptions.length}
                  </span>
                  {visibleCount < filteredOptions.length && (
                    <span className="text-primary font-medium animate-pulse">
                      Scroll for +{Math.min(pageSize, filteredOptions.length - visibleCount)} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
