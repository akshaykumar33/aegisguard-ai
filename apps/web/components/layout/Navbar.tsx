'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { PersonaSwitcher } from './PersonaSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Search, Bell, BookOpen, Menu, Shield } from 'lucide-react';

export function Navbar() {
  const { persona, setIsCommandOpen, setIsUpgradeModalOpen, setIsMobileDrawerOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsCommandOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/70 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors w-44 sm:w-56"
        >
          <Search className="w-3.5 h-3.5 shrink-0 opacity-60" />
          <span className="truncate">Search commands...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Middle: Minimalist Persona Switcher */}
      <div className="hidden lg:flex items-center">
        <PersonaSwitcher />
      </div>

      {/* Right side: Tools, Theme, Docs, Profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <a
          href="http://localhost:3000/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="OpenAPI / Swagger Specs"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => setIsCommandOpen(true)}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Profile Pill */}
        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors text-left"
        >
          <img
            src={persona.avatarUrl}
            alt={persona.name}
            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
          <div className="hidden xl:block">
            <div className="text-xs font-medium text-foreground leading-none">{persona.name}</div>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
            {persona.tier}
          </span>
        </button>
      </div>
    </header>
  );
}
