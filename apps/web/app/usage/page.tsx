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
import { Zap } from 'lucide-react';
import { formatFeatureCode } from '@/lib/utils';
import { IconBadge } from '@/components/ui/IconBadge';

export default function UsagePage() {
  const { persona, setIsUpgradeModalOpen, setIsTicketModalOpen } = useApp();
  const usage = useResource(() => apiClient.customerOverview(), [persona.role]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <IconBadge color="slate" size="sm">
              <Zap />
            </IconBadge>
            <span>Usage & Quota Consumption</span>
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            High-precision resource consumption meters for active billing period with automated threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(data.usageMeters as Record<string, any>).map(([key, meter]) => (
              <Card key={key} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-semibold text-foreground">{formatFeatureCode(key)}</h3>
                    <p className="text-[12px] text-muted-foreground">Tracked per monthly billing cycle</p>
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

                <div className="flex items-center justify-between text-[12px] font-mono pt-1">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{meter.current}</span> / {meter.limit} consumed
                  </span>
                  <span className="font-medium text-foreground bg-muted px-2.5 py-1 rounded-md border border-border">{meter.percentage}% utilized</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Resource>
    </div>
  );
}
