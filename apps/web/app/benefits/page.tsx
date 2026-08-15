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

export default function BenefitsPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();
  const overview = useResource(() => apiClient.customerOverview(), [persona.role]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-foreground" />
            <span>Plan Benefits & Capabilities</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.entitlements.benefits.map((b: any) => (
          <Card key={b.id} hoverable className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="primary" size="sm">
                  {data.entitlements.planTier}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-3 border-t border-border">
              <CheckCircle2 className="w-3.5 h-3.5" />
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
