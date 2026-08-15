'use client';

import React, { useState } from 'react';
import { Play, Copy, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CommandPreset {
  name: string;
  command: string;
  description: string;
  output: string[];
  jsonPayload?: Record<string, unknown>;
}

const DEFAULT_PRESETS: CommandPreset[] = [
  {
    name: 'Gemini 3.7 PR Review',
    command: 'codeguard review pr --number=142 --ai=gemini-3.7-flash',
    description: 'Trigger zero-trust AST parsing and AI code review on pull request #142',
    output: [
      '⚡ CodeGuard CLI v1.4.0 [Enterprise Edition]',
      '✓ Authenticated as elena@codeguard.dev (Pro Engineer)',
      '📦 Repository: acme/payments-service | PR #142 (branch: feature/idempotent-charges)',
      '',
      '🔍 [Stage 1/4] CodeGraph AST Analysis...',
      '  → Parsed 14 files across TypeScript AST hierarchy',
      '  → Symbol dependencies: 84 internal symbols mapped, 0 cyclic imports detected',
      '',
      '🛡️  [Stage 2/4] Zero-Trust Secret & Vulnerability Scan...',
      '  → Entropy analysis completed across 1,842 tokens',
      '  → 0 secrets leaked (passed SHA-256 entropy threshold)',
      '',
      '🤖 [Stage 3/4] Google Gemini 3.7 Flash AI Review...',
      '  → Running automated semantic verification on changed AST diffs',
      '  → Verifying race condition immunity and idempotency keys',
      '  → AI Verdict: APPROVED (No breaking regressions or hallucinated bugs)',
      '',
      '⚖️  [Stage 4/4] Branch Policy & Governance Rules...',
      '  → Enforce Clean AST: PASSED ✓',
      '  → Zero Secret Leakage: PASSED ✓',
      '  → Severity Gate Threshold: PASSED ✓',
      '',
      '✨ Review Completed in 1.42s with Status: APPROVED',
    ],
    jsonPayload: {
      reviewId: 'rev-891a-45bc',
      prNumber: 142,
      model: 'Google Gemini 3.7 Flash',
      status: 'APPROVED',
      stages: {
        astGraph: { passed: true, filesParsed: 14, symbols: 84 },
        secretScan: { passed: true, entropyLeaks: 0 },
        aiReview: { verdict: 'APPROVED', confidence: 0.98 },
        policies: { satisfied: 3, failed: 0 },
      },
      durationMs: 1420,
    },
  },
  {
    name: 'Local AST Security Scan',
    command: 'codeguard scan --staged --deep-ast',
    description: 'Deep AST security scan on staged git changes before committing',
    output: [
      '⚡ CodeGuard Local Scan Engine active',
      '→ Scanning 4 staged files in working directory...',
      '',
      '  ✓ packages/auth/src/token.ts [Clean - 0 warnings]',
      '  ✓ apps/api/src/routes/billing.ts [Clean - 0 warnings]',
      '  ✓ apps/web/lib/api.ts [Clean - 0 warnings]',
      '  ✓ packages/database/src/schema/billing.ts [Clean - 0 warnings]',
      '',
      '🛡️  Result: 0 Vulnerabilities, 0 Secrets, 100% Policy Compliant.',
      'Ready to commit!',
    ],
    jsonPayload: {
      scanType: 'STAGED_FILES',
      filesChecked: 4,
      vulnerabilities: 0,
      secrets: 0,
      timestamp: new Date().toISOString(),
    },
  },
  {
    name: 'Policy Compliance Check',
    command: 'codeguard policy check --branch=main',
    description: 'Verify branch protection policies and multi-approver requirements',
    output: [
      '⚡ CodeGuard Policy Engine v1.4.0',
      '→ Evaluating target branch: refs/heads/main',
      '',
      '  [Rule 1] Require Pull Request: ENFORCED ✓',
      '  [Rule 2] Minimum Approvals: 2 Required ✓',
      '  [Rule 3] Require CodeOwners Sign-off: ACTIVE ✓',
      '  [Rule 4] Gemini 3.7 AI Severity Threshold: BLOCK ON CRITICAL ✓',
      '  [Rule 5] Zero-Trust Secret Blocker: BLOCK ON DETECT ✓',
      '',
      '✓ Policy Status: 5/5 Protection Rules Active & Enforced.',
    ],
    jsonPayload: {
      branch: 'main',
      rulesEnforced: 5,
      requirePR: true,
      minApprovals: 2,
      status: 'PROTECTED',
    },
  },
];

export function Terminal() {
  const [selectedPreset, setSelectedPreset] = useState<CommandPreset>(DEFAULT_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'cli' | 'json' | 'logs'>('cli');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<string[]>(DEFAULT_PRESETS[0].output);
  const [logTimestamps, setLogTimestamps] = useState<string[]>(() => {
    const now = new Date();
    return [
      now.toISOString(),
      new Date(now.getTime() + 12).toISOString(),
      new Date(now.getTime() + 45).toISOString(),
      new Date(now.getTime() + 98).toISOString(),
      new Date(now.getTime() + 1420).toISOString()
    ];
  });

  const runCommand = (preset: CommandPreset) => {
    setSelectedPreset(preset);
    setIsRunning(true);
    setDisplayedLines([]);

    const now = new Date();
    setLogTimestamps([
      now.toISOString(),
      new Date(now.getTime() + 12).toISOString(),
      new Date(now.getTime() + 45).toISOString(),
      new Date(now.getTime() + 98).toISOString(),
      new Date(now.getTime() + 1420).toISOString()
    ]);

    preset.output.forEach((line, index) => {
      setTimeout(() => {
        setDisplayedLines((prev) => [...prev, line]);
        if (index === preset.output.length - 1) {
          setIsRunning(false);
          toast.success(`Executed: ${preset.name}`);
        }
      }, (index + 1) * 60);
    });
  };

  const handleCopyCommand = async () => {
    try {
      const contentToCopy =
        activeTab === 'json'
          ? JSON.stringify(selectedPreset.jsonPayload || { command: selectedPreset.command }, null, 2)
          : activeTab === 'logs'
          ? logTimestamps.map((ts, i) => `[${i === 3 ? 'DEBUG' : 'INFO'}] ${ts} - Step ${i + 1}`).join('\n')
          : selectedPreset.command;
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast.success(activeTab === 'json' ? 'Copied JSON payload' : activeTab === 'logs' ? 'Copied log stream' : 'Copied CLI command');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-5">
      {/* Preset pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEFAULT_PRESETS.map((preset) => {
          const isSelected = selectedPreset.name === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => runCommand(preset)}
              className={cn(
                'p-5 rounded-lg border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-xs',
                isSelected
                  ? 'border-border-focus bg-secondary text-foreground ring-1 ring-ring/30'
                  : 'border-border bg-card hover:bg-card-hover'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-foreground">{preset.name}</span>
                <div className={cn('p-1.5 rounded-md', isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
              <div className="text-[12px] text-muted-foreground line-clamp-1">
                {preset.description}
              </div>
              <code className="text-[11px] font-mono text-muted-foreground truncate bg-muted/70 px-2.5 py-1 rounded-md border border-border">
                {preset.command}
              </code>
            </button>
          );
        })}
      </div>

      {/* Terminal window */}
      <div className="terminal-window rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-muted/40 border-b border-border gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
            </div>
            <span className="font-mono text-xs text-muted-foreground ml-2 font-medium">
              codeguard-cli v1.4.0 <span className="text-muted-foreground/60 font-normal">• enterprise</span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <div className="flex items-center bg-muted/80 rounded-lg p-0.5 border border-border text-[11px] font-mono shadow-xs">
              <button
                onClick={() => setActiveTab('cli')}
                className={cn(
                  'px-3 py-1 rounded-md transition-all cursor-pointer font-medium',
                  activeTab === 'cli' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                CLI
              </button>

              <button
                onClick={() => setActiveTab('json')}
                className={cn(
                  'px-3 py-1 rounded-md transition-all cursor-pointer font-medium',
                  activeTab === 'json' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                JSON
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                  'px-3 py-1 rounded-md transition-all cursor-pointer font-medium',
                  activeTab === 'logs' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Logs
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => runCommand(selectedPreset)}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className={cn('w-3 h-3', isRunning && 'animate-spin')} />
                <span>Re-run</span>
              </button>

              <button
                onClick={handleCopyCommand}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Command banner */}
        <div className="px-4 py-2 bg-muted/20 border-b border-border font-mono text-xs text-muted-foreground flex items-center gap-2 overflow-x-auto break-all">
          <span className="text-primary font-bold shrink-0">$</span>
          <span className="text-foreground">{selectedPreset.command}</span>
        </div>

        {/* Terminal output */}
        <div className="p-5 min-h-[260px] max-h-[420px] overflow-y-auto overflow-x-auto font-mono text-[13px] leading-[1.8] bg-background text-foreground">
          {activeTab === 'cli' && (
            <div className="space-y-1">
              {displayedLines.map((line, idx) => {
                let lineClass = 'text-foreground/90';
                if (line.includes('PASSED') || line.includes('APPROVED') || line.includes('✓') || line.includes('Clean')) {
                  lineClass = 'text-success font-medium';
                } else if (line.includes('BLOCKED') || line.includes('Critical') || line.includes('Leak')) {
                  lineClass = 'text-destructive font-medium';
                } else if (line.includes('Stage') || line.includes('CodeGuard') || line.includes('⚡')) {
                  lineClass = 'text-primary font-semibold';
                } else if (line.includes('→')) {
                  lineClass = 'text-accent';
                }

                return (
                  <div key={idx} className={lineClass}>
                    {line}
                  </div>
                );
              })}
              {isRunning && (
                <div className="flex items-center gap-2 text-primary font-medium animate-pulse pt-1">
                  <span className="inline-block w-1.5 h-3.5 bg-primary" />
                  <span>Processing AST graph and AI verification...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <pre className="text-foreground/90 whitespace-pre-wrap break-all font-mono text-[12px]">
              {JSON.stringify(selectedPreset.jsonPayload || { command: selectedPreset.command }, null, 2)}
            </pre>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-1.5 text-muted-foreground text-[12px] font-mono">
              <div>[INFO] {logTimestamps[0]} - Initializing worker daemon pool</div>
              <div>[INFO] {logTimestamps[1]} - Fetching repository AST commit tree sha=9a8f21bc</div>
              <div>[INFO] {logTimestamps[2]} - Connected to Google Gemini 3.7 Flash AI Reviewer</div>
              <div>[DEBUG] {logTimestamps[3]} - Zero-trust token entropy evaluation: 0 leaks</div>
              <div>[INFO] {logTimestamps[4]} - Policy rules verified. Returning HTTP 200 OK</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
