import { createHash } from 'node:crypto';
import type { Job } from '@codeguard/queue';
import { logger } from '@codeguard/logger';
import { db, reviewRuns, reviewStages, reviewFindings, policies, policyRules, repositories, pullRequests } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import { githubProvider } from '@codeguard/github';
import { parseUnifiedDiff, SymbolExtractor } from '@codeguard/code-parser';
import type { DiffFile, DiffHunk, DiffLine } from '@codeguard/code-parser';
import { securityOrchestrator } from '@codeguard/security-scanner';
import { IncrementalGraphIndexer } from '@codeguard/code-graph';
import type { BlastRadiusReport } from '@codeguard/code-graph';
import { HybridRetriever } from '@codeguard/retrieval';
import { geminiReviewClient } from '@codeguard/ai-reviewer';
import { AiVerifier } from '@codeguard/ai-verifier';
import { PolicyEngine, entitlementEngine, resolveCustomerForOrganization } from '@codeguard/policy-engine';
import type { ReviewJobData, Finding, Policy } from '@codeguard/types';

/**
 * Format an ultra-professional, CodeRabbit / Copilot-grade markdown review summary
 */
export function formatReviewSummaryMarkdown(
  isBlocked: boolean,
  policyOutcome: string,
  criticalCount: number,
  highCount: number,
  mediumCount: number,
  lowCount: number,
  summaryText: string,
  keyChanges: string[],
  prChangelogMarkdown: string,
  policyReasons: string[],
  findings: Finding[],
  files: DiffFile[],
  totalAdditions: number,
  totalDeletions: number,
  callGraphContextSummary?: string
): string {
  const alertType = isBlocked ? 'CAUTION' : 'NOTE';
  const statusColor = isBlocked ? 'EF4444' : '10B981';
  const statusTitle = isBlocked ? 'BLOCKED' : 'APPROVED';
  const totalFindings = criticalCount + highCount + mediumCount + lowCount;

  // Header badges
  const badges = [
    `![CodeGuard Status](https://img.shields.io/badge/CodeGuard-${statusTitle}-${statusColor}?style=for-the-badge&logo=shield)`,
    `![Model](https://img.shields.io/badge/Reasoning-Gemini_3.7_Flash-4285F4?style=for-the-badge&logo=google)`,
    `![Files](https://img.shields.io/badge/Files_Analyzed-${files.length}_(+${totalAdditions}/-${totalDeletions})-6366F1?style=for-the-badge)`
  ].join(' ');

  const statusHeadline = isBlocked
    ? `### 🚨 Merge Blocked &mdash; Critical Policy Violations Detected\n> Action is required on ${criticalCount + highCount} blocking issue(s) before merging.`
    : `### ✅ CodeGuard Review Passed &mdash; Ready for Merge\n> All deterministic security scans, architectural quality gates, and AI safety checks satisfied.`;

  // Pillar counts
  const securityFindings = findings.filter((f) => f.category === 'SECURITY' || f.category === 'SECRET' || f.category === 'SAST');
  const perfFindings = findings.filter((f) => f.category === 'PERFORMANCE');
  const archFindings = findings.filter((f) => f.category === 'ARCHITECTURE');
  const qualityFindings = findings.filter((f) => f.category === 'CODE_QUALITY' || f.category === 'LOGIC');
  const testFindings = findings.filter((f) => f.category === 'TESTS');

  const scorecardTable = `| 🛡️ Security Gate | ⚡ Performance | 🏗️ Architecture | 🧹 Code Quality | 🧪 Test Coverage | 📁 Changes Analyzed |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **${securityFindings.length === 0 ? '🟢 0 Vulnerabilities' : `🔴 ${securityFindings.length} Issue(s)`}** | **${perfFindings.length === 0 ? '🟢 Optimal' : `🟡 ${perfFindings.length} Suggestion(s)`}** | **${archFindings.length === 0 ? '🟢 Clean' : `🔵 ${archFindings.length} Enhancement(s)`}** | **${qualityFindings.length === 0 ? '🟢 Verified' : `ℹ️ ${qualityFindings.length} Note(s)`}** | **${testFindings.length === 0 ? '🟢 Intact' : `🟡 ${testFindings.length} Request(s)`}** | **${files.length} Files (+${totalAdditions}/-${totalDeletions})** |`;

  // Key highlights
  const keyChangesSection = keyChanges && keyChanges.length > 0
    ? `\n### 💡 Key Highlights & Architectural Changes\n${keyChanges.map((k) => `- ${k}`).join('\n')}\n`
    : '';

  // PR Documentation & Rationale Section
  const changelogSection = prChangelogMarkdown
    ? `\n<details open>\n<summary><b>📋 PR Change Log & Architectural Rationale</b></summary>\n\n${prChangelogMarkdown}\n\n> [!TIP]\n> **Repository Knowledge:** Keep this rationale in \`CHANGELOG.md\` or \`.codeguard/architecture.md\` to preserve context for future reviews.\n\n</details>\n`
    : '';

  // Call graph context if available
  const graphSection = callGraphContextSummary
    ? `\n<details>\n<summary><b>🧠 Cross-File Architecture & Dependency Impact</b></summary>\n\n${callGraphContextSummary}\n\n</details>\n`
    : '';

  // Policy gates
  const policySection = policyReasons && policyReasons.length > 0
    ? `\n### ⚖️ Enterprise Guardrails & Policy Gates\n${policyReasons.map((r) => `- ${r}`).join('\n')}\n`
    : `\n### ⚖️ Enterprise Guardrails & Policy Gates\n- ✅ All enterprise security, licensing, and code quality policies satisfied.\n`;

  // Actionable findings categorized by pillar
  let detailedFindingsSection = '';
  if (findings.length > 0) {
    const findingsList = findings.slice(0, 8).map((f, i) => {
      const icon = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '⚠️' : f.severity === 'MEDIUM' ? '🟡' : 'ℹ️';
      const categoryLabel = f.category === 'SECURITY' || f.category === 'SECRET' || f.category === 'SAST'
        ? '🛡️ Security'
        : f.category === 'PERFORMANCE'
        ? '⚡ Performance'
        : f.category === 'ARCHITECTURE'
        ? '🏗️ Architecture'
        : '🧹 Code Quality';

      let card = `<details ${i === 0 ? 'open' : ''}>\n<summary><b>${icon} [${f.severity}] ${categoryLabel}: ${f.title} &mdash; <code>${f.filePath}:${f.startLine}</code></b></summary>\n\n`;
      if (f.impact) {
        card += `> **Impact Analysis:** ${f.impact}\n\n`;
      }
      if (f.recommendation) {
        card += `**Remediation:** ${f.recommendation}\n\n`;
      }
      if (f.evidence) {
        card += `\`\`\`${f.filePath.endsWith('.ts') || f.filePath.endsWith('.js') ? 'typescript' : f.filePath.endsWith('.json') ? 'json' : ''}\n// Line ${f.startLine}:\n${f.evidence}\n\`\`\`\n\n`;
      }
      if (f.suggestion) {
        card += `**1-Click Suggested Fix:**\n\`\`\`suggestion\n${f.suggestion}\n\`\`\`\n`;
      }
      card += `</details>\n`;
      return card;
    }).join('\n');

    detailedFindingsSection = `\n### 🔍 Actionable Code Improvements & Fixes (${findings.length})\n\n${findingsList}\n`;
  }

  // Changed files table
  const filesTable = `\n<details>\n<summary><b>📁 Changed Files Breakdown (${files.length} files &bull; +${totalAdditions} / -${totalDeletions})</b></summary>\n\n| File | Status | Additions | Deletions |\n|:---|:---:|:---:|:---:|\n${files.slice(0, 30).map((f) => `| \`${f.newPath}\` | \`${f.status.toUpperCase()}\` | \`+${f.additions}\` | \`-${f.deletions}\` |`).join('\n')}\n\n</details>\n`;

  return `# 🛡️ CodeGuard AI &bull; Pull Request Intelligence

