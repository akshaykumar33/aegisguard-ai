'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/lib/store';
import { apiClient, ApiError } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { LoadingState, ErrorState } from '@/components/ui/ResourceStates';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export function UpgradeModal() {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, persona } = useApp();
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('pro');
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [isLoading, setIsLoading] = useState(false);

  // Only fetch the catalogue while the modal is open.
  const subscription = useResource(
    () => (isUpgradeModalOpen ? apiClient.customerSubscription() : Promise.resolve(null as any)),
    [isUpgradeModalOpen]
  );

  const availablePlans: any[] = subscription.data?.availablePlans ?? [];

  const handleUpgrade = async () => {
    const plan = availablePlans.find((p) => p.slug === selectedPlanSlug);
    if (!plan) {
      toast.error('Select a plan to continue.');
      return;
    }

    setIsLoading(true);
    try {
      // Real plan change: this used to be a setTimeout that reported success
      // without contacting the API at all.
      await apiClient.changeSubscription(plan.id, billingInterval === 'ANNUAL' ? 'YEARLY' : 'MONTHLY');
      setIsUpgradeModalOpen(false);
      toast.success(`Subscription changed to ${plan.name}`, {
        description: 'Your new entitlements and quota limits are active immediately.',
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not change your subscription.';
      toast.error('Upgrade failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isUpgradeModalOpen}
      onClose={() => setIsUpgradeModalOpen(false)}
      title="Choose Your CodeGuard AI Subscription"
      description="Scale your engineering security and zero-trust code review with flexible monthly or annual billing."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Interval toggle */}
        <div className="flex justify-center">
          <div className="flex items-center bg-card p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setBillingInterval('MONTHLY')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                billingInterval === 'MONTHLY' ? 'bg-zinc-800 text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval('ANNUAL')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                billingInterval === 'ANNUAL' ? 'bg-zinc-800 text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 font-medium">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        {subscription.loading && <LoadingState label="Loading plans…" />}
        {subscription.error && <ErrorState error={subscription.error} onRetry={subscription.reload} />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((plan: any) => {
            const isSelected = selectedPlanSlug === plan.slug;
            const price = billingInterval === 'ANNUAL' ? plan.priceMonthly * 0.8 : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanSlug(plan.slug)}
                className={cn(
                  'rounded-xl border p-5 transition-colors cursor-pointer flex flex-col justify-between relative shadow-xs',
                  isSelected
                    ? 'border-foreground/80 bg-zinc-900/60'
                    : 'border-border bg-card hover:bg-card-hover hover:border-zinc-700'
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-2.5 right-3">
                    <Badge variant="primary" size="sm">
                      <Sparkles className="w-3 h-3 mr-1" /> Most Popular
                    </Badge>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-foreground font-heading">{plan.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{plan.description}</p>

                  <div className="my-4">
                    <div className="text-2xl font-bold text-foreground font-heading">
                      {price === 0 ? 'Free' : formatCurrency(price)}
                      {price > 0 && <span className="text-xs font-normal text-muted-foreground"> / mo</span>}
                    </div>
                  </div>

                  <ul className="space-y-2 border-t border-border pt-4">
                    {(plan.features ?? [])
                      .filter((f: any) => f.isEnabled)
                      .map((f: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          {f.feature?.name ?? f.feature?.code}
                          {typeof f.value === 'number' && f.value > 0 ? `: ${f.value.toLocaleString()}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <Button
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanSlug(plan.slug);
                      handleUpgrade();
                    }}
                  >
                    {isSelected ? 'Confirm Selection' : 'Select Tier'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Current Tier: <strong className="text-foreground">{persona.planName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleUpgrade}>
              Confirm Upgrade
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
