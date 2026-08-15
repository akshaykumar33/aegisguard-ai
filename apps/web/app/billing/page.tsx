'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { MOCK_INVOICES } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Download, CheckCircle2, Shield } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function BillingPage() {
  const { persona, setIsUpgradeModalOpen } = useApp();

  const handleDownloadReceipt = (invNumber: string) => {
    toast.success(`Receipt ${invNumber} PDF downloaded!`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-primary" />
            <span>Billing Ledger & Invoices</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your payment methods, download official VAT receipts, and adjust subscription renewal settings.
          </p>
        </div>

        <Button variant="glow" size="sm" onClick={() => setIsUpgradeModalOpen(true)}>
          Change Plan Tier
        </Button>
      </div>

      {/* Payment method summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Active Payment Method
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-card-elevated border border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white tracking-widest">
                VISA
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Visa ending in 4242</div>
                <div className="text-[10px] text-text-muted">Expires 12/2028 • Default</div>
              </div>
            </div>
            <Button variant="outline" size="xs" onClick={() => toast.info('Card update modal opened')}>
              Edit
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Subscription Summary
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-foreground font-heading">{persona.planName}</div>
              <div className="text-xs text-text-secondary">Renews automatically on Sep 1, 2026</div>
            </div>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          </div>
        </Card>
      </div>

      {/* Invoice Ledger Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground font-heading">Invoice History</h3>
          <span className="text-xs text-text-muted font-mono">{MOCK_INVOICES.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4 text-text-secondary">{formatDate(inv.createdAt)}</td>
                  <td className="py-3.5 px-4 text-foreground font-medium">{inv.description}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{formatCurrency(inv.amountDue)}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success" size="sm">
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Download className="w-3 h-3" />}
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
      </Card>
    </div>
  );
}