${badges}

> [!${alertType}]
> ${statusHeadline}

---

### 📊 Review Overview & Scorecard

${scorecardTable}

---

### 📝 Executive Summary
${summaryText || 'The pull request was analyzed using deterministic security scanners and Google Gemini reasoning model.'}
${keyChangesSection}
${changelogSection}
${graphSection}
${policySection}
${detailedFindingsSection}
${filesTable}
---
<sub>⚡ Powered by **CodeGuard AI** &bull; Enterprise Code Intelligence & Zero-Trust Reviewer</sub>
`;
}

/**
 * Rebuild the post-merge view of a changed file from its diff hunks.
 *
 * Two properties matter to everything downstream:
 *  - Deleted lines are excluded. Concatenating every hunk line meant a secret you
 *    had just *removed* was reported as a new finding, blocking the very PR that
 *    fixed it.
 *  - Each line is placed at its real line number, so scanner output lines up with
 *    the file on GitHub. Previously line numbers were positions within the
 *    concatenated hunks, which put inline review comments on unrelated lines.
 *
 * Regions outside the hunks are unknown to us and become empty lines; they hold
 * the offsets correct without inventing content.
 */
export function reconstructPostImage(file: DiffFile): string {
  const lines: string[] = [];

  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'del') continue;
      if (line.newLineNumber === undefined) continue;
      lines[line.newLineNumber - 1] = line.content;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === undefined) lines[i] = '';
  }

  return lines.join('\n');
}

/**
 * Render the blast radius for the check run's dependency-impact section.
 *
 * Returns undefined when nothing downstream is affected, so the summary omits
 * the section rather than showing an empty one.
 */
export function formatBlastRadiusSummary(report?: BlastRadiusReport): string | undefined {
  if (!report || report.totalAffectedNodes === 0) return undefined;

  const rows = [
    `| Risk score | **${report.riskScore}/100** |`,
    `| Symbols changed | ${report.changedSymbols.length} |`,
    `| Direct callers | ${report.directCallers.length} |`,
    `| Transitive callers | ${report.transitiveCallers.length} |`,
    `| Dependency depth | ${report.dependencyDepth} |`
  ].join('\n');

  let out = `| Metric | Value |\n| :--- | :--- |\n${rows}\n`;

  if (report.riskFactors.length > 0) {
    out += `\n**Risk factors**\n${report.riskFactors.map((r) => `- ${r}`).join('\n')}\n`;
  }

  if (report.impactedTestFiles.length > 0) {
    out += `\n**Tests covering the affected code**\n${report.impactedTestFiles
      .slice(0, 10)
      .map((f) => `- \`${f}\``)
      .join('\n')}\n`;
  }

  return out;
}

export async function processReviewJob(job: Job<ReviewJobData>): Promise<void> {
  const { organizationId, repositoryId, pullRequestId, prNumber, headSha, baseSha, installationId } = job.data;
  const startTime = Date.now();

  logger.info({ prNumber, headSha, repositoryId }, '⚡ Starting CodeGuard PR Review Execution');

  // 1. Fetch Repository and PR records
  const [repo] = await db.select().from(repositories).where(eq(repositories.id, repositoryId)).limit(1);
  const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.id, pullRequestId)).limit(1);

  if (!repo || !pr) {
    logger.error({ repositoryId, pullRequestId }, 'Repository or Pull Request record not found');
    return;
  }

  // 2. Fetch or Create Review Run
  let [reviewRun] = await db
    .select()
    .from(reviewRuns)
    .where(eq(reviewRuns.pullRequestId, pullRequestId))
    .limit(1);

  if (!reviewRun) {
    [reviewRun] = await db
      .insert(reviewRuns)
      .values({
        organizationId,
        repositoryId,
        pullRequestId,
        commitSha: headSha,
        state: 'FETCHING',
        startedAt: new Date()
      })
      .returning();
  } else {
    await db
      .update(reviewRuns)
      .set({ state: 'FETCHING', commitSha: headSha, startedAt: new Date() })
      .where(eq(reviewRuns.id, reviewRun.id));
  }

  // Helper to record stage progress
  async function recordStage(name: string, fn: () => Promise<any>) {
    const stageStart = Date.now();
    try {
      const result = await fn();
      await db.insert(reviewStages).values({
        reviewRunId: reviewRun.id,
        name: name as any,
        status: 'COMPLETED',
        startedAt: new Date(stageStart),
        completedAt: new Date(),
        durationMs: Date.now() - stageStart
      });
      return result;
    } catch (err: any) {
      await db.insert(reviewStages).values({
        reviewRunId: reviewRun.id,
        name: name as any,
        status: 'FAILED',
        startedAt: new Date(stageStart),
        completedAt: new Date(),
        durationMs: Date.now() - stageStart,
        error: err.message
      });
      throw err;
    }
  }

  const [owner, repoName] = repo.fullName.split('/');

  // 3. Stage 1: GitHub Check Run (IN_PROGRESS)
  let checkRunId: number | undefined;
  if (installationId && owner && repoName) {
    try {
      const checkRes = await githubProvider.createCheckRun(installationId, owner, repoName, {
        name: 'CodeGuard Security & Review',
        headSha,
        status: 'in_progress',
        title: 'Inspecting PR changes & security graph...',
        summary: 'Running deterministic secret scans, SAST, dependency checks, and AI review.'
      });
      checkRunId = checkRes.checkRunId;
    } catch (err) {
      logger.warn({ err }, 'Could not create GitHub check run');
    }
  }

  // 4. Stage 2: Fetch & Parse PR Diff
  let rawDiff = '';
  if (installationId && owner && repoName) {
    try {
      rawDiff = await recordStage('INGESTION', async () => {
        return await githubProvider.fetchPullRequestDiff(installationId, owner, repoName, prNumber);
      });
    } catch {
      rawDiff = '';
    }
  }

  const parsedDiff = parseUnifiedDiff(rawDiff);
  const changedFilesMap = new Map<string, number[]>();
  for (const f of parsedDiff.files) {
    changedFilesMap.set(f.newPath, f.changedLineNumbers);
  }

  // 5. Stage 3: Deterministic Security Scanners (Secrets, SAST, Dependencies)
  const filesToScan = parsedDiff.files.map((f: DiffFile) => ({
    filePath: f.newPath,
    content: reconstructPostImage(f)
  }));

  const deterministicFindings: Finding[] = await recordStage('SECRET_SCAN', async () => {
    return securityOrchestrator.scanFiles(
      filesToScan,
      organizationId,
      repositoryId,
      pullRequestId,
      reviewRun.id
    );
  });

  // 6. Stage 4: Code Graph & Hybrid Context Retrieval
  //
  // The store must be populated before the retriever traverses it. It was
  // previously constructed empty and handed straight to HybridRetriever, so
  // caller/callee lookups always returned nothing and the model never received
  // any cross-file context.
  const indexer = new IncrementalGraphIndexer();
  const indexResult = indexer.indexFilesInMemory(filesToScan);
  const graphStore = indexer.getStore();

  logger.info(
    {
      files: indexResult.totalFiles,
      symbols: indexResult.totalSymbols,
      edges: indexResult.totalEdges,
      durationMs: indexResult.durationMs
    },
    '🧠 Code graph indexed for changed files'
  );

  const extractedSymbols = filesToScan.flatMap((f: { filePath: string; content: string }) => SymbolExtractor.extractSymbols(f.filePath, f.content));
  const changedSymbols = extractedSymbols.filter((s) => {
    const lines = changedFilesMap.get(s.filePath) || [];
    return lines.some((l) => l >= s.startLine && l <= s.endLine);
  });

  // Query active policies from DB
  const rawPolicies = await db.select().from(policies).where(eq(policies.organizationId, organizationId));
  const activePolicies: Policy[] = await Promise.all(
    rawPolicies.map(async (p) => {
      const rules = await db.select().from(policyRules).where(eq(policyRules.policyId, p.id));
      return {
        ...p,
        level: (p.level as any) || 'ORGANIZATION',
        version: p.version || '1.0.0',
        rules: rules.map((r) => ({
          ...r,
          ruleType: r.ruleType as any,
          condition: r.condition as any,
          action: r.action as any
        }))
      };
    })
  );

  const assembledContext = HybridRetriever.assembleContext(
    parsedDiff.files.map((f: DiffFile) => ({ path: f.newPath, status: f.status, additions: f.additions, deletions: f.deletions })),
    changedSymbols,
    graphStore,
    activePolicies
  );

  // 7. Stage 5: AI Reasoning (Google Gemini)
  const aiResponse = await recordStage('AI_ANALYSIS', async () => {
    return await geminiReviewClient.reviewPullRequest(
      pr.title,
      pr.description || '',
      rawDiff || 'No diff available (empty change)',
      assembledContext.formattedPromptContext,
      parsedDiff.files.map((f: DiffFile) => f.newPath)
    );
  });

  // Transform AI findings into typed Finding[]
  const candidateAiFindings: Finding[] = (aiResponse.findings as Array<any>).map((f: any, idx: number) => ({
    id: `ai-finding-${idx}-${Date.now()}`,
    organizationId,
    repositoryId,
    pullRequestId,
    reviewRunId: reviewRun.id,
    // Stable across re-runs so the onConflictDoNothing below actually dedupes.
    // This previously embedded Date.now(), so re-reviewing a PR re-inserted every
    // finding instead of recognising it as already recorded.
    fingerprint: createHash('sha256')
      .update(`${repositoryId}:${f.filePath}:${f.startLine}:${f.category}:${f.title}`)
      .digest('hex')
      .slice(0, 40),
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

  // 8. Stage 6: AI Verification
  const { verifiedFindings } = AiVerifier.verifyFindings(candidateAiFindings, changedFilesMap);

  // 9. Aggregate All Findings
  const allFindings = [...deterministicFindings, ...verifiedFindings];

  // 10. Stage 7: Policy Evaluation
  const defaultPolicy = activePolicies.find((p) => p.isDefault) || activePolicies[0] || {
    id: 'default',
    organizationId,
    name: 'Default Policy',
    isDefault: true,
    enabled: true,
    rules: [
      { id: 'r1', policyId: 'default', name: 'Block Secrets', ruleType: 'SECRET_BLOCK', condition: {}, action: 'BLOCK', enabled: true },
      { id: 'r2', policyId: 'default', name: 'Block Critical', ruleType: 'SEVERITY_THRESHOLD', condition: { minSeverity: 'CRITICAL' }, action: 'BLOCK', enabled: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const policyResult = PolicyEngine.evaluate(defaultPolicy, allFindings);

  // Severity counts
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  for (const f of allFindings) {
    if (f.severity === 'CRITICAL') criticalCount++;
    else if (f.severity === 'HIGH') highCount++;
    else if (f.severity === 'MEDIUM') mediumCount++;
    else if (f.severity === 'LOW') lowCount++;
    else infoCount++;
  }

  const durationMs = Date.now() - startTime;
  const isBlocked = policyResult.outcome === 'BLOCK';
  const finalState = isBlocked ? 'BLOCKED' : 'PASSED';

  // 11. Persist Review Run and Findings to PostgreSQL
  await db
    .update(reviewRuns)
    .set({
      state: finalState,
      policyOutcome: policyResult.outcome,
      summary: aiResponse.summary || policyResult.reasons.join('\n'),
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      durationMs,
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(reviewRuns.id, reviewRun.id));

  // Save findings
  if (allFindings.length > 0) {
    for (const f of allFindings) {
      await db
        .insert(reviewFindings)
        .values({
          organizationId,
          repositoryId,
          pullRequestId,
          reviewRunId: reviewRun.id,
          fingerprint: f.fingerprint,
          severity: f.severity,
          category: f.category,
          source: f.source,
          title: f.title,
          description: f.description,
          filePath: f.filePath,
          startLine: f.startLine,
          endLine: f.endLine,
          evidence: f.evidence,
          impact: f.impact,
          recommendation: f.recommendation,
          ruleId: f.ruleId,
          confidence: f.confidence,
          blocking: f.blocking,
          status: 'OPEN'
        })
        .onConflictDoNothing();
    }
  }

  // 12. Publish Results to GitHub Check Runs & Pull Request Comments
  if (installationId && owner && repoName) {
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
      parsedDiff.totalDeletions,
      formatBlastRadiusSummary(assembledContext.blastRadiusReport)
    );

    if (checkRunId) {
      await githubProvider.updateCheckRun(installationId, owner, repoName, checkRunId, {
        status: 'completed',
        conclusion: isBlocked ? 'failure' : 'success',
        title: isBlocked ? `Blocked (${criticalCount} Critical, ${highCount} High)` : 'Passed all security & quality policies',
        summary: summaryMarkdown
      });
    }

    // Top 5 inline actionable comments with 1-click GitHub suggestions
    const inlineComments = allFindings
      .filter((f) => f.filePath && f.startLine > 0)
      .slice(0, 5)
      .map((f) => {
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

    const reviewVerdict = isBlocked ? 'REQUEST_CHANGES' : 'COMMENT';
    await githubProvider.createReview(
      installationId,
      owner,
      repoName,
      prNumber,
      reviewVerdict,
      summaryMarkdown,
      inlineComments
    );
  }

  // Meter the run against the customer's monthly quota. Deliberately after the
  // review completes, so a failed run is not billed. Never fatal: a metering
  // problem must not fail a review that already produced results.
  try {
    const customerId = await resolveCustomerForOrganization(organizationId);
    if (customerId) {
      await entitlementEngine.recordUsage(customerId, 'MONTHLY_AI_REVIEWS', 1);
      await entitlementEngine.recordUsage(customerId, 'MONTHLY_PR_REVIEWS', 1);
    } else {
      logger.warn({ organizationId }, 'No customer linked to organization; review not metered');
    }
  } catch (err) {
    logger.error({ err, organizationId }, 'Failed to record review usage');
  }

  logger.info(
    { reviewRunId: reviewRun.id, state: finalState, criticalCount, highCount, durationMs },
    '🎉 CodeGuard PR Review Execution Completed'
  );
}
