'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
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

interface CustomerAccount {
  id: string;
  name: string;
  domain: string;
  ownerEmail: string;
  tier: 'ENTERPRISE' | 'PRO' | 'STUDENT';
  mrr: number;
  seatsUsed: number;
  seatsTotal: number;
  monthlyReviews: number;
  quotaLimit: number;
  status: 'ACTIVE' | 'TRIAL' | 'DELINQUENT';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  joinedAt: string;
  apiKey: string;
}

const MOCK_CUSTOMERS: CustomerAccount[] = [
  {
    id: 'cust-901',
    name: 'Acme Payments Inc.',
    domain: 'acme.com',
    ownerEmail: 'finance-lead@acme.com',
    tier: 'ENTERPRISE',
    mrr: 49900,
    seatsUsed: 42,
    seatsTotal: 100,
    monthlyReviews: 1420,
    quotaLimit: 5000,
    status: 'ACTIVE',
    riskScore: 'LOW',
    joinedAt: '2025-11-12T10:00:00Z',
    apiKey: 'cg_live_99a8f21bc90a88e17823',
  },
  {
    id: 'cust-902',
    name: 'Stripe Fintech Labs',
    domain: 'fintech-labs.io',
    ownerEmail: 'alex@fintech-labs.io',
    tier: 'ENTERPRISE',
    mrr: 49900,
    seatsUsed: 88,
    seatsTotal: 100,
    monthlyReviews: 4890,
    quotaLimit: 5000,
    status: 'ACTIVE',
    riskScore: 'LOW',
    joinedAt: '2026-01-05T14:30:00Z',
    apiKey: 'cg_live_77182ba891230198a287',
  },
  {
    id: 'cust-903',
    name: 'Elena Rostova (Solo Engineer)',
    domain: 'elena.dev',
    ownerEmail: 'elena@codeguard.dev',
    tier: 'PRO',
    mrr: 2900,
    seatsUsed: 1,
    seatsTotal: 1,
    monthlyReviews: 184,
    quotaLimit: 500,
    status: 'ACTIVE',
    riskScore: 'LOW',
    joinedAt: '2026-02-14T08:15:00Z',
    apiKey: 'cg_live_11823901a88200192bc9',
  },
  {
    id: 'cust-904',
    name: 'Stanford CodeClub',
    domain: 'stanford.edu',
    ownerEmail: 'ari@stanford.edu',
    tier: 'STUDENT',
    mrr: 0,
    seatsUsed: 1,
    seatsTotal: 1,
    monthlyReviews: 42,
    quotaLimit: 100,
    status: 'ACTIVE',
    riskScore: 'LOW',
    joinedAt: '2026-03-01T12:00:00Z',
    apiKey: 'cg_live_student_882019a823',
  },
  {
    id: 'cust-905',
    name: 'CyberDefend Security',
    domain: 'cyberdefend.co',
    ownerEmail: 'ops@cyberdefend.co',
    tier: 'ENTERPRISE',
    mrr: 49900,
    seatsUsed: 12,
    seatsTotal: 25,
    monthlyReviews: 320,
    quotaLimit: 2500,
    status: 'DELINQUENT',
    riskScore: 'HIGH',
    joinedAt: '2025-10-20T16:45:00Z',
    apiKey: 'cg_live_99281a82300198bc72',
  },
];

export default function AdminCrmPage() {
  const { setPersonaRole } = useApp();
  const [customers, setCustomers] = useState<CustomerAccount[]>(MOCK_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = selectedTier === 'ALL' || c.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const totalARR = customers.reduce((acc, c) => acc + c.mrr * 12, 0);

  const handleRegenerateKey = (id: string) => {
    const newKey = `cg_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, apiKey: newKey } : c))
    );
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, apiKey: newKey } : null));
    }
    toast.success('Regenerated live API key');
  };

  const handleToggleStatus = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'ACTIVE' ? 'DELINQUENT' : 'ACTIVE';
          toast.success(`Account status changed to ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
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
            {customers.length} Accounts
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>100% SLA uptime</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Total Monthly AI Reviews</span>
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {customers.reduce((acc, c) => acc + c.monthlyReviews, 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <span>Gemini 3.7 Flash Pool</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">High-Risk Accounts</span>
            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">
            {customers.filter((c) => c.status === 'DELINQUENT').length} Delinquent
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Automated dunning active</span>
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
                <th className="py-2.5 px-4">Tier & MRR</th>
                <th className="py-2.5 px-4">Seats Allocated</th>
                <th className="py-2.5 px-4">Monthly Reviews</th>
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
                      {cust.domain} • {cust.ownerEmail}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={cust.tier === 'ENTERPRISE' ? 'primary' : cust.tier === 'PRO' ? 'secondary' : 'neutral'}
                        size="sm"
                      >
                        {cust.tier}
                      </Badge>
                      <span className="font-mono text-foreground font-medium">
                        {formatCurrency(cust.mrr)}/mo
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-foreground">
                      {cust.seatsUsed} / {cust.seatsTotal} seats
                    </div>
                    <Progress
                      value={(cust.seatsUsed / cust.seatsTotal) * 100}
                      size="sm"
                      className="w-24 mt-1"
                    />
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-foreground">
                      {cust.monthlyReviews} / {cust.quotaLimit}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round((cust.monthlyReviews / cust.quotaLimit) * 100)}% quota
                    </span>
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
                <p className="text-xs text-muted-foreground">{selectedCustomer.ownerEmail}</p>
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
                  <div className="text-sm font-bold text-foreground">{selectedCustomer.tier} PLAN</div>
                  <div className="text-xs text-muted-foreground">Billing: Monthly recurring</div>
                </div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(selectedCustomer.mrr)}/mo
                </div>
              </div>
            </Card>

            {/* Live API Key Management */}
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-warning" /> Live API Key
                </span>
                <button
                  onClick={() => handleRegenerateKey(selectedCustomer.id)}
                  className="text-[11px] font-mono text-primary hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <div className="p-2 rounded bg-black/40 border border-border font-mono text-xs text-zinc-300 break-all select-all">
                {selectedCustomer.apiKey}
              </div>
            </Card>

            {/* Quota & Seat Consumption */}
            <Card className="p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resource Utilization
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Seats Assigned</span>
                  <span>{selectedCustomer.seatsUsed} / {selectedCustomer.seatsTotal}</span>
                </div>
                <Progress value={(selectedCustomer.seatsUsed / selectedCustomer.seatsTotal) * 100} size="sm" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Monthly Reviews</span>
                  <span>{selectedCustomer.monthlyReviews} / {selectedCustomer.quotaLimit}</span>
                </div>
                <Progress value={(selectedCustomer.monthlyReviews / selectedCustomer.quotaLimit) * 100} size="sm" />
              </div>
            </Card>

            {/* Metadata Footer */}
            <div className="text-[11px] text-muted-foreground font-mono space-y-1 pt-2 border-t border-border/40">
              <div>Tenant Created: {formatDateTime(selectedCustomer.joinedAt)}</div>
              <div>Primary Domain: {selectedCustomer.domain}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
