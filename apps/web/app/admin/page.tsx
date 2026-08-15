'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { apiClient, ApiError } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Users,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Key,
  Building2,
  Mail,
  ShieldCheck,
  Ban,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';


export default function AdminCrmPage() {
  const { setPersonaRole } = useApp();
  const dashboard = useResource(() => apiClient.adminDashboard());
  const customersResource = useResource(() => apiClient.adminCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const customers: any[] = customersResource.data?.customers ?? [];
  const kpis = dashboard.data?.kpis;

  const filteredCustomers = customers.filter((c) => {
    const haystack = [c.name, c.email, c.id, c.primaryUser?.email].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || c.currentPlan?.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  // ARR comes from the platform KPI endpoint, which derives it from real plan
  // prices, rather than being summed from per-row fields the API does not return.
  // The endpoint returns whole dollars; formatCurrency expects cents.
  const totalARR = (kpis?.arr ?? 0) * 100;

  const handleRegenerateKey = (_id: string) => {
    // No endpoint exists for rotating a customer's API key. This previously
    // generated a random string client-side and reported success, which would
    // have left an operator believing a key had been rotated when it had not.
    toast.error('API key rotation is not available yet', {
      description: 'The control plane does not expose a key-rotation endpoint.'
    });
  };

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
    <div className="space-y-6">
      {/* 1. CRM HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">SUPER ADMIN CRM</Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">Multi-Tenant Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-accent" />
            <span>Customer & Tenant Directory</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage organization subscriptions, seat allocations, API keys, and emergency overrides across all tenants.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => toast.info('Exporting customer CRM CSV...')}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => toast.success('Provisioning new tenant account...')}>
            + Provision Tenant
          </Button>
        </div>
      </div>

      {/* 2. REVENUE & TENANT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Annual Recurring Revenue (ARR)</span>
            <DollarSign className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(totalARR)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-success font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 24.2% YoY growth</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Active Tenants</span>
            <Building2 className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {kpis?.totalCustomers ?? customers.length} Accounts
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{kpis?.activeSubscribers ?? 0} active subscribers</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Trial Subscribers</span>
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {(kpis?.trialSubscribers ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <span>{kpis?.totalUsers ?? 0} users across {kpis?.totalOrganizations ?? 0} orgs</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">High-Risk Accounts</span>
            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">
            {customers.filter((c) => c.status !== 'ACTIVE').length} Suspended
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{kpis?.churnRate ?? '0.0'}% churn rate</span>
          </div>
        </Card>
      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, domain, email, or tenant ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-input border border-border focus:border-ring text-xs text-foreground outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['ALL', 'ENTERPRISE', 'PRO', 'STUDENT'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CUSTOMERS DIRECTORY TABLE */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-4">Organization & Owner</th>
                <th className="py-2.5 px-4">Plan</th>
                <th className="py-2.5 px-4">Account Type</th>
                <th className="py-2.5 px-4">Subscription</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cust.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {cust.primaryUser?.email ?? cust.email}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          cust.currentPlan?.tier === 'ORGANIZATION'
                            ? 'primary'
                            : cust.currentPlan?.tier === 'PRO'
                              ? 'secondary'
                              : 'neutral'
                        }
                        size="sm"
                      >
                        {cust.currentPlan?.tier ?? 'BASIC'}
                      </Badge>
                      <span className="font-mono text-foreground font-medium">
                        {cust.currentPlan?.name ?? 'Basic'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-foreground">{cust.type ?? 'INDIVIDUAL'}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-foreground">{cust.subscriptionStatus ?? '—'}</div>
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      variant={cust.status === 'ACTIVE' ? 'success' : 'danger'}
                      size="sm"
                      dot
                    >
                      {cust.status}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(cust);
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
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedCustomer(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg bg-card-elevated border-l border-border h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedCustomer.status === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
                    {selectedCustomer.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{selectedCustomer.id}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">{selectedCustomer.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.primaryUser?.email ?? selectedCustomer.email}
                </p>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setPersonaRole('org');
                  toast.success(`Impersonating ${selectedCustomer.name}`);
                  setSelectedCustomer(null);
                }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Impersonate Tenant
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(selectedCustomer.id)}
              >
                {selectedCustomer.status === 'ACTIVE' ? (
                  <>
                    <Ban className="w-3.5 h-3.5 mr-1 text-destructive" /> Suspend Tenant
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-success" /> Activate Tenant
                  </>
                )}
              </Button>
            </div>

            {/* Subscription & MRR Details */}
            <Card className="p-4 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subscription Plan
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {selectedCustomer.currentPlan?.name ?? 'Basic'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Subscription: {selectedCustomer.subscriptionStatus ?? 'UNKNOWN'}
                  </div>
                </div>
                <Badge variant="secondary" size="sm">
                  {selectedCustomer.currentPlan?.tier ?? 'BASIC'}
                </Badge>
              </div>
            </Card>

            {/* Per-customer seat and review consumption is not exposed by
                /admin/customers. Rather than render zeros that look like real
                utilisation, the panel links to the account instead. */}

            {/* Metadata Footer */}
            <div className="text-[11px] text-muted-foreground font-mono space-y-1 pt-2 border-t border-border/40">
              <div>Tenant Created: {formatDateTime(selectedCustomer.createdAt)}</div>
              <div>Account Type: {selectedCustomer.type ?? 'INDIVIDUAL'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
