import { parseUnifiedDiff } from '@codeguard/code-parser';
import { SymbolExtractor } from '@codeguard/code-parser';
import { securityOrchestrator } from '@codeguard/security-scanner';
import { CodeGraphStore } from '@codeguard/code-graph';
import { HybridRetriever } from '@codeguard/retrieval';
import { geminiReviewClient } from '@codeguard/ai-reviewer';
import { AiVerifier } from '@codeguard/ai-verifier';
import { PolicyEngine } from '@codeguard/policy-engine';
import type { Finding, Policy } from '@codeguard/types';

// Sample PR Diff with realistic changes (Security vulnerabilities + features)
const SAMPLE_DIFF = `
diff --git a/package.json b/package.json
index 4a123bc..5b678ef 100644
--- a/package.json
+++ b/package.json
@@ -12,4 +12,6 @@
     "express": "^4.19.2",
+    "cross-spawn": "^7.0.0",
+    "axios": "^1.5.0"
   }
 }
diff --git a/src/config/secrets.ts b/src/config/secrets.ts
new file mode 100644
--- /dev/null
+++ b/src/config/secrets.ts
@@ -0,0 +1,5 @@
+export const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
+export const GEMINI_API_KEY = "AIzaSyD1234567890abcdefghijklmnopqr";
+export const DB_URL = "postgres://admin:superSecretPassword123@db.internal:5432/production";
diff --git a/src/controllers/paymentController.ts b/src/controllers/paymentController.ts
new file mode 100644
--- /dev/null
+++ b/src/controllers/paymentController.ts
@@ -0,0 +1,24 @@
+import { Request, Response } from 'express';
+import crypto from 'crypto';
+import { db } from '../db/client';
+
+export class PaymentController {
+  async handlePayment(req: Request, res: Response) {
+    const { userId, amount, cardNumber } = req.body;
+
+    // Vulnerability 1: Weak Cryptographic Hashing for Sensitive Data
+    const cardHash = crypto.createHash('md5').update(cardNumber).digest('hex');
+
+    // Vulnerability 2: SQL Injection via String Concatenation
+    const query = "SELECT balance FROM user_wallets WHERE user_id = '" + userId + "'";
+    const wallet = await db.query(query);
+
+    if (wallet.balance < amount) {
+      return res.status(400).json({ error: 'Insufficient funds' });
+    }
+
+    // Process deduction
+    return res.json({ success: true, cardHash });
+  }
+}
+`;

