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
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <IconBadge color="slate" size="sm">
              <TerminalIcon />
            </IconBadge>
            <span>Developer CLI & Interactive Terminal</span>
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-2xl">
            Execute local zero-trust scans, simulate Gemini 3.7 PR reviews, and inspect raw AST CodeGraph payloads directly from the web or command line.
          </p>
        </div>
      </div>

      {/* Interactive Web Terminal */}
      <Terminal />

      {/* Local Installation & Integration Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-[15px] font-semibold text-foreground">Local CLI Quickstart</h3>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Install the CodeGuard CLI to enforce git pre-commit hooks, block secret leaks before they leave your laptop, and automate local pull request verification.
          </p>
          <CodeBlock code={installSnippet} language="bash" filename="Terminal" showLineNumbers={false} />
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-[15px] font-semibold text-foreground">Architecture Highlights</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/40 border border-border flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-medium">Google Gemini 3.7 Flash:</strong> Sub-second automated code reviews with semantic diff reasoning.
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border flex items-start gap-3">
              <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-medium">Zero-Trust Secret Scanner:</strong> SHA-256 entropy inspection preventing token and private key leakage.
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border flex items-start gap-3">
              <TerminalIcon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-medium">CodeGraph AST Engine:</strong> Cross-file symbol dependency tracking and cyclic graph validation.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
