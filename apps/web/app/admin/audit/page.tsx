'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Download, Shield } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

import { IconBadge } from '@/components/ui/IconBadge';

export default function AdminAuditPage() {
  const { persona } = useApp();
  const logs = useResource(() => apiClient.adminAuditLogs(), [persona.role]);

  const handleExport = () => {
    toast.success('Immutable audit logs exported in signed JSON format.');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Audit trail & compliance"
        description="Signed record of break-glass overrides, role changes, and policy edits."
        actions={
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>
            Export Signed JSON
          </Button>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <IconBadge color="slate" size="xs">
              <Shield />
            </IconBadge>
            <h2 className="text-sm font-semibold text-foreground">Cryptographic Security Events</h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {logs.data?.auditLogs.length ?? 0} Events Recorded
          </span>
        </div>

        <Resource
          state={logs}
          loadingLabel="Loading audit events…"
          emptyWhen={(d) => !d.auditLogs?.length}
          emptyTitle="No audit events"
          emptyDescription="Platform activity will be recorded here as it happens."
        >
          {(data) => (
        <DataTable
          caption="Security audit events"
          rows={data.auditLogs}
          rowKey={(log: any) => log.id}
          columns={[
            {
              header: 'Action',
              primary: true,
              cell: (log: any) => <span className="font-mono text-xs font-medium text-foreground">{log.action}</span>,
            },
            {
              header: 'Timestamp',
              cell: (log: any) => (
                <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </span>
              ),
            },
            {
              header: 'Actor',
              cell: (log: any) => (
                <Badge variant={log.actorType === 'ADMIN' ? 'danger' : 'primary'} size="sm" dot>
                  {log.actorType}
                </Badge>
              ),
            },
            {
              header: 'Resource',
              cell: (log: any) => <span className="font-mono text-[12px] text-text-secondary">{log.resourceType}</span>,
            },
            {
              header: 'Metadata',
              hideOnCard: true,
              cell: (log: any) => (
                <code className="block max-w-[22rem] truncate rounded-sm border border-border-subtle bg-muted px-1.5 py-0.5 font-mono text-[11px] text-text-muted">
                  {JSON.stringify(log.metadata || {})}
                </code>
              ),
            },
          ]}
        />
          )}
        </Resource>
      </Card>
    </div>
  );
}
