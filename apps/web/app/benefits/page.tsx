'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { IconBadge } from '@/components/ui/IconBadge';

export default function BenefitsPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();
  const overview = useResource(() => apiClient.customerOverview(), [persona.role]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <IconBadge color="primary" size="sm">
              <Sparkles />
            </IconBadge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Plan Benefits & Capabilities
            </h1>
          </div>
          <p className="text-[14px] text-muted-foreground leading-relaxed max-w-2xl">
            Granular architectural and security capabilities enabled for your active subscription tier.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
          Upgrade / Change Tier
        </Button>
      </div>

      {/* Grid of technical features & benefits */}
      <Resource
        state={overview}
        loadingLabel="Loading plan benefits…"
        emptyWhen={(d) => !d.entitlements?.benefits?.length}
        emptyTitle="No benefits listed"
        emptyDescription="Your plan has no benefits configured yet."
      >
        {(data) => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.entitlements.benefits.map((b: any) => (
              <Card key={b.id} hoverable className="p-7 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary" size="sm" dot>
                      {data.entitlements.planTier}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight leading-snug">{b.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{b.description}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-success font-medium pt-4 border-t border-border/50">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active & Enforced</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Resource>
    </div>
  );
}
