'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { PersonaSwitcher } from './PersonaSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Search, Bell, BookOpen, Menu } from 'lucide-react';

export function Navbar() {
  const { persona, setIsCommandOpen, setIsUpgradeModalOpen, setIsMobileDrawerOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/70 bg-background/80 px-3.5 sm:px-6 backdrop-blur-xl transition-colors">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsCommandOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-card/60 border border-border hover:border-border-focus hover:bg-card/90 text-muted-foreground hover:text-foreground text-[13px] transition-all w-44 sm:w-64 shadow-xs cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="truncate text-[12px]">Search commands...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Middle: Minimalist Persona Switcher */}
      <div className="hidden lg:flex items-center">
        <PersonaSwitcher />
      </div>

      {/* Right side: Tools, Theme, Docs, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />

        <a
          href="http://localhost:3000/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:border-border-focus hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          title="OpenAPI / Swagger Specs"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => setIsCommandOpen(true)}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:border-border-focus hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Profile Pill */}
        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-border hover:border-border-focus hover:bg-card transition-all text-left cursor-pointer shadow-xs"
        >
          <img
            src={persona.avatarUrl}
            alt={persona.name}
            className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-border/50"
          />
          <div className="hidden xl:block">
            <div className="text-[13px] font-medium text-foreground leading-none">{persona.name}</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
            {persona.tier}
          </span>
        </button>
      </div>
    </header>
  );
}
