'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ThemeName, AccentColor } from '@/lib/types';
import {
  Moon,
  Sun,
  Palette,
  Check,
  Terminal,
  Sparkles,
  Zap,
  Coffee,
  Compass,
  Flame,
  Shield,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeOption {
  id: ThemeName;
  name: string;
  category: 'dark' | 'light';
  desc: string;
  bgHex: string;
  primaryHex: string;
  icon: React.ReactNode;
}

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

  const themes: ThemeOption[] = [
    {
      id: 'dark',
      name: 'Obsidian Cyber',
      category: 'dark',
      desc: 'Midnight slate & electric indigo',
      bgHex: '#080c14',
      primaryHex: '#3b82f6',
      icon: <Zap className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      id: 'tokyo-night',
      name: 'Tokyo Night',
      category: 'dark',
      desc: 'Japanese navy & lavender glow',
      bgHex: '#16161e',
      primaryHex: '#7aa2f7',
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      id: 'dracula',
      name: 'Dracula Vampire',
      category: 'dark',
      desc: 'Gothic slate & neon magenta',
      bgHex: '#21222c',
      primaryHex: '#ff79c6',
      icon: <Flame className="w-3.5 h-3.5 text-pink-400" />,
    },
    {
      id: 'matrix',
      name: 'Monokai Matrix',
      category: 'dark',
      desc: 'Hacker obsidian & cyber green',
      bgHex: '#0c0f0c',
      primaryHex: '#22c55e',
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'nord',
      name: 'Nord Arctic',
      category: 'dark',
      desc: 'Polar night & glacial frost',
      bgHex: '#242933',
      primaryHex: '#88c0d0',
      icon: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      id: 'github-dimmed',
      name: 'GitHub Dimmed',
      category: 'dark',
      desc: 'Slate charcoal & sky cyan',
      bgHex: '#1c2128',
      primaryHex: '#539bf5',
      icon: <Shield className="w-3.5 h-3.5 text-sky-400" />,
    },
    {
      id: 'solarized-dark',
      name: 'Solarized Dark',
      category: 'dark',
      desc: 'Deep marine teal & solar amber',
      bgHex: '#002b36',
      primaryHex: '#268bd2',
      icon: <Layers className="w-3.5 h-3.5 text-teal-400" />,
    },
    {
      id: 'light',
      name: 'Vercel / Apple Pure',
      category: 'light',
      desc: 'Ceramic porcelain & cobalt blue',
      bgHex: '#ffffff',
      primaryHex: '#2563eb',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      id: 'latte',
      name: 'Catppuccin Latte',
      category: 'light',
      desc: 'Warm paper mocha & pastel sapphire',
      bgHex: '#eff1f5',
      primaryHex: '#1e66f5',
      icon: <Coffee className="w-3.5 h-3.5 text-amber-600" />,
    },
  ];

  const accents: { id: AccentColor; name: string; hex: string; bgClass: string }[] = [
    { id: 'steel', name: 'Electric Steel', hex: '#3b82f6', bgClass: 'bg-blue-500' },
    { id: 'cyan', name: 'Neon Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500' },
    { id: 'teal', name: 'Arctic Teal', hex: '#14b8a6', bgClass: 'bg-teal-500' },
    { id: 'violet', name: 'Cyber Violet', hex: '#a855f7', bgClass: 'bg-purple-500' },
    { id: 'emerald', name: 'Matrix Emerald', hex: '#10b981', bgClass: 'bg-emerald-500' },
    { id: 'amber', name: 'Solar Amber', hex: '#f59e0b', bgClass: 'bg-amber-500' },
  ];

  const activeThemeObj = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-zinc-700 bg-card/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs cursor-pointer active:scale-95"
        title="Theme & Coder Palettes"
        aria-label="Theme selector"
      >
        <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: activeThemeObj.primaryHex }} />
        <span className="hidden sm:inline text-xs font-medium text-foreground">{activeThemeObj.name.split(' ')[0]}</span>
        <Palette className="w-3 h-3 opacity-60 ml-0.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border p-2 shadow-xl z-50 animate-scaleIn space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between px-1.5 pb-1 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Theme Palettes</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{themes.length}</span>
          </div>

          {/* Dark / Coder Themes */}
          <div className="space-y-0.5">
            <div className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Dark & Developer
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
              {themes.filter((t) => t.category === 'dark').map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-border" style={{ backgroundColor: t.primaryHex }} />
                      <span className="truncate">{t.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Light Themes */}
          <div className="space-y-0.5 pt-1 border-t border-border">
            <div className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Light & Studio
            </div>
            <div className="space-y-0.5">
              {themes.filter((t) => t.category === 'light').map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-border" style={{ backgroundColor: t.primaryHex }} />
                      <span className="truncate">{t.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Palette */}
          <div className="space-y-1.5 pt-1 border-t border-border">
            <div className="flex items-center justify-between px-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Accent
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{accent.toUpperCase()}</span>
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
                      'h-5 rounded-md transition-all flex items-center justify-center relative cursor-pointer',
                      acc.bgClass,
                      isSelected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card scale-105' : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
