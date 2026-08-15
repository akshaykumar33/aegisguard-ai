'use client';

import React, { useState } from 'react';
import { MOCK_AUDIT_LOGS } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { History, Shield, Download } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAuditPage() {
  const [auditLogs] = useState(MOCK_AUDIT_LOGS);

  const handleExport = () => {
    toast.success('Immutable audit logs exported in signed JSON format.');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <History className="w-7 h-7 text-accent" />
            <span>Immutable Security Audit Trail</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Cryptographically signed audit trail recording all Break-Glass overrides, role modifications, and policy changes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Export Signed Audit Logs
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-foreground font-heading">Security Events Log</h3>
          </div>
          <span className="text-xs text-text-muted">{auditLogs.length} Events Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-text-muted">{formatDateTime(log.createdAt)}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={log.actorType === 'ADMIN' ? 'danger' : 'primary'} size="sm">
                      {log.actorType}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{log.action}</td>
                  <td className="py-3.5 px-4 font-mono text-text-secondary">{log.resourceType}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-text-muted">
                    <code className="bg-black/30 px-2 py-1 rounded border border-white/5 truncate max-w-xs block">
                      {JSON.stringify(log.metadata || {})}
                    </code>
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
