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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <IconBadge color="slate" size="sm">
              <Radio />
            </IconBadge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Multi-Channel Broadcaster
            </h1>
          </div>
          <p className="text-[14px] text-muted-foreground leading-relaxed max-w-2xl">
            Target announcements, policy change alerts, and security maintenance notices to specific subscriber cohorts.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="p-7 space-y-6">
          <form onSubmit={handleSend} className="space-y-5">
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

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted-foreground tracking-widest uppercase font-mono">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gemini 3.7 Flash AI Reviewer engine update"
                className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:border-border-focus focus:ring-1 focus:ring-ring/30 text-[13px] text-foreground outline-none transition-colors shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted-foreground tracking-widest uppercase font-mono">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:border-border-focus focus:ring-1 focus:ring-ring/30 text-[13px] text-foreground outline-none transition-colors shadow-xs"
              >
                <option value="LOW">Low (Informational Banner)</option>
                <option value="NORMAL">Normal (In-App Feed)</option>
                <option value="HIGH">High (Urgent In-App Notification)</option>
                <option value="CRITICAL">Critical (Email + Immediate Interrupt)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted-foreground tracking-widest uppercase font-mono">
                Announcement Message *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Compose announcement body or Markdown formatting..."
                className="w-full p-4 rounded-lg bg-card border border-border focus:border-border-focus focus:ring-1 focus:ring-ring/30 text-[13px] text-foreground outline-none transition-colors shadow-xs resize-y"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Broadcasting…' : 'Dispatch Multi-Channel Broadcast'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
