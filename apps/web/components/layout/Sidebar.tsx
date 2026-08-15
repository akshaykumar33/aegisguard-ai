'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { persona, isSidebarCollapsed, setIsSidebarCollapsed } = useApp();

  const mainNav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/docs', label: 'Documentation', icon: BookOpen, badge: 'v1.4' },
    { href: '/reviews', label: 'PR Review & Scanner', icon: GitPullRequest, badge: 'Live' },
    { href: '/terminal', label: 'CLI & Terminal', icon: Terminal },
    { href: '/benefits', label: 'Plan Capabilities', icon: Sparkles },
    { href: '/usage', label: 'Usage & Quotas', icon: Zap },
    { href: '/billing', label: 'Billing & Ledger', icon: CreditCard },
    { href: '/organization', label: 'Team & Seats', icon: Building2 },
    { href: '/support', label: 'Support Helpdesk', icon: LifeBuoy, count: '1' },
  ];

  const adminNav = [
    { href: '/admin', label: 'Customer CRM', icon: Users },
    { href: '/admin/plans', label: 'Plan Builder', icon: Layers },
    { href: '/admin/broadcast', label: 'Broadcaster', icon: Radio },
    { href: '/admin/audit', label: 'Audit Trail', icon: History },
  ];

  const showAdmin = persona.role === 'admin';

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border/60 bg-background transition-all duration-200 z-40 sticky top-0 h-screen select-none',
        isSidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-border/60 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-foreground text-background shrink-0 font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight text-foreground">
              <span>CodeGuard</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono">AI</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        <div>
          {!isSidebarCollapsed && (
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Platform
            </div>
          )}
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group relative',
                    isActive
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-mono border border-primary/20">
                          {item.badge}
                        </span>
                      )}
                      {item.count && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-warning/10 text-warning font-mono border border-warning/20">
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {showAdmin && (
          <div>
            {!isSidebarCollapsed && (
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                <span>Super Admin</span>
              </div>
            )}
            <nav className="space-y-0.5">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group relative',
                      isActive
                        ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground')} />
                    {!isSidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer / System Status */}
      <div className="p-2.5 border-t border-border/60 shrink-0">
        {!isSidebarCollapsed ? (
          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-medium text-foreground text-[11px]">Gemini 3.7 Flash</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">v1.4</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1" title="Gemini 3.7 Flash Active">
            <span className="w-2 h-2 rounded-full bg-success" />
          </div>
        )}
      </div>
    </aside>
  );
}
