'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ThemeName, AccentColor } from '@/lib/types';
import { Moon, Sun, Sparkles, Shield, Monitor, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, accent, setAccent } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { id: ThemeName; name: string; icon: React.ReactNode }[] = [
    { id: 'dark', name: 'Dark Obsidian', icon: <Moon className="w-3.5 h-3.5 text-zinc-400" /> },
    { id: 'stripe', name: 'Stripe Pearl', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'amoled', name: 'AMOLED Midnight', icon: <Monitor className="w-3.5 h-3.5 text-zinc-300" /> },
    { id: 'purple', name: 'Obsidian Purple', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'emerald', name: 'Emerald Cyber', icon: <Shield className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  const accents: { id: AccentColor; name: string; color: string }[] = [
    { id: 'indigo', name: 'Indigo', color: 'bg-blue-500' },
    { id: 'cyan', name: 'Cyan', color: 'bg-cyan-500' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
    { id: 'violet', name: 'Violet', color: 'bg-violet-500' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-500' },
    { id: 'amber', name: 'Amber', color: 'bg-amber-500' },
  ];

  const activeThemeObj = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        title="Theme & Accent Palette"
        aria-label="Theme selector"
      >
        <span>{activeThemeObj.icon}</span>
        <Palette className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card-elevated border border-border p-2 shadow-2xl z-50 animate-scaleIn">
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Theme
          </div>

          <div className="space-y-0.5">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors',
                    isSelected
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-border-subtle" />

          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Accent Color
          </div>

          <div className="grid grid-cols-6 gap-1 px-1">
            {accents.map((acc) => {
              const isSelected = accent === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => setAccent(acc.id)}
                  title={acc.name}
                  className={cn(
                    'h-5 rounded-md transition-all flex items-center justify-center relative',
                    acc.color,
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-105' : 'opacity-70 hover:opacity-100'
                  )}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
