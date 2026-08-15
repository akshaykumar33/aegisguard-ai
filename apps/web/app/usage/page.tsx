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
import { Zap, Activity } from 'lucide-react';
import { formatFeatureCode } from '@/lib/utils';
import { IconBadge } from '@/components/ui/IconBadge';

export default function UsagePage() {
  const { persona, setIsUpgradeModalOpen, setIsTicketModalOpen } = useApp();
  const usage = useResource(() => apiClient.customerOverview(), [persona.role]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <IconBadge color="slate" size="sm">
              <Zap />
            </IconBadge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Usage & Quota Consumption
            </h1>
          </div>
          <p className="text-[14px] text-muted-foreground leading-relaxed max-w-2xl">
            High-precision resource consumption meters for the active billing period with automated threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsTicketModalOpen(true)}>
            Request Limit Increase
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.usageMeters as Record<string, any>).map(([key, meter]) => (
              <Card key={key} className="p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground tracking-tight">{formatFeatureCode(key)}</h3>
                    <p className="text-xs text-muted-foreground">Tracked per monthly billing cycle</p>
                  </div>
                  <Badge
                    variant={meter.isExceeded ? 'danger' : meter.isWarning ? 'warning' : 'success'}
                    size="sm"
                    dot
                  >
                    {meter.isExceeded ? 'EXCEEDED' : meter.isWarning ? 'WARNING' : 'HEALTHY'}
                  </Badge>
                </div>

                <Progress value={meter.percentage} size="md" />

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground tabular">{meter.current}</span> / {meter.limit} consumed
                  </span>
                  <span className="font-semibold text-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border tabular">
                    {meter.percentage}% utilized
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Resource>
    </div>
  );
}
