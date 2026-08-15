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
import { Download, CreditCard, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function BillingPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();
  const billing = useResource(() => apiClient.customerBilling(), [persona.role]);

  const handleDownloadReceipt = (invNumber: string) => {
    toast.success(`Receipt ${invNumber} PDF downloaded`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Billing & Invoices"
        description="Manage payment methods, download PDF invoices, and review subscription ledger."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
            Change Plan
          </Button>
        }
      />

      {/* Payment method & subscription summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-7 space-y-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Active Payment Method</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-[11px] font-bold tracking-widest text-foreground border border-border shadow-xs">
                VISA
              </div>
              <div className="space-y-1">
                <div className="text-[14px] font-medium text-foreground">Visa ending in 4242</div>
                <div className="text-[12px] text-muted-foreground font-mono">Expires 12/2028 • Default Method</div>
              </div>
            </div>
            <Button variant="outline" size="xs" onClick={() => toast.info('Card update dialog opened')}>
              Edit
            </Button>
          </div>
        </Card>

        <Card className="p-7 space-y-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Receipt className="w-3.5 h-3.5" />
            <span>Subscription Tier</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1.5">
              <div className="text-2xl font-bold text-foreground tracking-tight">{persona.planName}</div>
              <div className="text-[13px] text-muted-foreground">Renews automatically on Sep 1, 2026</div>
            </div>
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          </div>
          <div className="pt-2">
            <Button variant="ghost" size="xs" className="text-primary hover:text-primary" onClick={() => setIsUpgradeModalOpen(true)}>
              Upgrade or switch billing cycle →
            </Button>
          </div>
        </Card>
      </div>

      {/* Invoice Ledger Table */}
      <Card className="p-7 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[16px] font-semibold text-foreground">Invoice History</h2>
            <p className="text-[13px] text-muted-foreground">Download receipts for tax and accounting compliance.</p>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground">
            {billing.data?.invoices?.length ?? 0} Invoices
          </span>
        </div>

        <Resource
          state={billing}
          loadingLabel="Loading invoices…"
          emptyWhen={(d) => !d.invoices?.length}
          emptyTitle="No invoices yet"
          emptyDescription="Invoices appear here once your first billing period closes."
        >
          {(data) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Invoice</th>
                    <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Date</th>
                    <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Description</th>
                    <th className="text-right py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="text-left py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="text-right py-3.5 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border/20 hover:bg-card-hover/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-medium text-foreground text-[12px]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-[12px]">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-foreground">
                        {inv.description}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-medium text-foreground text-[12px]">
                        {formatCurrency(inv.amountDue)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="success" size="sm">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Download className="h-3 w-3" />}
                          onClick={() => handleDownloadReceipt(inv.invoiceNumber)}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Resource>
      </Card>
    </div>
  );
}
