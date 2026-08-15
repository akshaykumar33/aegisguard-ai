'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Radio, Send, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState('EVERYONE');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Title and message are required.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Broadcast sent successfully!`, {
        description: `Delivered to target segment (${audience}) via In-App and Email notifications.`,
      });
      setTitle('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-accent" />
            <span>Multi-Channel Broadcaster</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Target announcements, policy change alerts, and security maintenance notices to specific subscriber cohorts.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Target Audience Cohort
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-accent text-xs text-foreground outline-none font-sans"
              >
                <option value="EVERYONE">All Active Platform Subscribers</option>
                <option value="PRO">Pro Plan Engineers Only</option>
                <option value="ORGANIZATION">Enterprise Organization Owners</option>
                <option value="STUDENT">Student Developers (Free Tier)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gemini 3.7 Flash AI Reviewer engine update"
                  className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-accent text-xs text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-input border border-border-subtle focus:border-accent text-xs text-foreground outline-none"
                >
                  <option value="NORMAL">Normal (Informational In-App)</option>
                  <option value="HIGH">High Priority (In-App + Email Digest)</option>
                  <option value="CRITICAL">Critical Alert (Immediate Push Notification)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Broadcast Message *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement or maintenance notice here..."
                className="w-full px-4 py-2.5 rounded-xl bg-input border border-border-subtle focus:border-accent text-xs text-foreground outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isLoading}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Broadcast
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
