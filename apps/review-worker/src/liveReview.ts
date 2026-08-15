import { githubProvider } from '@codeguard/github';
import { parseUnifiedDiff, SymbolExtractor } from '@codeguard/code-parser';
import type { DiffFile, DiffHunk, DiffLine } from '@codeguard/code-parser';
import { securityOrchestrator } from '@codeguard/security-scanner';
import { CodeGraphStore } from '@codeguard/code-graph';
import { HybridRetriever } from '@codeguard/retrieval';
import { geminiReviewClient } from '@codeguard/ai-reviewer';
import { AiVerifier } from '@codeguard/ai-verifier';
import { PolicyEngine } from '@codeguard/policy-engine';
import type { Finding, Policy } from '@codeguard/types';
import { formatReviewSummaryMarkdown } from './processor.js';

async function reviewExistingPR(installationId: string, owner: string, repo: string, prNumber: number, headSha: string): Promise<void> {
  console.log(`\n🔍 Fetching details & diff for [${owner}/${repo}#${prNumber}]...`);

  // 1. Fetch raw diff
  const rawDiff = await githubProvider.fetchPullRequestDiff(installationId, owner, repo, prNumber);
  const parsedDiff = parseUnifiedDiff(rawDiff);
  console.log(`   - Changed Files: ${parsedDiff.files.length}`);
  console.log(`   - Additions: +${parsedDiff.totalAdditions} | Deletions: -${parsedDiff.totalDeletions}`);

  // 2. Create GitHub Check Run (in_progress)
  console.log('\n⚡ Creating GitHub Check Run: "CodeGuard Security & Review"...');
  let checkRunId: number | undefined;
  try {
    const res = await githubProvider.createCheckRun(installationId, owner, repo, {
      name: 'CodeGuard Security & Review',
      headSha,
      status: 'in_progress',
      title: 'CodeGuard is analyzing PR changes...',
      summary: 'Running secret scans, SAST checks, dependency analysis, AST context graph, and Google Gemini review.'
    });
    checkRunId = res.checkRunId;
    console.log(`   ✅ Check Run ID: ${checkRunId}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('   ℹ️ Check Run Note:', msg);
  }

  // 3. Deterministic Security Scanners (Now with template & placeholder exclusions)
  console.log('\n🔍 Running Deterministic Scanners (Secrets, SAST, Dependencies)...');
  const filesToScan = parsedDiff.files.map((f: DiffFile) => ({
    filePath: f.newPath,
    content: f.hunks.flatMap((h: DiffHunk) => h.lines.map((l: DiffLine) => l.content)).join('\n')
  }));

  const deterministicFindings = securityOrchestrator.scanFiles(
    filesToScan,
    'org-beyondCode',
    `${owner}/${repo}`,
    `pr-${prNumber}`,
    `run-${checkRunId || 1}`
  );
  console.log(`   ✅ Found ${deterministicFindings.length} deterministic finding(s)`);

  // 4. AST & Context Assembly
  console.log('\n🌳 Extracting AST Symbols & Call Graph Context...');
  const graphStore = new CodeGraphStore();
  const extractedSymbols = filesToScan.flatMap((f: { filePath: string; content: string }) => SymbolExtractor.extractSymbols(f.filePath, f.content));

  const activePolicies: Policy[] = [
    {
      id: 'pol-default',
      organizationId: 'org-beyondCode',
      name: 'Standard Security & Quality Policy',
      version: '1.0.0',
      level: 'ORGANIZATION',
      isDefault: true,
      enabled: true,
      rules: [
        { id: 'r1', policyId: 'pol-default', name: 'Block Secrets', ruleType: 'SECRET_BLOCK', condition: {}, action: 'BLOCK', enabled: true },
        { id: 'r2', policyId: 'pol-default', name: 'Block Critical Issues', ruleType: 'SEVERITY_THRESHOLD', condition: { minSeverity: 'CRITICAL' }, action: 'BLOCK', enabled: true }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const assembledContext = HybridRetriever.assembleContext(
    parsedDiff.files.map((f: DiffFile) => ({ path: f.newPath, status: f.status, additions: f.additions, deletions: f.deletions })),
    extractedSymbols,
    graphStore,
    activePolicies
  );

  // 5. Google Gemini AI Reviewer (Fast direct REST fetch with Gemini 3.7 Flash)
  console.log('\n🤖 Running Google Gemini Reviewer with Direct REST Fetch...');
  const aiResponse = await geminiReviewClient.reviewPullRequest(
    `PR #${prNumber} on ${owner}/${repo}`,
    'Full repository PR review',
    rawDiff.slice(0, 10000),
    assembledContext.formattedPromptContext,
    parsedDiff.files.map((f: DiffFile) => f.newPath)
  );

  const candidateAiFindings: Finding[] = (aiResponse.findings as Array<any>).map((f: any, idx: number) => ({
    id: `ai-${idx}`,
    organizationId: 'org-beyondCode',
    repositoryId: `${owner}/${repo}`,
    pullRequestId: `pr-${prNumber}`,
    fingerprint: `fp-ai-${f.filePath}-${f.startLine}`,
    severity: f.severity,
    category: f.category,
    source: 'AI',
    title: f.title,
    description: f.title,
    filePath: f.filePath,
    startLine: f.startLine,
    endLine: f.endLine,
    evidence: f.evidence,
    impact: f.impact,
    recommendation: f.recommendation,
    suggestion: f.suggestion || null,
    confidence: f.confidence,
    blocking: f.severity === 'CRITICAL' || f.severity === 'HIGH',
    status: 'OPEN',
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const changedFilesMap = new Map<string, number[]>();
  for (const f of parsedDiff.files) {
    changedFilesMap.set(f.newPath, f.changedLineNumbers);
  }

  const { verifiedFindings } = AiVerifier.verifyFindings(candidateAiFindings, changedFilesMap);
  const allFindings = [...deterministicFindings, ...verifiedFindings];

  // 6. Policy Evaluation
  const policyResult = PolicyEngine.evaluate(activePolicies[0], allFindings);
  const isBlocked = policyResult.outcome === 'BLOCK';

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const f of allFindings) {
    if (f.severity === 'CRITICAL') criticalCount++;
    else if (f.severity === 'HIGH') highCount++;
    else if (f.severity === 'MEDIUM') mediumCount++;
    else lowCount++;
  }

  const summaryMarkdown = formatReviewSummaryMarkdown(
    isBlocked,
    policyResult.outcome,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    aiResponse.summary,
    aiResponse.keyChanges || [],
    aiResponse.prChangelogMarkdown || '',
    policyResult.reasons,
    allFindings,
    parsedDiff.files,
    parsedDiff.totalAdditions,
    parsedDiff.totalDeletions
  );

  // 7. Update Check Run
  if (checkRunId) {
    console.log('\n📋 Updating GitHub Check Run conclusion...');
    await githubProvider.updateCheckRun(installationId, owner, repo, checkRunId, {
      status: 'completed',
      conclusion: isBlocked ? 'failure' : 'success',
      title: isBlocked ? `Blocked (${criticalCount} Critical, ${highCount} High)` : 'Passed all security & quality policies',
      summary: summaryMarkdown
    });
    console.log('   ✅ Check Run updated on GitHub!');
  }

  // 8. Post Review & 1-Click Code Suggestions to PR
  console.log('\n💬 Posting Review Feedback with 1-Click Code Suggestions to GitHub PR...');
  const inlineComments = allFindings
    .filter((f: Finding) => f.filePath && f.startLine > 0)
    .slice(0, 5)
    .map((f: Finding) => {
      let commentBody = `**[CodeGuard ${f.severity}] ${f.title}**\n\n${f.description}\n\n*Recommendation:* ${f.recommendation || 'Please review and remediate.'}`;
      if (f.suggestion) {
        commentBody += `\n\n\`\`\`suggestion\n${f.suggestion}\n\`\`\``;
      }
      return {
        path: f.filePath,
        line: f.startLine,
        body: commentBody
      };
    });

  try {
    await githubProvider.createReview(
      installationId,
      owner,
      repo,
      prNumber,
      isBlocked ? 'REQUEST_CHANGES' : 'COMMENT',
      summaryMarkdown,
      inlineComments
    );
    console.log('   ✅ PR Review summary & inline suggestions posted on GitHub!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('   ℹ️ Review comment note:', msg);
  }

  console.log('\n================================================================');
  console.log(`🎉 LIVE REVIEW COMPLETED FOR PR #${prNumber}!`);
  console.log(`🔗 PR Link: https://github.com/${owner}/${repo}/pull/${prNumber}`);
  console.log('================================================================\n');
}

// Review PR #73 on beyondCode-in/CollabAI
reviewExistingPR('153715332', 'beyondCode-in', 'CollabAI', 73, 'HEAD').catch(console.error);
