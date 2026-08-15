import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { SecretScanner, SastScanner } from '@codeguard/security-scanner';
import { validateBranchName } from './checkBranch.js';

export async function runCheck(targetDir = process.cwd()): Promise<boolean> {
  console.log('\x1b[36m\n====================================================================\x1b[0m');
  console.log('\x1b[36m🔍 Running CodeGuard Comprehensive Local Pre-Flight Checks\x1b[0m');
  console.log('\x1b[36m====================================================================\x1b[0m\n');

  let overallPassed = true;

  // 1. Branch Check
  console.log('\x1b[1m[1/3] Branch Naming Standards:\x1b[0m');
  const branchOk = await validateBranchName();
  if (!branchOk) overallPassed = false;

  // 2. Staged Files Secret Scanning
  console.log('\n\x1b[1m[2/3] Staged Files Secret & Security Scanning:\x1b[0m');
  let stagedFiles: string[] = [];
  try {
    const raw = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    stagedFiles = raw.split('\n').map((f) => f.trim()).filter((f) => f.length > 0);
  } catch {
    stagedFiles = [];
  }

  const secretScanner = new SecretScanner();
  const sastScanner = new SastScanner();
  let issueCount = 0;

  for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    try {
      const stats = fs.statSync(file);
      if (stats.size > 1024 * 1024) continue;
      const content = fs.readFileSync(file, 'utf8');

      const secrets = secretScanner.scanFile(file, content, 'local-org', 'local-repo');
      const sastFindings = sastScanner.scanFile(file, content, 'local-org', 'local-repo');

      if (secrets.length > 0) {
        issueCount += secrets.length;
        console.error(`  \x1b[31m✖ [SECRET] ${file}: ${secrets.map((s) => s.title).join(', ')}\x1b[0m`);
      }
      if (sastFindings.length > 0) {
        issueCount += sastFindings.length;
        console.error(`  \x1b[31m✖ [SAST] ${file}: ${sastFindings.map((s) => s.title).join(', ')}\x1b[0m`);
      }
    } catch {}
  }

  if (issueCount > 0) {
    overallPassed = false;
    console.error(`\x1b[31m  Found ${issueCount} security issue(s) in staged files.\x1b[0m`);
  } else {
    console.log(`\x1b[32m  ✔ Scanned ${stagedFiles.length} staged file(s) — Clean.\x1b[0m`);
  }

  // 3. Commit message verification
  console.log('\n\x1b[1m[3/3] Recent Commit Message Compliance:\x1b[0m');
  try {
    const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const isConventional = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-./]+\))?!?: .+/.test(lastCommit);
    if (isConventional) {
      console.log(`\x1b[32m  ✔ Latest commit conforms to Conventional Commits: "${lastCommit}"\x1b[0m`);
    } else {
      console.log(`\x1b[33m  ⚠ Latest commit does not conform to Conventional Commits: "${lastCommit}"\x1b[0m`);
    }
  } catch {
    console.log('  ℹ No commit history found in repository yet.');
  }

  console.log('\n====================================================================');
  if (overallPassed) {
    console.log('\x1b[32m✔ All CodeGuard local pre-flight checks passed successfully!\x1b[0m\n');
  } else {
    console.log('\x1b[31m✖ Some pre-flight checks failed. Please address before pushing.\x1b[0m\n');
  }

  return overallPassed;
}
