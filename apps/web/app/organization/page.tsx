'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Resource } from '@/components/ui/ResourceStates';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  UserPlus,
  Search,
  Shield,
  Users,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { IconBadge } from '@/components/ui/IconBadge';

const PAGE_SIZE_OPTIONS = [8, 15, 25];

export default function OrganizationPage() {
  const { persona, setIsInviteModalOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const membersResource = useResource(() => apiClient.orgMembers(), [persona.role]);

  // Filter members by search and role
  const filteredMembers = useMemo(() => {
    if (!membersResource.data?.members) return [];
    return membersResource.data.members.filter((m: any) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [membersResource.data, searchTerm, roleFilter]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));

  // Current page sliced items
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Reset to page 1 on filter/search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'primary' | 'warning' | 'success' | 'secondary'> = {
      OWNER: 'primary',
      ADMIN: 'warning',
      SECURITY_LEAD: 'success',
      MEMBER: 'secondary',
    };
    return variants[role] || 'secondary';
  };

  const seatCount = membersResource.data?.members?.length || 0;
  const seatLimit = membersResource.data?.seatLimit || 50;
  const seatPercentage = Math.min(100, Math.round((seatCount / seatLimit) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="Team & Developer Seats"
        description="Manage developer seats, organizational roles, and automated governance permissions."
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

      {/* 1. SEAT ALLOCATION BANNER */}
      <Card className="p-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="space-y-4 flex-1 max-w-xl">
          <div className="flex items-center gap-2.5">
            <IconBadge color="primary" size="xs">
              <Users />
            </IconBadge>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
              Seat Allocation
            </span>
            <Badge variant="primary" size="sm" dot>
              ENTERPRISE TIER
            </Badge>
          </div>

          <div>
            <div className="text-3xl font-bold text-foreground tracking-tight tabular">
              {seatCount} / {seatLimit} Seats Assigned
            </div>
            <p className="text-[14px] text-muted-foreground leading-relaxed mt-1">
              {Math.max(0, seatLimit - seatCount)} developer seats available for your team in the current billing plan.
            </p>
          </div>

          <div className="space-y-1.5 max-w-md pt-1">
            <Progress value={seatPercentage} size="sm" />
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>{seatPercentage}% capacity utilized</span>
              <span className="text-success font-medium">● Normal Growth</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
            Add Seats
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Teammate
          </Button>
        </div>
      </Card>

      {/* 2. MEMBERS DIRECTORY TABLE */}
      <Card className="p-7 space-y-6">
        {/* Search and Role Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search members by name, email, or role…"
                aria-label="Search members"
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-[13px] text-foreground outline-none placeholder:text-muted-foreground hover:border-border-focus focus:border-border-focus focus:ring-1 focus:ring-ring/30 transition-all shadow-xs"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/60 overflow-x-auto">
              {['ALL', 'OWNER', 'ADMIN', 'SECURITY_LEAD', 'MEMBER'].map((role) => {
                const isSelected = roleFilter === role;
                const label =
                  role === 'ALL'
                    ? 'All Roles'
                    : role === 'SECURITY_LEAD'
                    ? 'Security Leads'
                    : role.charAt(0) + role.slice(1).toLowerCase() + 's';
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleFilterChange(role)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer select-none ${
                      isSelected
                        ? 'bg-card text-foreground font-semibold border border-border shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-mono text-muted-foreground shrink-0">
            <span className="font-semibold text-foreground">{filteredMembers.length}</span>
            <span>Active Members</span>
          </div>
        </div>

        {/* Paginated Resource Table */}
        <Resource
          state={membersResource}
          loadingLabel="Loading members…"
          emptyWhen={(d) => !d.members?.length}
          emptyTitle="No members found"
          emptyDescription="Invite a teammate or clear your search filters."
        >
          {() => (
            <>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                        Member
                      </th>
                      <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                        Email Address
                      </th>
                      <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                        Role & Permissions
                      </th>
                      <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                        Joined Date
                      </th>
                      <th className="text-right py-3.5 px-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 bg-card">
                    {paginatedMembers.length > 0 ? (
                      paginatedMembers.map((m: any) => (
                        <tr
                          key={m.id}
                          className="hover:bg-card-hover/60 transition-colors group"
                        >
                          {/* Member Cell */}
                          <td className="py-4 px-5">
                            <span className="flex items-center gap-3.5">
                              {m.avatarUrl ? (
                                <img
                                  src={m.avatarUrl}
                                  alt={m.name}
                                  className="w-10 h-10 rounded-full object-cover ring-1 ring-border/80 shrink-0"
                                />
                              ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-[14px] font-semibold text-foreground">
                                  {m.name?.[0]?.toUpperCase() ?? '?'}
                                </span>
                              )}
                              <span className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground text-[14px] tracking-tight group-hover:text-primary transition-colors truncate">
                                  {m.name || '—'}
                                </span>
                                <span className="text-[12px] text-muted-foreground font-sans">
                                  {m.role === 'OWNER'
                                    ? 'Organization Owner'
                                    : m.role === 'SECURITY_LEAD'
                                    ? 'Product Security Lead'
                                    : m.role === 'ADMIN'
                                    ? 'Platform Administrator'
                                    : 'Software Engineer'}
                                </span>
                              </span>
                            </span>
                          </td>

                          {/* Email Cell */}
                          <td className="py-4 px-5">
                            <span className="font-mono text-[12px] text-muted-foreground flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 opacity-60 shrink-0" />
                              <span>{m.email || '—'}</span>
                            </span>
                          </td>

                          {/* Role Cell */}
                          <td className="py-4 px-5">
                            <Badge variant={getRoleBadge(m.role)} size="sm" dot>
                              {m.role === 'SECURITY_LEAD' ? (
                                <span className="flex items-center gap-1.5">
                                  <Shield className="w-3 h-3" />
                                  SECURITY LEAD
                                </span>
                              ) : (
                                m.role
                              )}
                            </Badge>
                          </td>

                          {/* Joined Cell */}
                          <td className="py-4 px-5">
                            <span className="text-muted-foreground font-mono text-[12px]">
                              {m.joinedAt ? formatDate(m.joinedAt) : '—'}
                            </span>
                          </td>

                          {/* Actions Cell */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="xs"
                                leftIcon={<Settings className="w-3 h-3" />}
                                onClick={() => toast.info(`Editing permissions for ${m.name}`)}
                              >
                                Edit Role
                              </Button>
                              <button
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                onClick={() => toast.info(`More options for ${m.name}`)}
                                title="More options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                          No matching team members found for &ldquo;{searchTerm}&rdquo;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 3. PAGINATION BOTTOM BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 text-xs font-mono text-muted-foreground border-t border-border/40">
                <div className="flex items-center gap-3">
                  <span>
                    Showing{' '}
                    <strong className="text-foreground font-semibold">
                      {filteredMembers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, filteredMembers.length)}
                    </strong>{' '}
                    of <strong className="text-foreground font-semibold">{filteredMembers.length}</strong> members
                  </span>

                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-border/60">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground outline-none cursor-pointer focus:border-border-focus"
                    >
                      {PAGE_SIZE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Numbered Page Buttons & Prev/Next */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isCurrent = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="xs"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Resource>
      </Card>
    </div>
  );
}
