'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
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
  X,
} from 'lucide-react';
import { PersonaSwitcher } from './PersonaSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export function MobileDrawer() {
  const pathname = usePathname();
  const { persona, isMobileDrawerOpen, setIsMobileDrawerOpen } = useApp();

  const mainNav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/reviews', label: 'PR Review & Scanner', icon: GitPullRequest },
    { href: '/terminal', label: 'CLI & Terminal', icon: Terminal },
    { href: '/benefits', label: 'Plan Capabilities', icon: Sparkles },
    { href: '/usage', label: 'Usage & Quotas', icon: Zap },
    { href: '/billing', label: 'Billing & Ledger', icon: CreditCard },
    { href: '/organization', label: 'Team & Seats', icon: Building2 },
    { href: '/documents', label: 'Knowledge Hub', icon: BookOpen },
    { href: '/support', label: 'Support Helpdesk', icon: LifeBuoy },
  ];

  const adminNav = [
    { href: '/admin', label: 'Customer CRM', icon: Users },
    { href: '/admin/plans', label: 'Plan Builder', icon: Layers },
    { href: '/admin/broadcast', label: 'Broadcaster', icon: Radio },
    { href: '/admin/audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <AnimatePresence>
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-80 max-w-[85vw] h-full bg-sidebar border-r border-border p-5 flex flex-col z-10 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <Link
                href="/"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-heading font-extrabold text-sm text-foreground">CodeGuard AI</span>
              </Link>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Persona Switcher for mobile */}
            <div className="my-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Simulate Role
              </div>
              <PersonaSwitcher />
            </div>

            {/* Nav list */}
            <nav className="flex-1 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Platform
              </div>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-text-secondary hover:text-foreground hover:bg-card-hover'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {persona.role === 'admin' && (
                <div className="pt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Super Admin
                  </div>
                  {adminNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-accent text-white font-semibold'
                            : 'text-text-secondary hover:text-foreground hover:bg-card-hover'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>

            <div className="pt-4 border-t border-border-subtle mt-4">
              <ThemeToggle />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
