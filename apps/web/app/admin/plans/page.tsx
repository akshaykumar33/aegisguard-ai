'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminPlansPage() {
  const { persona } = useApp();
  const plans = useResource(() => apiClient.adminPlans(), [persona.role]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Dynamic Plan Builder & Catalog"
        description="Configure subscription tiers, price models, and feature entitlements dynamically without changing source code."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => toast.success('New plan tier created in draft')}
          >
            Create New Plan
          </Button>
        }
      />

      <Resource
        state={plans}
        loadingLabel="Loading plan catalog…"
        emptyWhen={(d) => !d.plans?.length}
        emptyTitle="No plans configured"
        emptyDescription="Create a plan to start offering subscriptions."
      >
        {(data) => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.plans.map((plan: any) => (
              <Card key={plan.id} hoverable className="p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.tier === 'ORGANIZATION' ? 'primary' : plan.tier === 'PRO' ? 'secondary' : 'neutral'} size="sm" dot>
                      {plan.tier}
                    </Badge>
                    <span className="text-[11px] text-success font-medium font-mono px-2.5 py-0.5 rounded-md bg-success/10 border border-success/20">PUBLISHED</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">{plan.name}</h3>
                  <div className="text-3xl font-bold text-foreground tracking-tight">
                    {plan.priceMonthly === 0 ? 'Free' : formatCurrency(plan.priceMonthly)}
                    <span className="text-sm text-muted-foreground font-normal"> / mo</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>

                <div className="pt-5 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<Settings className="w-3.5 h-3.5" />}
                    onClick={() => toast.info(`Editing entitlements for ${plan.name}`)}
                  >
                    Edit Entitlements
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Resource>
    </div>
  );
}
