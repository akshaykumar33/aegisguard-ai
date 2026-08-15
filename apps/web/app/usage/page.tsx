'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Zap, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { formatFeatureCode } from '@/lib/utils';

export default function UsagePage() {
  const { setIsUpgradeModalOpen, setIsTicketModalOpen } = useApp();
  // Overview carries the derived meter shape (current/limit/percentage/flags);
  // /customer/usage returns raw records that would need the same maths again.
  const usage = useResource(() => apiClient.customerOverview());

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-primary" />
            <span>Usage & Quota Consumption Breakdown</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            High-precision resource consumption meters for active billing period with automated threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsTicketModalOpen(true)}>
            Request Limit Increase
          </Button>
          <Button variant="glow" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
            Upgrade Limits
          </Button>
        </div>
      </div>

      {/* Quota meters grid */}
      <Resource
        state={usage}
        loadingLabel="Loading quota meters…"
        emptyWhen={(d) => !d.usageMeters || Object.keys(d.usageMeters).length === 0}
        emptyTitle="No usage recorded yet"
        emptyDescription="Meters appear once reviews start consuming your plan quota."
      >
        {(data) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data.usageMeters as Record<string, any>).map(([key, meter]) => (
          <Card key={key} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground font-heading">{formatFeatureCode(key)}</h3>
                <p className="text-xs text-text-secondary">Tracked per monthly billing cycle</p>
              </div>
              <Badge
                variant={meter.isExceeded ? 'danger' : meter.isWarning ? 'warning' : 'success'}
                size="sm"
              >
                {meter.isExceeded ? 'EXCEEDED' : meter.isWarning ? 'WARNING' : 'HEALTHY'}
              </Badge>
            </div>

            <Progress value={meter.percentage} size="lg" />

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">
                {meter.current} / {meter.limit} consumed
              </span>
              <span className="font-bold text-foreground">{meter.percentage}% utilized</span>
            </div>
          </Card>
        ))}
      </div>
        )}
      </Resource>
    </div>
  );
}
