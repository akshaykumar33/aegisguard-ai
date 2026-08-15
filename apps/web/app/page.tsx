'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { api, MOCK_METERS } from '@/lib/api';
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
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function DashboardPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await api.getStats();
      setStats(data);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. HERO SUBSCRIPTION & STATUS BANNER */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm" dot>
                {persona.planName.toUpperCase()} ACTIVE
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-mono">AST & Secret Protection 100%</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {persona.name.split(' ')[0]}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CodeGuard AI reviewer is active across your repositories. Continuous zero-trust AST scanning, secret prevention, and Google Gemini 3.7 PR verification are currently running.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {persona.role === 'student' ? 'Free' : persona.role === 'org' ? '$499' : '$29'}
              <span className="text-xs font-normal text-muted-foreground"> / mo</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Upgrade Plan
              </Button>
              <Link href="/billing">
                <Button variant="outline" size="sm">
                  Manage Billing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS & KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Monthly PRs</span>
            <Rocket className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {stats?.counts.pullRequests || 412}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-success font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 18.4% vs last period</span>
          </div>
        </Card>

        <Card hoverable className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">AI Verifications</span>
            <Bot className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {stats?.counts.reviews || 1248}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <span>Gemini 3.7 Flash Active</span>
          </div>
        </Card>

        <Card hoverable className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Secrets Leaked</span>
            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-success">
            0 Leaks
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-success font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Zero-Trust</span>
          </div>
        </Card>

        <Card hoverable className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Repositories</span>
            <Package className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {stats?.counts.repositories || 86}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Git Sync Operational</span>
          </div>
        </Card>
      </div>

      {/* 3. RESOURCE CONSUMPTION METERS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Resource Quotas & Consumption
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time resource utilization across your billing cycle.
            </p>
          </div>
          <Link href="/usage">
            <Button variant="ghost" size="xs">
              View Breakdown <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(MOCK_METERS).slice(0, 3).map(([key, meter]) => (
            <Card key={key} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{meter.name}</span>
                <Badge
                  variant={meter.isExceeded ? 'danger' : meter.isWarning ? 'warning' : 'success'}
                  size="sm"
                >
                  {meter.isExceeded ? 'EXCEEDED' : meter.isWarning ? 'WARNING' : 'HEALTHY'}
                </Badge>
              </div>

              <Progress value={meter.percentage} size="sm" />

              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>
                  {meter.current} / {meter.limit} used
                </span>
                <span className="font-medium text-foreground">{meter.percentage}%</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. REVIEWS & FINDINGS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Reviews */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent PR Reviews</h3>
            </div>
            <Link href="/reviews">
              <Button variant="ghost" size="xs">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.recentReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground hover:text-primary cursor-pointer">
                      {rev.pullRequestTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {rev.repositoryName} • PR #{rev.prNumber}
                    </div>
                  </div>
                  <Badge variant={rev.verdict === 'APPROVED' ? 'success' : 'danger'} size="sm">
                    {rev.verdict}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {rev.summary}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                  <span>Execution: {rev.executionTimeMs}ms</span>
                  <span>{formatDateTime(rev.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Findings */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Security & AST Findings</h3>
            </div>
            <Link href="/reviews">
              <Button variant="ghost" size="xs">
                Inspect <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.recentFindings.map((fnd) => (
              <div
                key={fnd.id}
                className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={fnd.severity === 'CRITICAL' ? 'danger' : fnd.severity === 'HIGH' ? 'warning' : 'secondary'} size="sm">
                      {fnd.severity}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground truncate">{fnd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                    {fnd.tool}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {fnd.description}
                </p>

                {fnd.file && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-card p-1.5 rounded border border-border/60 truncate">
                    <Code2 className="w-3 h-3 text-primary shrink-0" />
                    <span>{fnd.file}:{fnd.lineStart}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
