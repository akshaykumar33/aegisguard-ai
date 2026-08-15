'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { MOCK_BENEFITS } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, CheckCircle2, Shield, Lock } from 'lucide-react';

export default function BenefitsPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-primary" />
            <span>Plan Benefits & Technical Capabilities</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Granular architectural and security capabilities enabled for your active subscription tier.
          </p>
        </div>

        <Button variant="glow" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
          Upgrade / Change Tier
        </Button>
      </div>

      {/* Grid of technical features & benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_BENEFITS.map((b) => (
          <Card key={b.id} hoverable className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="primary" size="sm">
                  {b.category}
                </Badge>
                <span className="text-[10px] font-mono text-text-muted">{b.minTier} Tier</span>
              </div>
              <h3 className="text-sm font-bold text-foreground font-heading">{b.name}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{b.description}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-success font-semibold pt-3 border-t border-border-subtle">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active & Enforced</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
