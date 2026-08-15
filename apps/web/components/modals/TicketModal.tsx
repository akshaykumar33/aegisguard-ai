'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export function TicketModal() {
  const { isTicketModalOpen, setIsTicketModalOpen } = useApp();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error('Please enter both a subject and message.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsTicketModalOpen(false);
      toast.success('Support ticket submitted successfully!', {
        description: `Ticket #${Math.floor(1000 + Math.random() * 9000)} created. A security engineer will review within 2 hours.`,
      });
      setSubject('');
      setMessage('');
    }, 900);
  };

  return (
    <Modal
      isOpen={isTicketModalOpen}
      onClose={() => setIsTicketModalOpen(false)}
      title="Open Security Support Ticket"
      description="Connect directly with CodeGuard security architects and platform engineers."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Subject *
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Guidance on fine-tuning AST rules for microservices"
            className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors"
            >
              <option value="Technical Support">Technical & AST Parsing</option>
              <option value="Security Scanner">Secret Scanner & Vulnerabilities</option>
              <option value="Billing & Limits">Billing & Quota Increase</option>
              <option value="Feature Request">Feature Request / RFC</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors"
            >
              <option value="LOW">Low (General Inquiry)</option>
              <option value="MEDIUM">Medium (Standard Support)</option>
              <option value="HIGH">High (Production Blocked)</option>
              <option value="URGENT">Urgent (Critical Incident / SLA)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Detailed Explanation *
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue, include repository name, PR links, or reproduction steps..."
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-6">
          <Button variant="ghost" size="sm" type="button" onClick={() => setIsTicketModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Submit Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
