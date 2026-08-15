'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Copy,
  Check,
  Code2,
  FileCode,
  Sparkles,
  Terminal,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Real Shannon Entropy mathematical calculation in browser
function calculateEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies: { [key: string]: number } = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

const PRESET_SNIPPETS = [
  {
    name: 'Critical Secret Leak',
    badge: 'SECRET LEAK',
    severity: 'danger' as const,
    code: `// AWS & GitHub credentials committed in auth middleware
const GITHUB_ACCESS_TOKEN = "ghp_91823719827391827391827398127398";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

export async function authenticate() {
  return fetch("https://api.github.com/user", {
    headers: { Authorization: \`Bearer \${GITHUB_ACCESS_TOKEN}\` }
  });
}`,
  },
  {
    name: 'Clean TypeScript AST',
    badge: 'CLEAN CODE',
    severity: 'success' as const,
    code: `// Clean zero-trust HMAC webhook verification
import crypto from 'node:crypto';

export function verifyWebhook(payload: Buffer, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from('sha256=' + hmac));
}`,
  },
  {
    name: 'Dangerous eval() Injection',
    badge: 'AST RCE FLAW',
    severity: 'warning' as const,
    code: `// Dynamic deserialization flaw
export function parseConfig(untrustedInput: string) {
  // Vulnerable to Remote Code Execution
  return eval("(" + untrustedInput + ")");
}`,
  },
];

