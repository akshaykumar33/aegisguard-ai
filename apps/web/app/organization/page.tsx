'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  UserPlus,
  Search,
  Shield,
  Users,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrganizationPage() {
  const { persona, setIsInviteModalOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const membersResource = useResource(() => apiClient.orgMembers(), [persona.role]);

  const filterMembers = (members: any[]) =>
    members.filter(
      (m) =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'primary' | 'warning' | 'success' | 'secondary'> = {
      OWNER: 'primary',
      ADMIN: 'warning',
      SECURITY_LEAD: 'success',
      MEMBER: 'secondary',
    };
    return variants[role] || 'secondary';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Team & Seats"
        description="Manage developer seats and role permissions across your organization."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        }
      />

      {/* Seats indicator card */}
      <Card className="p-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="space-y-2 flex-1 max-w-lg">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Seat Allocation</span>
            <Badge variant="primary" size="sm" dot>
              ACTIVE ENTERPRISE
            </Badge>
          </div>
          <div className="text-xl font-semibold text-foreground tabular">
            {membersResource.data
              ? `${membersResource.data.members.length} / ${membersResource.data.seatLimit ?? '—'} Seats Assigned`
              : 'Seats —'}
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {membersResource.data?.seatLimit
              ? `${Math.max(0, membersResource.data.seatLimit - membersResource.data.members.length)} developer seats available in current billing plan.`
              : 'Seat allocation is dynamically provisioned by your enterprise plan.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
            Add Seats
          </Button>
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setIsInviteModalOpen(true)}>
            Invite Teammate
          </Button>
        </div>
      </Card>

      {/* Members Directory */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members or roles…"
              aria-label="Search members"
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-[13px] text-foreground outline-none placeholder:text-muted-foreground hover:border-border-focus focus:border-border-focus focus:ring-1 focus:ring-ring/30 transition-all shadow-xs"
            />
          </div>
          <span className="text-[13px] text-muted-foreground">
            {membersResource.data ? filterMembers(membersResource.data.members).length : 0} Active Members
          </span>
        </div>

        <Resource
          state={membersResource}
          loadingLabel="Loading members…"
          emptyWhen={(d) => !d.members?.length}
          emptyTitle="No members yet"
          emptyDescription="Invite a teammate to get started."
        >
          {(data) => {
            const filtered = filterMembers(data.members);
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Role</th>
                      <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Joined</th>
                      <th className="text-right py-3 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m: any) => (
                      <tr key={m.id} className="border-b border-border/20 hover:bg-card-hover/50 transition-colors">
                        {/* Member cell */}
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-3">
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt={m.name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0"
                              />
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-[13px] font-semibold text-foreground">
                                {m.name?.[0]?.toUpperCase() ?? '?'}
                              </span>
                            )}
                            <span className="font-medium text-foreground">{m.name || '—'}</span>
                          </span>
                        </td>
                        {/* Email cell */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[12px] text-muted-foreground">{m.email || '—'}</span>
                        </td>
                        {/* Role cell */}
                        <td className="py-3.5 px-4">
                          <Badge variant={getRoleBadge(m.role)} size="sm">
                            {m.role === 'SECURITY_LEAD' ? (
                              <span className="flex items-center gap-1.5">
                                <Shield className="w-3 h-3" />
                                {m.role}
                              </span>
                            ) : m.role}
                          </Badge>
                        </td>
                        {/* Joined cell */}
                        <td className="py-3.5 px-4">
                          <span className="text-muted-foreground text-[12px]">{m.joinedAt ? formatDate(m.joinedAt) : '—'}</span>
                        </td>
                        {/* Actions cell */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              leftIcon={<Settings className="w-3 h-3" />}
                              onClick={() => toast.info(`Editing permissions for ${m.name}`)}
                            >
                              Edit role
                            </Button>
                            <button
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              onClick={() => toast.info(`More options for ${m.name}`)}
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }}
        </Resource>
      </Card>
    </div>
  );
}
