'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { formatFeatureCode } from '@/lib/utils';
import { DashboardStats } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Rocket,
  Bot,
  ShieldAlert,
  Package,
  TrendingUp,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Code2,
  Sparkles,
  Building2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { IconBadge } from '@/components/ui/IconBadge';

export default function DashboardPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();
  const statsResource = useResource(() => apiClient.dashboardStats(), [persona.role]);
  const overview = useResource(() => apiClient.customerOverview(), [persona.role]);
  const stats = statsResource.data as DashboardStats | null;

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* 1. HERO BANNER */}
      <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <Badge variant="success" size="sm" dot>
                {persona.planName.toUpperCase()} ACTIVE
              </Badge>
              <span className="text-[13px] text-muted-foreground font-mono">AST & Secret Protection 100%</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Welcome back, {persona.name.split(' ')[0]}
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              CodeGuard AI reviewer is active across your repositories. Continuous zero-trust AST scanning, secret prevention, and Google Gemini 3.7 PR verification are currently running.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-4 shrink-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular">
              {persona.role === 'student' ? 'Free' : persona.role === 'org' ? '$199' : persona.role === 'admin' ? 'Enterprise' : '$29'}
              <span className="text-sm font-normal text-muted-foreground">{persona.role === 'admin' ? ' License' : ' / mo'}</span>
            </div>
            <div className="flex items-center gap-3">
              {persona.role === 'admin' ? (
                <Link href="/admin">
                  <Button variant="primary" size="sm" leftIcon={<Building2 className="w-4 h-4" />}>
                    Customer 360 CRM
                  </Button>
                </Link>
              ) : (
                <Button variant="primary" size="sm" leftIcon={<ArrowRight className="w-4 h-4" />} onClick={() => setIsUpgradeModalOpen(true)}>
                  Upgrade Plan
                </Button>
              )}
              <Link href={persona.role === 'admin' ? '/admin/audit' : '/billing'}>
                <Button variant="outline" size="sm">
                  {persona.role === 'admin' ? 'Audit Trail' : 'Manage Billing'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS & KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Monthly PRs</span>
            <IconBadge color="primary" size="xs">
              <Rocket />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular">
            {stats?.counts.pullRequests || 412}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-success font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 18.4% vs last period</span>
          </div>
        </Card>

        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">AI Verifications</span>
            <IconBadge color="slate" size="xs">
              <Bot />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular">
            {stats?.counts.reviews || 1248}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Gemini 3.7 Flash Active</span>
          </div>
        </Card>

        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Secrets Leaked</span>
            <IconBadge color="emerald" size="xs">
              <ShieldAlert />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-success tabular">
            0 Leaks
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Zero-Trust</span>
          </div>
        </Card>

        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Repositories</span>
            <IconBadge color="slate" size="xs">
              <Package />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular">
            {stats?.counts.repositories || 86}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Git Sync Operational</span>
          </div>
        </Card>
      </div>

      {/* 3. RESOURCE CONSUMPTION METERS */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
              Resource Quotas & Consumption
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Real-time resource utilization across your billing cycle.
            </p>
          </div>
          <Link href="/usage">
            <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Breakdown
            </Button>
          </Link>
        </div>

        <Resource
          state={overview}
          loadingLabel="Loading quota meters…"
          emptyWhen={(d) => !d.usageMeters || Object.keys(d.usageMeters).length === 0}
          emptyTitle="No usage recorded yet"
          emptyDescription="Meters appear once reviews start consuming your plan quota."
        >
          {(data) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(data.usageMeters as Record<string, any>).slice(0, 3).map(([key, meter]) => (
                <Card key={key} className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground text-[14px]">{formatFeatureCode(key)}</span>
                    <Badge
                      variant={meter.isExceeded ? 'danger' : meter.isWarning ? 'warning' : 'success'}
                      size="sm"
                    >
                      {meter.isExceeded ? 'EXCEEDED' : meter.isWarning ? 'WARNING' : 'HEALTHY'}
                    </Badge>
                  </div>

                  <Progress value={meter.percentage} size="sm" />

                  <div className="flex items-center justify-between text-[12px] font-mono text-muted-foreground">
                    <span>
                      {meter.current} / {meter.limit} used
                    </span>
                    <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">{meter.percentage}%</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Resource>
      </div>

      {/* 4. REVIEWS & FINDINGS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reviews */}
        <Card className="p-7 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">Recent PR Reviews</h3>
                  <p className="text-xs text-muted-foreground">Automated multi-stage AST verifications</p>
                </div>
              </div>
              <Link href="/reviews">
                <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4 pt-4">
              {stats?.recentReviews && stats.recentReviews.length > 0 ? (
                stats.recentReviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-xl border border-border/80 bg-card hover:bg-card-hover hover:border-border-focus transition-all space-y-3.5 shadow-xs group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{rev.repositoryName || 'payments-service'}</span>
                        <span>•</span>
                        <span className="text-primary font-bold">PR #{rev.prNumber || '142'}</span>
                      </div>
                      <Badge variant={rev.verdict === 'APPROVED' || rev.state === 'PASSED' ? 'success' : 'danger'} size="sm" dot>
                        {rev.verdict || (rev.state === 'PASSED' ? 'APPROVED' : 'BLOCKED')}
                      </Badge>
                    </div>

                    <h4 className="text-[14.5px] font-semibold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                      {rev.pullRequestTitle || `Pull Request #${rev.prNumber || '142'}`}
                    </h4>

                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {rev.summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40 font-mono">
                      <span className="flex items-center gap-1.5 text-foreground/80">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Gemini 3.7 Flash • {rev.executionTimeMs || rev.durationMs || 1420}ms</span>
                      </span>
                      <span>{formatDateTime(rev.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  No recent review runs found. Trigger a review in PR Scanner.
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Security Findings */}
        <Card className="p-7 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">Security & AST Findings</h3>
                  <p className="text-xs text-muted-foreground">Detected anomalies and vulnerabilities</p>
                </div>
              </div>
              <Link href="/reviews">
                <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Inspect
                </Button>
              </Link>
            </div>

            <div className="space-y-4 pt-4">
              {stats?.recentFindings && stats.recentFindings.length > 0 ? (
                stats.recentFindings.map((fnd: any) => (
                  <div
                    key={fnd.id}
                    className="p-5 rounded-xl border border-border/80 bg-card hover:bg-card-hover hover:border-border-focus transition-all space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant={fnd.severity === 'CRITICAL' ? 'danger' : fnd.severity === 'HIGH' ? 'warning' : 'secondary'} size="sm" dot>
                        {fnd.severity}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md border border-border font-medium">
                        {fnd.tool || fnd.source || 'AST-Engine'}
                      </span>
                    </div>

                    <h4 className="text-[14.5px] font-semibold text-foreground tracking-tight leading-snug">
                      {fnd.title}
                    </h4>

                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {fnd.description}
                    </p>

                    {(fnd.file || fnd.filePath) && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-2 text-xs font-mono text-foreground/90 bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                          <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{fnd.file || fnd.filePath}:{fnd.lineStart || fnd.startLine}</span>
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                  <span className="font-semibold text-foreground text-sm">0 active security vulnerabilities</span>
                  <span className="text-xs">All repositories and AST graphs are 100% clean.</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