export async function runReviewDemo() {
  console.log('\n================================================================');
  console.log('🛡️  CODEGUARD ENTERPRISE - PULL REQUEST REVIEW SIMULATION');
  console.log('================================================================\n');

  console.log('📦 [1/6] Ingesting Pull Request #42: "feat: Add payment processing controller"');
  const parsedDiff = parseUnifiedDiff(SAMPLE_DIFF);
  console.log(`   - Changed Files: ${parsedDiff.files.length}`);
  console.log(`   - Total Additions: +${parsedDiff.totalAdditions} lines | Deletions: -${parsedDiff.totalDeletions} lines\n`);

  const changedFilesMap = new Map<string, number[]>();
  for (const f of parsedDiff.files) {
    changedFilesMap.set(f.newPath, f.changedLineNumbers);
  }

  // 2. Deterministic Security Scanners
  console.log('🔍 [2/6] Running Deterministic Security Scanners...');
  const filesToScan = parsedDiff.files.map((f) => ({
    filePath: f.newPath,
    content: f.hunks.flatMap((h) => h.lines.map((l) => l.content)).join('\n')
  }));

  const deterministicFindings = securityOrchestrator.scanFiles(
    filesToScan,
    'org-acme-corp',
    'repo-payments-api',
    'pr-42',
    'run-001'
  );
  console.log(`   ✅ Deterministic Scans Completed: Found ${deterministicFindings.length} issue(s)`);
  for (const f of deterministicFindings) {
    console.log(`      * [${f.severity}] (${f.category}) ${f.title} [${f.filePath}:${f.startLine}]`);
  }

  // 3. AST Parsing & Code Graph
  console.log('\n🌳 [3/6] Parsing AST Symbols & Building Call Graph Context...');
  const graphStore = new CodeGraphStore();
  const extractedSymbols = filesToScan.flatMap((f) => SymbolExtractor.extractSymbols(f.filePath, f.content));
  console.log(`   - Extracted ${extractedSymbols.length} AST symbol(s):`);
  for (const s of extractedSymbols) {
    console.log(`      * \`${s.kind}\` ${s.name} in ${s.filePath}:${s.startLine}-${s.endLine}`);
  }

  // 4. Hybrid Context Assembly
  const activePolicies: Policy[] = [
    {
      id: 'pol-1',
      organizationId: 'org-acme-corp',
      name: 'Acme Enterprise Zero-Trust Policy',
      version: '1.0.0',
      level: 'ORGANIZATION',
      isDefault: true,
      enabled: true,
      rules: [
        { id: 'r1', policyId: 'pol-1', name: 'Block Secrets', ruleType: 'SECRET_BLOCK', condition: {}, action: 'BLOCK', enabled: true },
        { id: 'r2', policyId: 'pol-1', name: 'Block Critical Severity', ruleType: 'SEVERITY_THRESHOLD', condition: { minSeverity: 'CRITICAL' }, action: 'BLOCK', enabled: true },
        { id: 'r3', policyId: 'pol-1', name: 'Warn on High Severity', ruleType: 'SEVERITY_THRESHOLD', condition: { minSeverity: 'HIGH' }, action: 'WARN', enabled: true }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const assembledContext = HybridRetriever.assembleContext(
    parsedDiff.files.map((f) => ({ path: f.newPath, status: f.status, additions: f.additions, deletions: f.deletions })),
    extractedSymbols,
    graphStore,
    activePolicies
  );

  // 5. AI Reviewer (Google Gemini)
  console.log('\n🤖 [4/6] Invoking Google Gemini AI Reviewer...');
  const aiResponse = await geminiReviewClient.reviewPullRequest(
    'feat: Add payment processing controller',
    'Adds payment endpoints and wallet query logic.',
    SAMPLE_DIFF,
    assembledContext.formattedPromptContext,
    parsedDiff.files.map((f) => f.newPath)
  );

  const candidateAiFindings: Finding[] = (aiResponse.findings as Array<any>).map((f: any, idx: number) => ({
    id: `ai-${idx}`,
    organizationId: 'org-acme-corp',
    repositoryId: 'repo-payments-api',
    pullRequestId: 'pr-42',
    fingerprint: `fp-ai-${f.filePath}-${f.startLine}`,
    severity: f.severity,
    category: f.category,
    source: 'AI',
    title: f.title,
    description: f.description || f.title,
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

  // 6. Verification Loop
  console.log('\n🔬 [5/6] Verifying Findings with AI Confidence Calibrator...');
  const { verifiedFindings, suppressedCount } = AiVerifier.verifyFindings(candidateAiFindings, changedFilesMap);
  console.log(`   - Verified ${verifiedFindings.length} AI findings (${suppressedCount} hallucinated/out-of-bounds findings suppressed)`);

  const allFindings = [...deterministicFindings, ...verifiedFindings];

  // 7. Policy Evaluation
  console.log('\n⚖️  [6/6] Evaluating Organization Policies...');
  const policyResult = PolicyEngine.evaluate(activePolicies[0], allFindings);
  const isBlocked = policyResult.outcome === 'BLOCK';

  // Severity counts
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

  console.log('\n================================================================');
  console.log('📋 GITHUB CHECK RUN OUTPUT (EXACTLY WHAT DEVELOPERS SEE)');
  console.log('================================================================\n');

  console.log(`STATUS: ${isBlocked ? '🔴 MERGE BLOCKED (Action Required)' : '✅ READY TO MERGE'}`);
  console.log(`POLICY DECISION: [${policyResult.outcome}]`);
  console.log(`FINDING BREAKDOWN: ${criticalCount} Critical | ${highCount} High | ${mediumCount} Medium | ${lowCount} Low\n`);

  console.log('--- GITHUB PR CHECK SUMMARY ---');
  console.log('## 🛡️ CodeGuard AI PR Review');
  console.log(`**Status:** ${isBlocked ? '🔴 **MERGE BLOCKED**' : '✅ **READY TO MERGE**'} | **Decision:** \`${policyResult.outcome}\`\n`);
  console.log('| 🚨 Critical | ⚠️ High | 🟡 Medium | ℹ️ Low |');
  console.log('|:---:|:---:|:---:|:---:|');
  console.log(`| **${criticalCount}** | **${highCount}** | **${mediumCount}** | **${lowCount}** |\n`);

  console.log('### 📝 Executive Summary');
  console.log(aiResponse.summary || 'All automated security scans, AST graph analysis, and enterprise quality policies evaluated.');

  if (policyResult.reasons.length > 0) {
    console.log('\n### ⚖️ Enterprise Policy Evaluation');
    for (const reason of policyResult.reasons) {
      console.log(`- ❌ ${reason}`);
    }
  }

  console.log('\n--- GITHUB INLINE PR COMMENTS (Max 5 Actionable Review Comments) ---');
  const inlineComments = allFindings
    .filter((f) => f.filePath && f.startLine > 0)
    .slice(0, 5);

  inlineComments.forEach((f, idx) => {
    console.log(`\n💬 Comment #${idx + 1} on [${f.filePath}:${f.startLine}]:`);
    console.log(`   ┌─────────────────────────────────────────────────────────────`);
    console.log(`   │ **[CodeGuard ${f.severity}] ${f.title}**`);
    console.log(`   │`);
    console.log(`   │ ${f.description}`);
    console.log(`   │`);
    console.log(`   │ *Evidence:* \`${f.evidence || 'N/A'}\``);
    console.log(`   │ *Impact:* ${f.impact || 'Security risk'}`);
    console.log(`   │ *Fix Recommendation:* ${f.recommendation}`);
    if (f.suggestion) {
      console.log(`   │`);
      console.log(`   │ \`\`\`suggestion`);
      console.log(`   │ ${f.suggestion}`);
      console.log(`   │ \`\`\``);
    }
    console.log(`   └─────────────────────────────────────────────────────────────`);
  });

  console.log('\n================================================================');
  console.log('🎉 Review simulation completed successfully.');
  console.log('================================================================\n');
}

// Allow direct run: tsx apps/review-worker/src/demo.ts
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  runReviewDemo().then(() => process.exit(0));
}
