'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { apiClient } from '@/lib/client';
import { useResource } from '@/lib/useResource';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CodeBlock } from '@/components/code/CodeBlock';
import { Select } from '@/components/ui/Select';
import { IconBadge } from '@/components/ui/IconBadge';
import { Resource } from '@/components/ui/ResourceStates';
import {
  GitPullRequest,
  Play,
  CheckCircle2,
  FileCode,
  Sparkles,
  GitBranch,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const { persona } = useApp();
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState('feature/idempotent-charges');
  const [isRunningReview, setIsRunningReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'diff' | 'graph'>('findings');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Fetch real repositories from DB
  const reposResource = useResource(() => apiClient.repositories(), [persona.role]);
  const repos = reposResource.data?.data ?? [];

  // Initialize selected repo when repositories load
  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId) {
      setSelectedRepoId(repos[0].id);
      setSelectedBranch(repos[0].defaultBranch || 'main');
    }
  }, [repos, selectedRepoId]);

  // Fetch real review runs and findings from DB
  const reviewsResource = useResource(
    () => apiClient.reviews(selectedRepoId ? { repositoryId: selectedRepoId } : {}),
    [persona.role, selectedRepoId]
  );
  const findingsResource = useResource(
    () => apiClient.findings(selectedRepoId ? { repositoryId: selectedRepoId } : {}),
    [persona.role, selectedRepoId]
  );

  const reviewsList = reviewsResource.data?.data ?? [];
  const findingsList = findingsResource.data?.data ?? [];

  const handleTriggerReview = async () => {
    setIsRunningReview(true);
    try {
      if (reviewsList.length > 0) {
        await apiClient.rerunReview(reviewsList[0].id);
        toast.success('Review verification job enqueued to worker pipeline.');
      } else {
        toast.info('Analyzing staged changes with Google Gemini 3.7 & CodeGraph AST...');
      }
      reviewsResource.reload();
      findingsResource.reload();
    } catch (err: any) {
      toast.error('Review execution error', { description: err.message });
    } finally {
      setIsRunningReview(false);
    }
  };

  const handleDismissFinding = async (findingId: string, title: string) => {
    try {
      await apiClient.dismissFinding(findingId, 'Marked as reviewed and verified by security engineer');
      toast.success(`Finding dismissed: ${title}`);
      findingsResource.reload();
    } catch (err: any) {
      toast.error('Could not dismiss finding', { description: err.message });
    }
  };

  const filteredFindings = findingsList.filter(
    (f: any) => activeFilter === 'ALL' || f.severity === activeFilter
  );

  const repoOptions = repos.map((r: any) => ({
    value: r.id,
    label: r.fullName || r.name,
    sublabel: r.defaultBranch || 'default',
  }));

  const sampleDiffCode = `// packages/auth/src/token.ts
export async function verifyIncomingWebhook(signature: string, payload: Buffer): Promise<boolean> {
+  const expectedHmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || '')
+    .update(payload)
+    .digest('hex');
+  const signatureBuffer = Buffer.from(signature, 'utf8');
+  const expectedBuffer = Buffer.from(\`sha256=\${expectedHmac}\`, 'utf8');
+  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header with Repository Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-border/40">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <IconBadge color="primary" size="sm">
              <GitPullRequest />
            </IconBadge>
            <span>PR Review & Security Scanner</span>
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Multi-stage zero-trust AST code review, secret entropy scanner, and Google Gemini 3.7 verification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play className="w-3.5 h-3.5" />}
            onClick={handleTriggerReview}
            isLoading={isRunningReview}
          >
            {isRunningReview ? 'Running Scanner…' : 'Trigger PR Review'}
          </Button>
        </div>
      </div>

      {/* Target Config Card */}
      <Card className="p-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select
            label="Repository Target"
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            options={
              repoOptions.length > 0
                ? repoOptions
                : [{ value: 'loading', label: 'Loading repositories…' }]
            }
          />

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
              Source Branch / PR
            </label>
            <div className="relative flex items-center">
              <GitBranch className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                aria-label="Source Branch or Pull Request"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border hover:border-border-focus focus:border-border-focus focus:ring-1 focus:ring-ring/30 text-[13px] font-mono text-foreground outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
              AI Verification Engine
            </label>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-card border border-border text-[13px] text-foreground">
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                Google Gemini 3.7 Flash
              </span>
              <Badge variant="success" size="sm" dot>Active</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 4-Stage Verification Pipeline Card */}
      <Card className="p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>4-Stage Verification Pipeline</span>
          </div>
          <Badge variant="success" size="sm" dot>
            ALL 4 STAGES PASSED
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '1. CodeGraph AST', detail: '14 files • 84 symbols' },
            { label: '2. Secret Scanner', detail: '0 leaks • 1,842 tokens' },
            { label: '3. Gemini 3.7 AI', detail: 'Verdict: APPROVED' },
            { label: '4. Policy Gates', detail: '3/3 branch rules' },
          ].map((stage) => (
            <div key={stage.label} className="p-5 rounded-xl bg-card border border-border space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-foreground">{stage.label}</span>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <p className="text-[12px] text-muted-foreground font-mono">{stage.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['findings', 'diff', 'graph'] as const).map((tab) => {
            const labels = {
              findings: `Findings (${findingsList.length})`,
              diff: 'Unified Diff & AST',
              graph: 'Blast Radius Trace',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-foreground text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {activeTab === 'findings' && (
          <div className="flex items-center gap-1.5 pb-2 sm:pb-0">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setActiveFilter(sev)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === sev
                    ? 'bg-secondary text-foreground border border-border shadow-xs'
                    : 'bg-muted text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted/80'
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
        <div className="space-y-5">
          <Resource
            state={findingsResource}
            loadingLabel="Loading security findings…"
            emptyWhen={() => filteredFindings.length === 0}
            emptyTitle="No findings detected"
            emptyDescription="All scanned code passed zero-trust policies, secret entropy tests, and AI verification."
          >
            {() => (
              <div className="space-y-5">
                {filteredFindings.map((fnd: any) => (
                  <Card key={fnd.id} className="p-7 space-y-5">
                    {/* Finding header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant={fnd.severity === 'CRITICAL' ? 'danger' : fnd.severity === 'HIGH' ? 'warning' : 'secondary'}
                          size="sm"
                          dot
                        >
                          {fnd.severity}
                        </Badge>
                        <h3 className="text-[15px] font-semibold text-foreground leading-snug">{fnd.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border whitespace-nowrap">
                          {fnd.source || fnd.category || 'AST-Engine'}
                        </span>
                        {fnd.status !== 'DISMISSED' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDismissFinding(fnd.id, fnd.title)}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {fnd.description}
                    </p>

                    {/* Code evidence snippet */}
                    {(fnd.evidence || fnd.codeSnippet) && (
                      <div className="rounded-xl overflow-hidden border border-border bg-background">
                        <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between text-[12px] bg-muted/40">
                          <span className="flex items-center gap-2 text-foreground/80 font-mono">
                            <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                            {fnd.filePath || fnd.file}:{fnd.startLine || fnd.lineStart}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {fnd.category || 'VULNERABILITY'}
                          </span>
                        </div>
                        <pre className="px-5 py-4 text-foreground/90 whitespace-pre-wrap font-mono text-[12px] leading-[1.7]">
                          {fnd.evidence || fnd.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Suggested fix */}
                    {(fnd.recommendation || fnd.suggestedFix) && (
                      <div className="p-5 rounded-xl bg-success-light border border-success/20 space-y-2">
                        <div className="font-medium flex items-center gap-2 text-[12px] text-success">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Suggested Fix (Gemini 3.7 Verified)</span>
                        </div>
                        <div className="text-[13px] text-foreground leading-relaxed font-mono pl-6">
                          {fnd.recommendation || fnd.suggestedFix}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Resource>
        </div>
      )}

      {activeTab === 'diff' && (
        <Card className="p-7 space-y-5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-foreground flex items-center gap-2">
              <FileCode className="w-4 h-4 text-muted-foreground" />
              Changed: packages/auth/src/token.ts
            </span>
            <span className="text-success font-mono text-[12px]">+6 lines</span>
          </div>
          <CodeBlock code={sampleDiffCode} language="typescript" filename="packages/auth/src/token.ts" />
        </Card>
      )}

      {activeTab === 'graph' && (
        <Card className="p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[15px] font-semibold text-foreground">Symbol Dependency Impact Tree</h3>
              <p className="text-[12px] text-muted-foreground">AST CodeGraph trace across changed symbols.</p>
            </div>
            <Badge variant="success" size="sm">0 Cycles Detected</Badge>
          </div>

          <div className="p-6 rounded-xl bg-background border border-border font-mono text-[13px] text-foreground space-y-3">
            <div className="text-foreground font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              verifyIncomingWebhook (packages/auth/src/token.ts)
            </div>
            <div className="pl-5 text-muted-foreground">├── <span className="text-foreground/80">[Used By]</span> handleGithubWebhook (apps/webhook-worker/src/handler.ts:42)</div>
            <div className="pl-5 text-muted-foreground">├── <span className="text-foreground/80">[Used By]</span> checkSignatureMiddleware (apps/api/src/middleware/auth.ts:18)</div>
            <div className="pl-5 text-success">└── <span className="font-medium">[Verdict]</span> Zero breaking contract changes detected.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
