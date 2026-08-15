'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/lib/store';
import { MOCK_PLANS } from '@/lib/api';
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

  const handleUpgrade = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsUpgradeModalOpen(false);
      const plan = MOCK_PLANS.find((p) => p.slug === selectedPlanSlug);
      toast.success(`Successfully upgraded account to ${plan?.name}!`, {
        description: `Your new entitlements and quota limits are active immediately.`,
      });
    }, 900);
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
          <div className="flex items-center bg-input p-1 rounded-full border border-border-subtle">
            <button
              onClick={() => setBillingInterval('MONTHLY')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                billingInterval === 'MONTHLY' ? 'bg-primary text-white shadow-subtle' : 'text-text-secondary'
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval('ANNUAL')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5',
                billingInterval === 'ANNUAL' ? 'bg-primary text-white shadow-subtle' : 'text-text-secondary'
              )}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-success text-white">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_PLANS.map((plan) => {
            const isSelected = selectedPlanSlug === plan.slug;
            const price = billingInterval === 'ANNUAL' ? plan.priceMonthly * 0.8 : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanSlug(plan.slug)}
                className={cn(
                  'rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between relative',
                  isSelected
                    ? 'border-primary bg-primary-light/20 shadow-glow ring-2 ring-primary/40'
                    : 'border-border-subtle bg-card hover:bg-card-hover hover:border-border'
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-2.5 right-4">
                    <Badge variant="primary" size="sm">
                      <Sparkles className="w-3 h-3 mr-1" /> Most Popular
                    </Badge>
                  </div>
                )}

                <div>
                  <h4 className="text-base font-bold text-foreground font-heading">{plan.name}</h4>
                  <p className="mt-1 text-xs text-text-secondary line-clamp-2">{plan.description}</p>

                  <div className="my-4">
                    <div className="text-2xl font-extrabold text-foreground font-heading">
                      {price === 0 ? 'Free' : formatCurrency(price)}
                      {price > 0 && <span className="text-xs font-normal text-text-muted"> / mo</span>}
                    </div>
                  </div>

                  <ul className="space-y-2 border-t border-border-subtle pt-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
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
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="text-xs text-text-muted">
            Current Tier: <strong className="text-foreground">{persona.planName}</strong>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" size="sm" isLoading={isLoading} onClick={handleUpgrade}>
              Confirm Upgrade
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
