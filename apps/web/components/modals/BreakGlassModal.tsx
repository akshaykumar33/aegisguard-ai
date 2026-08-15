'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function BreakGlassModal() {
  const { isBreakGlassModalOpen, setIsBreakGlassModalOpen, persona } = useApp();
  const [repository, setRepository] = useState('payments-service');
  const [branch, setBranch] = useState('main');
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.length < 15) {
      toast.error('Detailed technical justification is mandatory (minimum 15 characters).');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsBreakGlassModalOpen(false);
      toast.error(`⚠️ Break-Glass Override Activated for ${repository}`, {
        description: `Active for ${durationMinutes} minutes. Immutable event logged to SOC2 security audit trail.`,
      });
      setReason('');
    }, 1000);
  };

  return (
    <Modal
      isOpen={isBreakGlassModalOpen}
      onClose={() => setIsBreakGlassModalOpen(false)}
      title={
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="w-5 h-5" />
          <span>Emergency Break-Glass Protocol</span>
        </div>
      }
      description="Temporarily bypass AI code review and branch protection policies during critical production outage incidents."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>High-Risk Action:</strong> Break-Glass overrides bypass all automated AST gates and secret scanners.
            Every invocation generates an immutable audit record and notifies the security lead.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Target Repository
            </label>
            <input
              type="text"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-destructive text-xs text-foreground outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Target Branch
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-destructive text-xs text-foreground outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Bypass Duration
          </label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-destructive text-xs text-foreground outline-none font-mono"
          >
            <option value={15}>15 Minutes (Fast Hotfix)</option>
            <option value={30}>30 Minutes (Recommended)</option>
            <option value={60}>60 Minutes (Major Incident)</option>
            <option value={120}>120 Minutes (Disaster Recovery)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Mandatory Incident Justification *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Production outage INC-9024: Payment gateway webhook timeout failover patch required immediately."
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-border-subtle focus:border-destructive text-xs text-foreground outline-none resize-none font-sans"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-6">
          <div className="text-[11px] text-text-muted">
            Requester: <span className="font-mono text-foreground">{persona.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsBreakGlassModalOpen(false)}>
              Abort
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isLoading}>
              Activate Override
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
