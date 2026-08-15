'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useApp } from '@/lib/store';
import {
  LayoutDashboard,
  GitPullRequest,
  Terminal,
  Sparkles,
  Zap,
  CreditCard,
  Building2,
  BookOpen,
  LifeBuoy,
  Users,
  Layers,
  Radio,
  History,
  Moon,
  Sun,
  Monitor,
  Shield,
  GraduationCap,
  Crown,
  AlertTriangle,
  Search,
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandOpen,
    setIsCommandOpen,
    setTheme,
    setPersonaRole,
    setIsUpgradeModalOpen,
    setIsInviteModalOpen,
    setIsTicketModalOpen,
    setIsBreakGlassModalOpen,
  } = useApp();

  const handleSelect = (callback: () => void) => {
    callback();
    setIsCommandOpen(false);
  };

  if (!isCommandOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={() => setIsCommandOpen(false)}
        aria-hidden="true"
      />

      <Command
        className="relative z-10 w-full max-w-xl bg-card-elevated border border-border rounded-xl shadow-2xl overflow-hidden animate-scaleIn"
        loop
      >
        <div className="flex items-center px-3.5 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0 opacity-60" />
          <Command.Input
            placeholder="Type a command or search..."
            autoFocus
            className="w-full bg-transparent py-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-1.5">
          <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
            No matching results.
          </Command.Empty>

          <Command.Group heading="⚡ Quick Actions">
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/reviews'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-primary" />
              <span>Run Automated AI Code Review</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">Gemini 3.7</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => setIsBreakGlassModalOpen(true))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span>Request Break-Glass Emergency Override</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => setIsUpgradeModalOpen(true))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>Manage Subscription & Plan Tiers</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => setIsTicketModalOpen(true))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-accent" />
              <span>Open Support Ticket</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="🧭 Navigation">
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => router.push('/docs'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Documentation & Package APIs</span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">v1.4</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => router.push('/reviews'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>PR Review & Scanner</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => router.push('/terminal'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>CLI & Terminal</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => router.push('/billing'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Billing & Ledger</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => router.push('/organization'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Team & Seats</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => router.push('/admin'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>Super Admin CRM</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="🎭 Switch Persona">
            <Command.Item
              onSelect={() => handleSelect(() => setPersonaRole('pro'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Pro Engineer (Elena Rostova)</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => setPersonaRole('student'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Student Developer (Alex Rivera)</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => setPersonaRole('org'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Org Owner (Acme Payments)</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSelect(() => setPersonaRole('admin'))}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-accent" />
              <span>Super Admin (Sarah Vance)</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Navigate</span>
            <kbd className="px-1 py-0.2 rounded bg-card border border-border text-[10px] font-mono">↑↓</kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Select</span>
            <kbd className="px-1 py-0.2 rounded bg-card border border-border text-[10px] font-mono">↵</kbd>
          </div>
        </div>
      </Command>
    </div>
  );
}
