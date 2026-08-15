'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Radio, Send } from 'lucide-react';
import { toast } from 'sonner';

import { IconBadge } from '@/components/ui/IconBadge';
import { Select } from '@/components/ui/Select';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading flex items-center gap-3">
            <IconBadge color="slate" size="sm">
              <Radio />
            </IconBadge>
            <span>Multi-Channel Broadcaster</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Target announcements, policy change alerts, and security maintenance notices to specific subscriber cohorts.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSend} className="space-y-4">
            <Select
              label="Target Audience Cohort"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              options={[
                { value: 'EVERYONE', label: 'All Active Platform Subscribers' },
                { value: 'PRO', label: 'Pro Plan Engineers Only' },
                { value: 'ORGANIZATION', label: 'Enterprise Organization Owners' },
                { value: 'STUDENT', label: 'Student Developers (Free Tier)' },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground tracking-tight">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gemini 3.7 Flash AI Reviewer engine update"
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:border-border-focus focus:ring-1 focus:ring-border-focus text-xs text-foreground outline-none transition-colors shadow-xs"
                />
              </div>

              <Select
                label="Priority Level"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: 'NORMAL', label: 'Normal (Informational In-App)' },
                  { value: 'HIGH', label: 'High Priority (In-App + Email Digest)' },
                  { value: 'CRITICAL', label: 'Critical Alert (Immediate Push Notification)' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground tracking-tight">
                Broadcast Message *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement or release notes here..."
                className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:border-border-focus focus:ring-1 focus:ring-border-focus text-xs text-foreground outline-none transition-colors shadow-xs resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                isLoading={isLoading}
                leftIcon={<Send className="w-4 h-4" />}
                type="submit"
              >
                Dispatch Broadcast
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
