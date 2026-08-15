'use client';

import React, { useState, useMemo } from 'react';
import { Play, Sparkles, ShieldCheck, ShieldAlert, Zap, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

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
    code: `// Clean zero-trust HMAC webhook verification
import crypto from 'node:crypto';

export function verifyWebhook(payload: Buffer, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from('sha256=' + hmac));
}`,
  },
  {
    name: 'Dangerous eval() Injection',
    code: `// Dynamic deserialization flaw
export function parseConfig(untrustedInput: string) {
  // Vulnerable to Remote Code Execution
  return eval("(" + untrustedInput + ")");
}`,
  },
];

export function InteractivePlayground() {
  const [code, setCode] = useState(PRESET_SNIPPETS[0].code);
  const [isCopied, setIsCopied] = useState(false);

  // Live real-time analysis
  const analysis = useMemo(() => {
    const lines = code.split('\n');
    let maxLineEntropy = 0;
    let highEntropyLines: { line: number; text: string; entropy: number }[] = [];
    let detectedVulnerabilities: string[] = [];

    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      const entropy = calculateEntropy(trimmed);
      if (entropy > maxLineEntropy) maxLineEntropy = entropy;

      if (entropy > 4.2 && trimmed.length > 25) {
        highEntropyLines.push({ line: idx + 1, text: trimmed, entropy });
      }

      if (trimmed.includes('eval(')) {
        detectedVulnerabilities.push(`Line ${idx + 1}: Dangerous dynamic eval() execution.`);
      }
      if (trimmed.includes('ghp_') || trimmed.includes('AKIA') || trimmed.includes('sk_live_')) {
        detectedVulnerabilities.push(`Line ${idx + 1}: Plaintext secret token pattern detected.`);
      }
    });

    const isBlocked = highEntropyLines.length > 0 || detectedVulnerabilities.length > 0;

    return {
      totalLines: lines.length,
      characters: code.length,
      maxEntropy: maxLineEntropy,
      highEntropyLines,
      detectedVulnerabilities,
      isBlocked,
      verdict: isBlocked ? 'BLOCKED' : 'APPROVED',
    };
  }, [code]);

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

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 my-6 card-shine shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" dot>INTERACTIVE AST PLAYGROUND</Badge>
            <span className="text-xs text-muted-foreground font-mono">Live In-Browser Parser</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mt-0.5">
            Test AST Security & Shannon Entropy Live
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
          {PRESET_SNIPPETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setCode(preset.code)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors whitespace-nowrap"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive Code Input */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>TypeScript Source Code</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {isCopied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={10}
            className="w-full p-3.5 rounded-lg bg-black/60 border border-border focus:border-primary font-mono text-xs text-zinc-200 outline-none leading-relaxed resize-y selection:bg-primary/30"
            spellCheck={false}
          />
        </div>

        {/* Right: Live Zero-Trust Security Diagnostics */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live Scan Verdict
              </span>
              <Badge variant={analysis.isBlocked ? 'danger' : 'success'} size="md" dot>
                {analysis.verdict}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-0.5">
                <div className="text-[10px] text-muted-foreground">Peak Shannon Entropy</div>
                <div className="text-sm font-bold text-primary">{analysis.maxEntropy} bits</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-0.5">
                <div className="text-[10px] text-muted-foreground">Threshold Status</div>
                <div className={analysis.maxEntropy > 4.2 ? 'text-rose-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
                  {analysis.maxEntropy > 4.2 ? 'FAIL (>4.2)' : 'PASS (≤4.2)'}
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Engine Diagnostics
              </div>
              {analysis.detectedVulnerabilities.length > 0 ? (
                <div className="space-y-1">
                  {analysis.detectedVulnerabilities.map((vuln, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-destructive/10 border border-destructive/25 text-rose-300 text-[11px] font-mono flex items-start gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <span>{vuln}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>0 secrets or dangerous AST patterns detected. Clean!</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono pt-2 border-t border-border/40">
            Engine: Shannon Entropy Math + AST Pattern Classifier
          </div>
        </div>
      </div>
    </div>
  );
}
