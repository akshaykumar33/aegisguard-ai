'use client';

import React from 'react';
import { MOCK_PLANS } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Layers, Plus, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminPlansPage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-accent" />
            <span>Dynamic Plan Builder & Catalog</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure subscription tiers, price models, and feature entitlements dynamically without changing source code.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => toast.success('New plan tier created in draft')}
        >
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_PLANS.map((plan) => (
          <Card key={plan.id} className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" size="sm">
                  {plan.tier}
                </Badge>
                <span className="text-xs text-success font-bold font-mono">PUBLISHED</span>
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">{plan.name}</h3>
              <div className="text-2xl font-extrabold text-foreground font-heading">
                {plan.priceMonthly === 0 ? 'Free' : formatCurrency(plan.priceMonthly)}
                <span className="text-xs text-text-muted font-normal"> / mo</span>
              </div>
              <p className="text-xs text-text-secondary">{plan.description}</p>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => toast.info(`Editing entitlements for ${plan.name}`)}
              >
                Edit Entitlements
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
