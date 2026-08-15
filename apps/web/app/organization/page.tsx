'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Building2, UserPlus, Shield, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function OrganizationPage() {
  const { setIsInviteModalOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const membersResource = useResource(() => apiClient.orgMembers());

  const filterMembers = (members: any[]) =>
    members.filter(
      (m) =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-primary" />
            <span>Team & Seats Governance</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage developer seats, assign granular RBAC role permissions, and enforce global code policies across engineering teams.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* Seats indicator card */}
      <Card className="p-6 bg-gradient-to-r from-card-elevated to-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">Enterprise Seat Allocation</div>
          <div className="text-xl font-extrabold text-foreground font-heading mt-1">
            {membersResource.data
              ? `${membersResource.data.members.length} / ${membersResource.data.seatLimit ?? '—'} Seats Assigned`
              : 'Seats —'}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {membersResource.data?.seatLimit
              ? `${Math.max(0, membersResource.data.seatLimit - membersResource.data.members.length)} seats available in active subscription.`
              : 'Seat allocation is set by your plan.'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
          Add Extra Seats
        </Button>
      </Card>

      {/* Members Directory */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members or roles..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-input border border-border-subtle focus:border-primary text-xs text-foreground outline-none"
            />
          </div>
          <span className="text-xs text-text-muted">
            {membersResource.data ? filterMembers(membersResource.data.members).length : 0} Members
          </span>
        </div>

        <Resource
          state={membersResource}
          loadingLabel="Loading members…"
          emptyWhen={(d) => !d.members?.length}
          emptyTitle="No members yet"
          emptyDescription="Invite a teammate to get started."
        >
          {(data) => (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filterMembers(data.members).map((member: any) => (
                <tr key={member.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-[10px]">
                      {member.name[0]}
                    </div>
                    <span>{member.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-text-secondary">{member.email}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={member.role === 'OWNER' ? 'primary' : member.role === 'SECURITY_LEAD' ? 'warning' : 'secondary'} size="sm">
                      {member.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-text-muted">{formatDate(member.joinedAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toast.info(`Editing permissions for ${member.name}`)}
                    >
                      Edit Role
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          )}
        </Resource>
      </Card>
    </div>
  );
}
