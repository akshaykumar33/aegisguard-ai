'use client';

import React from 'react';
import { Terminal } from '@/components/terminal/Terminal';
import { Card } from '@/components/ui/Card';
import { CodeBlock } from '@/components/code/CodeBlock';
import { Terminal as TerminalIcon, Download, Sparkles, Shield, Cpu } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <TerminalIcon className="w-7 h-7 text-primary" />
            <span>Developer CLI & Interactive Terminal</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Execute local zero-trust scans, simulate Gemini 3.7 PR reviews, and inspect raw AST CodeGraph payloads directly from the web or command line.
          </p>
        </div>
      </div>

      {/* Interactive Web Terminal */}
      <Terminal />

      {/* Local Installation & Integration Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground font-heading">Local CLI Quickstart</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Install the CodeGuard CLI to enforce git pre-commit hooks, block secret leaks before they leave your laptop, and automate local pull request verification.
          </p>
          <CodeBlock code={installSnippet} language="bash" filename="Terminal" showLineNumbers={false} />
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            <h3 className="text-base font-bold text-foreground font-heading">Architecture Highlights</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-card-elevated border border-border-subtle flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Google Gemini 3.7 Flash:</strong> Sub-second automated code reviews with semantic diff reasoning.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card-elevated border border-border-subtle flex items-start gap-3">
              <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">Zero-Trust Secret Scanner:</strong> SHA-256 entropy inspection preventing token and private key leakage.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card-elevated border border-border-subtle flex items-start gap-3">
              <TerminalIcon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground">CodeGraph AST Engine:</strong> Cross-file symbol dependency tracking and cyclic graph validation.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
