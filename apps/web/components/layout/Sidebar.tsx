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
        isSidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border shrink-0 transition-all',
          isSidebarCollapsed ? 'justify-center px-2 relative' : 'justify-between px-4'
        )}
      >
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 transition-all',
            isSidebarCollapsed && 'justify-center'
          )}
          title="CodeGuard AI"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-foreground text-background shrink-0 font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight text-foreground whitespace-nowrap font-heading">
              <span>CodeGuard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono font-medium border border-border">AI</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className={cn(
            'rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer',
            isSidebarCollapsed
              ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted z-50'
              : 'p-1'
          )}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-6">
        <div>
          {!isSidebarCollapsed && (
            <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Platform
            </div>
          )}
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-[13px] font-medium transition-colors group relative',
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono border border-border">
                          {item.badge}
                        </span>
                      )}
                      {item.count && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
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
              <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                <span>Super Admin</span>
              </div>
            )}
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center rounded-lg text-[13px] font-medium transition-colors group relative',
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                      isActive
                        ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground')} />
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
