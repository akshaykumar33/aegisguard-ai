'use client';

import React from 'react';
import { Terminal } from '@/components/terminal/Terminal';
import { Card } from '@/components/ui/Card';
import { CodeBlock } from '@/components/code/CodeBlock';
import { Terminal as TerminalIcon, Download, Sparkles, Shield, Cpu } from 'lucide-react';
import { IconBadge } from '@/components/ui/IconBadge';

export default function TerminalPage() {
  const installSnippet = `# Install the CodeGuard CLI globally or locally in your repository
npm install -g @codeguard/cli

# Login and authenticate with your account
codeguard auth login

# Run automated zero-trust AST scan on staged changes
codeguard scan --staged`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-border/40">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <IconBadge color="slate" size="sm">
              <TerminalIcon />
            </IconBadge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Developer CLI & Interactive Terminal
            </h1>
          </div>
          <p className="text-[14px] text-muted-foreground leading-relaxed max-w-3xl">
            Execute local zero-trust scans, simulate Gemini 3.7 PR reviews, and inspect raw AST CodeGraph payloads directly from the web or command line.
          </p>
        </div>
      </div>

      {/* Interactive Web Terminal */}
      <Terminal />

      {/* Local Installation & Integration Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border/40">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">Local CLI Quickstart</h3>
              <p className="text-xs text-muted-foreground">Command line integration for CI/CD and pre-commit hooks</p>
            </div>
          </div>

          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            Install the CodeGuard CLI to enforce git pre-commit hooks, block secret leaks before they leave your laptop, and automate local pull request verification.
          </p>
          <CodeBlock code={installSnippet} language="bash" filename="Terminal" showLineNumbers={false} />
        </Card>

        <Card className="p-7 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border/40">
            <div className="p-2 rounded-xl bg-secondary text-foreground border border-border">
              <Cpu className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">Architecture Highlights</h3>
              <p className="text-xs text-muted-foreground">Multi-stage pipeline intelligence and verification engines</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 flex items-start gap-3.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">Google Gemini 3.7 Flash:</strong> Sub-second automated code reviews with semantic diff reasoning and AST patch generation.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 flex items-start gap-3.5">
              <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">Zero-Trust Secret Scanner:</strong> Shannon entropy inspection preventing token and private key leakage across all git commits.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 flex items-start gap-3.5">
              <TerminalIcon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">CodeGraph AST Engine:</strong> Cross-file symbol dependency tracking and cyclic graph validation.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
