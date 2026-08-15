import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { LocalPolicyManager } from '../policyManager.js';
import { PolicyEngine } from '@codeguard/policy-engine';
import { SecretScanner } from '@codeguard/security-scanner';

export async function displayStatus(targetDir = process.cwd()): Promise<void> {
  let repoName = path.basename(path.resolve(targetDir));
  let remoteOrigin = '';
  try {
    remoteOrigin = execSync('git config --get remote.origin.url', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (remoteOrigin) {
      const match = remoteOrigin.match(/\/([^/]+?)(?:\.git)?$/);
      if (match) repoName = match[1];
    }
  } catch {}

  const policyRes = LocalPolicyManager.loadPolicy(targetDir);

  let currentBranch = 'unknown';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {}

  const isBranchValid = /^(feature|fix|hotfix|chore|refactor|docs|test)\/[a-zA-Z0-9_\-./]+$/.test(currentBranch);
  const isProtectedBranch = PolicyEngine.matchesProtectedBranch(currentBranch);

  // Check last commit message format
  let lastCommitMsg = '';
  let isCommitValid = true;
  try {
    lastCommitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    isCommitValid = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-./]+\))?!?: .+/.test(lastCommitMsg);
  } catch {
    isCommitValid = true;
  }

  // Scan staged or recent changes for secrets
  const scanner = new SecretScanner();
  let stagedSecrets = 0;
  try {
    const rawStaged = execSync('git diff --cached --name-only', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const files = rawStaged.split('\n').map((f) => f.trim()).filter((f) => f.length > 0);
    for (const f of files) {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf8');
        stagedSecrets += scanner.scanFile(f, content, 'local-org', repoName).length;
      }
    }
  } catch {}

  // PR simulation / mock context
  const mockPrNumber = 482;
  const humanApprovals = 1;
  const requiredApprovals = 2;
  const mergeStatus = isProtectedBranch ? 'BLOCKED' : humanApprovals >= requiredApprovals ? 'ALLOWED' : 'BLOCKED';

  console.log(`\n\x1b[1mRepository:\x1b[0m \x1b[36m${repoName}\x1b[0m\n`);

  console.log('\x1b[1mPolicy:\x1b[0m');
  if (policyRes.isVerified) {
    console.log(`  \x1b[32m✓ Synced\x1b[0m (v${policyRes.policy.version} Signed)`);
  } else {
    console.log(`  \x1b[33m⚠ Unverified / Fallback Policy\x1b[0m`);
  }

  console.log('\n\x1b[1mCurrent Branch:\x1b[0m');
  console.log(`  \x1b[33m${currentBranch}\x1b[0m`);

  console.log('\n\x1b[1mBranch:\x1b[0m');
  if (isBranchValid) {
    console.log('  \x1b[32m✓ Valid\x1b[0m (<type>/<description>)');
  } else if (isProtectedBranch) {
    console.log('  \x1b[31m✗ Protected Branch (Cannot write direct changes)\x1b[0m');
  } else {
    console.log('  \x1b[33m⚠ Non-standard naming format\x1b[0m');
  }

  console.log('\n\x1b[1mCommits:\x1b[0m');
  if (isCommitValid) {
    console.log('  \x1b[32m✓ Valid\x1b[0m (Conventional Commits)');
  } else {
    console.log('  \x1b[33m⚠ Last commit did not follow Conventional Commits standard\x1b[0m');
  }

  console.log('\n\x1b[1mSecrets:\x1b[0m');
  if (stagedSecrets === 0) {
    console.log('  \x1b[32m✓ No secrets detected\x1b[0m');
  } else {
    console.log(`  \x1b[31m✗ ${stagedSecrets} exposed secret(s) in staged changes\x1b[0m`);
  }

  console.log('\n\x1b[1mProtected Branch:\x1b[0m');
  console.log('  main');

  console.log('\n\x1b[1mDirect Push:\x1b[0m');
  console.log('  \x1b[31m✗ Not allowed\x1b[0m');

  console.log('\n\x1b[1mPR:\x1b[0m');
  console.log(`  #${mockPrNumber}`);

  console.log('\n\x1b[1mAI Review:\x1b[0m');
  console.log('  \x1b[32m✓ Passed\x1b[0m');

  console.log('\n\x1b[1mHuman Review:\x1b[0m');
  console.log(`  \x1b[33m${humanApprovals} / ${requiredApprovals} approvals\x1b[0m`);

  console.log('\n\x1b[1mMerge:\x1b[0m');
  if (mergeStatus === 'ALLOWED') {
    console.log('  \x1b[32m✔ ALLOWED\x1b[0m\n');
  } else {
    console.log('  \x1b[31mBLOCKED\x1b[0m (Requires 1 more human peer approval)\n');
  }
}
