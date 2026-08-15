'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { apiClient, ApiError } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  DollarSign,
  TrendingUp,
  Activity,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Download,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { IconBadge } from '@/components/ui/IconBadge';

export default function AdminCrmPage() {
  const { persona, setPersonaRole } = useApp();
  const dashboard = useResource(() => apiClient.adminDashboard(), [persona.role]);
  const customersResource = useResource(() => apiClient.adminCustomers(), [persona.role]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const customers: any[] = customersResource.data?.customers ?? [];
  const kpis = dashboard.data?.kpis;

  const filteredCustomers = customers.filter((c) => {
    const haystack = [c.name, c.email, c.id, c.primaryUser?.email].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesTier =
      selectedTier === 'ALL' ||
      c.currentPlan?.tier === selectedTier ||
      (selectedTier === 'ENTERPRISE' && c.currentPlan?.tier === 'ORGANIZATION') ||
      (selectedTier === 'STUDENT' && (c.currentPlan?.tier === 'BASIC' || c.currentPlan?.tier === 'FREE' || c.currentPlan?.tier === 'STUDENT'));
    return matchesSearch && matchesTier;
  });

  const totalARR = (kpis?.arr ?? 0) * 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Customers & Tenants"
        description="Subscriptions, seat allocation, and account status across all platform tenants."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => toast.info('Exporting customer CSV…')}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => toast.success('Provisioning new tenant…')}
            >
              Provision Tenant
            </Button>
          </div>
        }
      />

      {/* 2. REVENUE & TENANT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Annual Revenue (ARR)</span>
            <IconBadge color="emerald" size="xs">
              <DollarSign />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular">
            {formatCurrency(totalARR)}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-success font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 24.2% YoY growth</span>
          </div>
        </Card>

        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Active Tenants</span>
            <IconBadge color="slate" size="xs">
              <Building2 />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular">
            {kpis?.totalCustomers ?? customers.length} Accounts
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{kpis?.activeSubscribers ?? 0} active subscribers</span>
          </div>
        </Card>

        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Trial Subscribers</span>
            <IconBadge color="slate" size="xs">
              <Activity />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground tabular">
            {(kpis?.trialSubscribers ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground font-mono">
            <span>{kpis?.totalUsers ?? 0} users across {kpis?.totalOrganizations ?? 0} orgs</span>
          </div>
        </Card>

        <Card hoverable className="p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">High-Risk Accounts</span>
            <IconBadge color="ruby" size="xs">
              <ShieldAlert />
            </IconBadge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-destructive tabular">
            {customers.filter((c) => c.status !== 'ACTIVE').length} Suspended
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground font-mono">
            <span>{kpis?.churnRate ?? '0.0'}% churn rate</span>
          </div>
        </Card>
      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, domain, email, or tenant ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tenants"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border hover:border-border-focus focus:border-border-focus focus:ring-1 focus:ring-ring/30 text-[13px] text-foreground outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
          {(['ALL', 'ENTERPRISE', 'PRO', 'STUDENT'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                selectedTier === tier
                  ? 'bg-secondary text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CUSTOMERS DIRECTORY TABLE */}
      <Card className="p-7 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[16px] font-semibold text-foreground">Tenant Directory</h2>
            <p className="text-[13px] text-muted-foreground">Detailed subscriber records with active entitlements.</p>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground">{filteredCustomers.length} Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Organization & Owner</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Plan</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Type</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Subscription</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="text-right py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c: any) => (
                <tr key={c.id} className="border-b border-border/20 hover:bg-card-hover/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground text-[14px]">{c.name}</div>
                      <div className="text-[12px] text-muted-foreground font-mono">{c.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={c.currentPlan?.tier === 'ORGANIZATION' ? 'primary' : c.currentPlan?.tier === 'PRO' ? 'secondary' : 'neutral'} size="sm">
                      {c.currentPlan?.name ?? 'Free Tier'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground text-[12px]">
                    {c.type}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={c.subscription?.status === 'ACTIVE' ? 'success' : 'warning'} size="sm" dot>
                      {c.subscription?.status ?? 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-[12px] font-medium text-foreground">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button variant="outline" size="xs" onClick={() => toast.info(`Viewing tenant details for ${c.name}`)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
