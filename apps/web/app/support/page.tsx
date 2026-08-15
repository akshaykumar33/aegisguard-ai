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
import { Plus, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { IconBadge } from '@/components/ui/IconBadge';

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

      <Card className="p-6 space-y-5">
        <Resource
          state={ticketsResource}
          loadingLabel="Loading tickets…"
          emptyWhen={(d) => !d.tickets?.length}
          emptyTitle="No support tickets"
          emptyDescription="Open a ticket and it will appear here with its status and priority."
        >
          {(data) => (
            <>
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-[15px] font-semibold text-foreground">Your Active Tickets</h2>
                <span className="font-mono text-[12px] text-muted-foreground">{data.tickets.length} Tickets</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Subject</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Ticket ID</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Priority</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tickets.map((t: any) => (
                      <tr key={t.id} className="border-b border-border/20 hover:bg-card-hover/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {t.subject}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                            {t.ticketNumber ?? t.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {t.category}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={t.priority === 'HIGH' || t.priority === 'URGENT' ? 'warning' : 'secondary'} size="sm" dot>
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'success' : 'primary'} size="sm" dot>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[12px] text-muted-foreground">
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
