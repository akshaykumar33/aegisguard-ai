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
import { Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SupportPage() {
  const { persona, setIsTicketModalOpen } = useApp();
  const ticketsResource = useResource(() => apiClient.supportTickets(), [persona.role]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Support & Helpdesk"
        description="Direct channel to CodeGuard security architects and platform engineering."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsTicketModalOpen(true)}
          >
            New Ticket
          </Button>
        }
      />

      <Card className="p-7 space-y-6">
        <Resource
          state={ticketsResource}
          loadingLabel="Loading tickets…"
          emptyWhen={(d) => !d.tickets?.length}
          emptyTitle="No support tickets"
          emptyDescription="Open a ticket and it will appear here with its status and priority."
        >
          {(data) => (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h2 className="text-base font-semibold text-foreground tracking-tight">Your Active Tickets</h2>
                <span className="font-mono text-xs text-muted-foreground">{data.tickets.length} Active Tickets</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">Subject</th>
                      <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">Ticket ID</th>
                      <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">Category</th>
                      <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">Priority</th>
                      <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">Status</th>
                      <th className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tickets.map((t: any) => (
                      <tr key={t.id} className="border-b border-border/20 hover:bg-card-hover/50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-foreground text-[14px]">
                          {t.subject}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border">
                            {t.ticketNumber ?? t.id}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-[13px]">
                          {t.category}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={t.priority === 'HIGH' || t.priority === 'URGENT' ? 'warning' : 'secondary'} size="sm" dot>
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'success' : 'primary'} size="sm" dot>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-[12px] text-muted-foreground">
                          {formatDate(t.createdAt)}
                        </td>
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
