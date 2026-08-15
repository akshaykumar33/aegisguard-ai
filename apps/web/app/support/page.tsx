'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LifeBuoy, Plus, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SupportPage() {
  const { setIsTicketModalOpen } = useApp();
  const ticketsResource = useResource(() => apiClient.supportTickets());

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-primary" />
            <span>Customer Support & Security Helpdesk</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Direct priority channel to CodeGuard security architects and platform engineering.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsTicketModalOpen(true)}
        >
          Open New Ticket
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <Resource
          state={ticketsResource}
          loadingLabel="Loading tickets…"
          emptyWhen={(d) => !d.tickets?.length}
          emptyTitle="No support tickets"
          emptyDescription="Open a ticket and it will appear here with its status and priority."
        >
          {(data) => (
            <>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground font-heading">Your Support Tickets</h3>
          <span className="text-xs text-text-muted">{data.tickets.length} Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.tickets.map((t: any) => (
                <tr key={t.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">{t.id}</td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{t.subject}</td>
                  <td className="py-3.5 px-4 text-text-secondary">{t.category}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={t.priority === 'HIGH' ? 'warning' : 'secondary'} size="sm">
                      {t.priority}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={t.status === 'RESOLVED' ? 'success' : 'primary'} size="sm">
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-text-muted text-right">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            </>
          )}
        </Resource>
      </Card>
    </div>
  );
}
