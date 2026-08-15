import React from 'react';
import { Info, Lightbulb, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocsCalloutProps {
  type?: 'note' | 'tip' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DocsCallout({
  type = 'note',
  title,
  children,
  className,
}: DocsCalloutProps) {
  const styles = {
    note: {
      border: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
      defaultTitle: 'Note',
    },
    tip: {
      border: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />,
      defaultTitle: 'Tip',
    },
    warning: {
      border: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      defaultTitle: 'Warning',
    },
    danger: {
      border: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
      defaultTitle: 'Important',
    },
    success: {
      border: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      defaultTitle: 'Success',
    },
  };

  const current = styles[type];

  return (
    <div className={cn('rounded-xl border p-4 my-4 space-y-1 text-xs', current.border, className)}>
      <div className="flex items-center gap-2 font-semibold text-foreground">
        {current.icon}
        <span>{title || current.defaultTitle}</span>
      </div>
      <div className="text-muted-foreground leading-relaxed pl-6">{children}</div>
    </div>
  );
}
