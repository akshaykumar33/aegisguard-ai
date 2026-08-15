'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Mail, User, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function InviteModal() {
  const { isInviteModalOpen, setIsInviteModalOpen } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN' | 'SECURITY_LEAD' | 'AUDITOR'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please provide a valid email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsInviteModalOpen(false);
      toast.success(`Invitation sent to ${email}!`, {
        description: `They will receive an email with secure onboarding instructions as a ${role}.`,
      });
      setName('');
      setEmail('');
    }, 800);
  };

  return (
    <Modal
      isOpen={isInviteModalOpen}
      onClose={() => setIsInviteModalOpen(false)}
      title="Invite Team Member"
      description="Add engineering teammates or security leads to your organization with role-based permissions."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. David Zhao"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Work Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="david@company.com"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Role & Permission Level
          </label>
          <div className="relative">
            <Shield className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors"
            >
              <option value="MEMBER">Member (Standard PR Review & Developer Access)</option>
              <option value="SECURITY_LEAD">Security Lead (Policy Enforcement & Findings Triage)</option>
              <option value="ADMIN">Organization Admin (Full Seats, Billing & Settings)</option>
              <option value="AUDITOR">Compliance Auditor (Read-only Immutable Audit Logs)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-6">
          <Button variant="ghost" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
