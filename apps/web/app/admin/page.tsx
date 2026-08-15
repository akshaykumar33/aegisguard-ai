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
  Ban,
  CheckCircle2,
  X,
  UserCheck,
  Download,
  Plus,
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
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

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

  const handleToggleStatus = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    const suspending = customer.status === 'ACTIVE';
    try {
      if (suspending) {
        await apiClient.suspendCustomer(id, 'Suspended from admin console');
      } else {
        await apiClient.reactivateCustomer(id);
      }
      toast.success(`Account ${suspending ? 'suspended' : 'reactivated'}`);
      customersResource.reload();
      dashboard.reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not change the account status.';
      toast.error('Update failed', { description: message });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Customers & Tenants"
        description="Subscriptions, seat allocation, and account status across all tenants."
        actions={
          <>
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
          </>
        }
      />

      {/* 2. REVENUE & TENANT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Annual Revenue (ARR)</span>
            <IconBadge color="emerald" size="xs">
              <DollarSign />
            </IconBadge>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular">
            {formatCurrency(totalARR)}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 24.2% YoY growth</span>
          </div>
        </Card>

        <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Active Tenants</span>
            <IconBadge color="slate" size="xs">
              <Building2 />
            </IconBadge>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular">
            {kpis?.totalCustomers ?? customers.length} Accounts
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{kpis?.activeSubscribers ?? 0} active subscribers</span>
          </div>
        </Card>

        <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">Trial Subscribers</span>
            <IconBadge color="slate" size="xs">
              <Activity />
            </IconBadge>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular">
            {(kpis?.trialSubscribers ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground font-mono">
            <span>{kpis?.totalUsers ?? 0} users across {kpis?.totalOrganizations ?? 0} orgs</span>
          </div>
        </Card>

        <Card hoverable className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest font-mono">High-Risk Accounts</span>
            <IconBadge color="ruby" size="xs">
              <ShieldAlert />
            </IconBadge>
          </div>
          <div className="text-2xl font-bold tracking-tight text-destructive tabular">
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
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, domain, email, or tenant ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tenants"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border/60 hover:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 text-[13px] text-foreground outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border/60">
          {(['ALL', 'ENTERPRISE', 'PRO', 'STUDENT'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
                selectedTier === tier
                  ? 'bg-zinc-700/80 text-foreground border border-zinc-600 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-zinc-800/40'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CUSTOMERS DIRECTORY TABLE */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-[15px] font-semibold text-foreground">Tenant Directory</h2>
            <p className="text-[12px] text-muted-foreground">Detailed subscriber records with active entitlements.</p>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground">{filteredCustomers.length} Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Organization & Owner</th>
                <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Plan</th>
                <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Subscription</th>
                <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c: any) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="border-b border-border/20 hover:bg-card-hover/50 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {c.primaryUser?.email ?? c.email}
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-2">
                      <Badge
                        variant={
                          c.currentPlan?.tier === 'ORGANIZATION'
                            ? 'primary'
                            : c.currentPlan?.tier === 'PRO'
                              ? 'secondary'
                              : 'neutral'
                        }
                        size="sm"
                      >
                        {c.currentPlan?.tier ?? 'BASIC'}
                      </Badge>
                      <span className="hidden text-[12px] text-muted-foreground lg:inline">
                        {c.currentPlan?.name ?? 'Basic'}
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[12px] text-muted-foreground">{c.type ?? 'INDIVIDUAL'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[12px] text-muted-foreground">{c.subscriptionStatus ?? '—'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(c);
                      }}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. SLIDE-OVER CUSTOMER 360 DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedCustomer(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg bg-card border-l border-border/60 h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedCustomer.status === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
                    {selectedCustomer.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">{selectedCustomer.id}</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mt-1">{selectedCustomer.name}</h2>
                <p className="text-[13px] text-muted-foreground">
                  {selectedCustomer.primaryUser?.email ?? selectedCustomer.email}
                </p>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close drawer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => {
                  setPersonaRole('org');
                  toast.success(`Impersonating ${selectedCustomer.name}`);
                  setSelectedCustomer(null);
                }}
              >
                Impersonate Tenant
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={selectedCustomer.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                onClick={() => handleToggleStatus(selectedCustomer.id)}
              >
                {selectedCustomer.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
              </Button>
            </div>

            {/* Subscription & MRR Details */}
            <Card className="p-5 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Subscription Plan
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[14px] font-semibold text-foreground">
                    {selectedCustomer.currentPlan?.name ?? 'Basic'}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    Subscription: {selectedCustomer.subscriptionStatus ?? 'UNKNOWN'}
                  </div>
                </div>
                <Badge variant="secondary" size="sm">
                  {selectedCustomer.currentPlan?.tier ?? 'BASIC'}
                </Badge>
              </div>
            </Card>

            {/* Metadata Footer */}
            <div className="text-[12px] text-muted-foreground font-mono space-y-1 pt-3 border-t border-border/40">
              <div>Tenant Created: {formatDateTime(selectedCustomer.createdAt)}</div>
              <div>Account Type: {selectedCustomer.type ?? 'INDIVIDUAL'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
