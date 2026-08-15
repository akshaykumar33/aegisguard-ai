'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { api, MOCK_STATS } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CodeBlock } from '@/components/code/CodeBlock';
import {
  GitPullRequest,
  Play,
  CheckCircle2,
  FileCode,
  Sparkles,
  GitBranch,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const { setIsBreakGlassModalOpen } = useApp();
  const [selectedRepo, setSelectedRepo] = useState('acme/payments-service');
  const [selectedBranch, setSelectedBranch] = useState('feature/idempotent-charges');
  const [selectedModel] = useState('Google Gemini 3.7 Flash');
  const [isRunningReview, setIsRunningReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'diff' | 'graph'>('findings');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  const [reviewsList, setReviewsList] = useState(MOCK_STATS.recentReviews);
  const [findingsList] = useState(MOCK_STATS.recentFindings);

  const handleTriggerReview = async () => {
    setIsRunningReview(true);
    toast.info(`Triggering Gemini 3.7 AST Review on ${selectedRepo}...`);

    setTimeout(async () => {
      const newReview = await api.runReviewSimulation(selectedRepo, selectedBranch, selectedModel);
      setReviewsList((prev) => [newReview, ...prev]);
      setIsRunningReview(false);
      toast.success(`AI Code Review completed with verdict: ${newReview.verdict}`);
    }, 1200);
  };

  const filteredFindings = findingsList.filter(
    (f) => activeFilter === 'ALL' || f.severity === activeFilter
  );

  const sampleDiffCode = `// packages/auth/src/token.ts
export async function verifyIncomingWebhook(signature: string, payload: Buffer): Promise<boolean> {
+  const expectedHmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || '')
+    .update(payload)
+    .digest('hex');
+  
+  // Cryptographic constant-time equality check to prevent timing attacks
+  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from('sha256=' + expectedHmac));
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-primary" />
            <span>PR Review & Security Scanner</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Continuous zero-trust AST parsing, Google Gemini 3.7 PR verification, and automated branch protection gates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Flame className="w-3.5 h-3.5" />}
            onClick={() => setIsBreakGlassModalOpen(true)}
          >
            Emergency Break-Glass
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isRunningReview}
            leftIcon={<Play className="w-3.5 h-3.5" />}
            onClick={handleTriggerReview}
          >
            Run Review Now
          </Button>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="p-4 space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live Review Configuration
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Repository Target
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-input border border-border focus:border-ring text-xs font-mono text-foreground outline-none transition-colors"
            >
              <option value="acme/payments-service">acme/payments-service (Primary API)</option>
              <option value="acme/auth-gateway">acme/auth-gateway (OAuth & Zero-Trust)</option>
              <option value="acme/customer-portal">acme/customer-portal (React 19 App)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Source Branch / PR
            </label>
            <div className="relative">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-input border border-border focus:border-ring text-xs font-mono text-foreground outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              AI Engine
            </label>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-input border border-border text-xs text-foreground font-mono">
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <Sparkles className="w-3 h-3" />
                Google Gemini 3.7 Flash
              </span>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-px">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('findings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'findings'
                ? 'border-primary text-foreground font-semibold bg-muted/40'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Findings ({findingsList.length})
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'diff'
                ? 'border-primary text-foreground font-semibold bg-muted/40'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            AST Diff
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'graph'
                ? 'border-primary text-foreground font-semibold bg-muted/40'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Code Graph Trace
          </button>
        </div>

        {activeTab === 'findings' && (
          <div className="flex items-center gap-1">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setActiveFilter(sev)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                  activeFilter === sev
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'findings' && (
        <div className="space-y-3">
          {filteredFindings.map((fnd) => (
            <Card key={fnd.id} className="p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={fnd.severity === 'CRITICAL' ? 'danger' : fnd.severity === 'HIGH' ? 'warning' : 'secondary'}
                    size="sm"
                  >
                    {fnd.severity}
                  </Badge>
                  <h3 className="text-xs font-semibold text-foreground">{fnd.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span>{fnd.category}</span>
                  <Badge variant="primary" size="sm">
                    {fnd.tool}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {fnd.description}
              </p>

              {fnd.codeSnippet && (
                <div className="rounded-lg overflow-hidden border border-border bg-black/40 p-3 font-mono text-xs text-zinc-300">
                  <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-primary" />
                    <span>{fnd.file}:{fnd.lineStart}</span>
                  </div>
                  <pre className="text-rose-300 whitespace-pre-wrap">{fnd.codeSnippet}</pre>
                </div>
              )}

              {fnd.suggestedFix && (
                <div className="p-2.5 rounded-lg bg-success/10 border border-success/20 text-xs text-success space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Suggested Fix (Gemini 3.7 Verified)
                  </div>
                  <div className="text-foreground leading-relaxed pl-5 font-mono text-[11px]">
                    {fnd.suggestedFix}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'diff' && (
        <Card className="p-4 space-y-2">
          <div className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Changed: packages/auth/src/token.ts</span>
            <span className="text-success font-mono text-[11px]">+6 lines</span>
          </div>
          <CodeBlock code={sampleDiffCode} language="typescript" filename="packages/auth/src/token.ts" />
        </Card>
      )}

      {activeTab === 'graph' && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Symbol Dependency Impact Tree</h3>
              <p className="text-xs text-muted-foreground">AST CodeGraph trace across changed symbols.</p>
            </div>
            <Badge variant="success" size="sm">0 Cycles Detected</Badge>
          </div>

          <div className="p-3.5 rounded-lg bg-black/40 border border-border font-mono text-xs text-zinc-300 space-y-1.5">
            <div className="text-primary font-bold">● verifyIncomingWebhook (packages/auth/src/token.ts)</div>
            <div className="pl-4 text-zinc-400">├── [Used By] handleGithubWebhook (apps/webhook-worker/src/handler.ts:42)</div>
            <div className="pl-4 text-zinc-400">├── [Used By] checkSignatureMiddleware (apps/api/src/middleware/auth.ts:18)</div>
            <div className="pl-4 text-emerald-400 font-semibold">└── [Verdict] Zero breaking contract changes detected.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
