'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export interface CodeTabsProps {
  commands: {
    pnpm: string;
    npm: string;
    yarn: string;
    bun: string;
  };
}

export function CodeTabs({ commands }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState<'pnpm' | 'npm' | 'yarn' | 'bun'>('pnpm');
  const [copied, setCopied] = useState(false);

  const activeCommand = commands[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCommand);
      setCopied(true);
      toast.success(`Copied ${activeTab} command`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card-elevated overflow-hidden my-4 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
          {(['pnpm', 'npm', 'yarn', 'bun'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                activeTab === tab
                  ? 'bg-card text-foreground font-semibold border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Copy command"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-3.5 font-mono text-xs text-primary bg-black/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-muted-foreground opacity-60 select-none">$</span>
        <span className="text-foreground">{activeCommand}</span>
      </div>
    </div>
  );
}
