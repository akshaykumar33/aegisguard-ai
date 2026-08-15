'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { DemoPersonaRole } from '@/lib/types';
import { GraduationCap, Zap, Building2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PersonaSwitcher() {
  const { persona, setPersonaRole } = useApp();

  const personas: { id: DemoPersonaRole; label: string; icon: React.ReactNode }[] = [
    { id: 'student', label: 'Student', icon: <GraduationCap className="w-3 h-3" /> },
    { id: 'pro', label: 'Pro', icon: <Zap className="w-3 h-3" /> },
    { id: 'org', label: 'Org', icon: <Building2 className="w-3 h-3" /> },
    { id: 'admin', label: 'Admin', icon: <Crown className="w-3 h-3" /> },
  ];

  return (
    <div className="flex items-center bg-card p-0.5 rounded-lg border border-border w-full sm:w-auto overflow-x-auto shadow-xs">
      {personas.map((p) => {
        const isActive = persona.role === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setPersonaRole(p.id)}
            className={cn(
              'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all select-none whitespace-nowrap cursor-pointer',
              isActive
                ? 'bg-secondary text-foreground border border-border shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            )}
          >
            <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