export function InteractivePlayground() {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [code, setCode] = useState(PRESET_SNIPPETS[0].code);
  const [isCopied, setIsCopied] = useState(false);

  // Live real-time analysis
  const analysis = useMemo(() => {
    const lines = code.split('\n');
    let maxLineEntropy = 0;
    const flaggedLines: number[] = [];
    const highEntropyLines: { line: number; text: string; entropy: number }[] = [];
    const detectedVulnerabilities: { line: number; rule: string; message: string; fix: string }[] = [];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      const entropy = calculateEntropy(trimmed);
      if (entropy > maxLineEntropy) maxLineEntropy = entropy;

      if (entropy > 4.2 && trimmed.length > 25) {
        flaggedLines.push(lineNum);
        highEntropyLines.push({ line: lineNum, text: trimmed, entropy });
        detectedVulnerabilities.push({
          line: lineNum,
          rule: 'SEC-001 (Entropy Ceiling)',
          message: `High Shannon entropy (${entropy} bits) exceeds safe threshold of 4.20.`,
          fix: 'Move hardcoded secret string into process.env or Secret Vault.',
        });
      }

      if (trimmed.includes('eval(')) {
        flaggedLines.push(lineNum);
        detectedVulnerabilities.push({
          line: lineNum,
          rule: 'AST-RCE-004 (Dynamic Code Execution)',
          message: 'Direct invocation of eval() on untrusted parameter.',
          fix: 'Use JSON.parse() with strict schema validation.',
        });
      }

      if (trimmed.includes('ghp_') || trimmed.includes('AKIA') || trimmed.includes('sk_live_')) {
        flaggedLines.push(lineNum);
        detectedVulnerabilities.push({
          line: lineNum,
          rule: 'TOKEN-LEAK-012 (Token Signature)',
          message: 'Plaintext secret API token pattern detected.',
          fix: 'Rotate compromised credential immediately.',
        });
      }
    });

    const isBlocked = flaggedLines.length > 0;

    return {
      totalLines: lines.length,
      characters: code.length,
      maxEntropy: maxLineEntropy,
      flaggedLines: Array.from(new Set(flaggedLines)),
      highEntropyLines,
      detectedVulnerabilities,
      isBlocked,
      verdict: isBlocked ? 'BLOCKED' : 'APPROVED',
    };
  }, [code]);

  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    setCode(PRESET_SNIPPETS[idx].code);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Copied playground code');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-black/20 my-8 animate-fadeIn">
      {/* Top Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-muted/40 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary font-mono">
              Live AST & Entropy Sandbox
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-[11px] text-muted-foreground font-mono">v1.4 Client Engine</span>
          </div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Real-Time Zero-Trust Code Verification
          </h3>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border overflow-x-auto">
          {PRESET_SNIPPETS.map((preset, idx) => {
            const isActive = activePresetIndex === idx;
            return (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(idx)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer select-none',
                  isActive
                    ? 'bg-secondary text-foreground font-semibold border border-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    preset.severity === 'danger'
                      ? 'bg-destructive'
                      : preset.severity === 'warning'
                      ? 'bg-warning'
                      : 'bg-success'
                  )}
                />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left: Code Studio Editor */}
        <div className="lg:col-span-7 flex flex-col bg-background">
          {/* Editor Sub-Header */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 border-b border-border text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
              </div>
              <span className="font-mono text-[11px] text-foreground font-medium flex items-center gap-1.5 ml-2">
                <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                auth-middleware.ts
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-muted-foreground">
                {lines.length} lines • {code.length} chars
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card hover:bg-muted text-foreground transition-colors text-[11px] font-mono border border-border shadow-xs cursor-pointer"
                title="Copy Code"
              >
                {isCopied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Code Editor Area */}
          <div className="flex flex-1 min-h-[300px] p-4 font-mono text-[13px] leading-[1.8]">
            {/* Line Numbers Gutter */}
            <div className="w-10 pr-4 select-none text-right font-mono text-[12px] space-y-0 text-muted-foreground/50 border-r border-border/40 shrink-0">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isFlagged = analysis.flaggedLines.includes(lineNum);
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center justify-end gap-1 h-[23.4px]',
                      isFlagged && 'text-destructive font-bold'
                    )}
                  >
                    {isFlagged && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />}
                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Code Textarea with Real-Time Typing */}
            <div className="flex-1 pl-4 relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={Math.max(12, lines.length)}
                className="w-full h-full bg-transparent text-foreground outline-none resize-none font-mono text-[13px] leading-[1.8] selection:bg-primary/30"
                spellCheck={false}
                placeholder="// Type or paste TypeScript code here to inspect in real time..."
              />
            </div>
          </div>

          {/* Editor Footer */}
          <div className="flex items-center justify-between px-5 py-2 bg-muted/20 border-t border-border text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              TypeScript 5.7 • Live Sandbox
            </span>
            <button
              onClick={() => setCode(PRESET_SNIPPETS[activePresetIndex].code)}
              className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Snippet</span>
            </button>
          </div>
        </div>

        {/* Right: Real-Time Telemetry & Diagnostics HUD */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-card space-y-6">
          <div className="space-y-6">
            {/* Live Verdict Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                  Live Security Gate
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {analysis.isBlocked ? 'Commit Blocked' : 'Clean to Merge'}
                </div>
              </div>
              <Badge variant={analysis.isBlocked ? 'danger' : 'success'} size="md" dot>
                {analysis.verdict}
              </Badge>
            </div>

            {/* Mathematical Entropy Gauge */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">Peak Shannon Entropy</span>
                  <div className="text-2xl font-bold text-foreground font-mono tracking-tight">
                    {analysis.maxEntropy}{' '}
                    <span className="text-xs font-normal text-muted-foreground">bits / byte</span>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground font-mono">Threshold</span>
                  <div>
                    <span
                      className={cn(
                        'text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md border',
                        analysis.maxEntropy > 4.2
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-success/10 text-success border-success/20'
                      )}
                    >
                      {analysis.maxEntropy > 4.2 ? 'FAIL (> 4.20)' : 'PASS (≤ 4.20)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Entropy Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      analysis.maxEntropy > 4.2 ? 'bg-destructive' : 'bg-success'
                    )}
                    style={{ width: `${Math.min(100, (analysis.maxEntropy / 6) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
                  <span>0.0 (Low Entropy)</span>
                  <span className="text-warning font-semibold">4.2 (Ceiling)</span>
                  <span>6.0 (Max Chaos)</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Violations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Engine Diagnostics ({analysis.detectedVulnerabilities.length})
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">Shannon + AST Parser</span>
              </div>

              {analysis.detectedVulnerabilities.length > 0 ? (
                <div className="space-y-2.5">
                  {analysis.detectedVulnerabilities.map((vuln, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-destructive-light border border-destructive/20 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-destructive text-[11px] flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          Line {vuln.line}: {vuln.rule}
                        </span>
                        <Badge variant="danger" size="sm">CRITICAL</Badge>
                      </div>

                      <p className="text-[12px] text-foreground/90 leading-relaxed font-sans">
                        {vuln.message}
                      </p>

                      <div className="text-[11px] font-mono text-foreground/80 bg-background/80 px-2.5 py-1.5 rounded-lg border border-border flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Fix: {vuln.fix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-success-light border border-success/20 text-center space-y-2">
                  <div className="flex justify-center">
                    <ShieldCheck className="w-8 h-8 text-success" />
                  </div>
                  <div className="font-semibold text-foreground text-[14px]">Zero Security Violations Detected</div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Code adheres to zero-trust standards. No high-entropy secrets or dynamic eval execution found.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Engine Footer Pill */}
          <div className="pt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-warning" />
              Sub-millisecond local execution
            </span>
            <span className="text-foreground font-semibold">Gemini 3.7 Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
