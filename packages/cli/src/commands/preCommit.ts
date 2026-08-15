import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { SecretScanner } from '@codeguard/security-scanner';

export async function validatePreCommit(): Promise<boolean> {
  let stagedFiles: string[] = [];
  try {
    const raw = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    stagedFiles = raw
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  } catch {
    stagedFiles = [];
  }

  if (stagedFiles.length === 0) {
    return true;
  }

  const scanner = new SecretScanner();
  let foundSecretsCount = 0;

  for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    try {
      const stats = fs.statSync(file);
      // Skip large binary files > 1MB
      if (stats.size > 1024 * 1024) continue;

      const content = fs.readFileSync(file, 'utf8');
      const findings = scanner.scanFile(file, content, 'local-org', 'local-repo');

      if (findings.length > 0) {
        foundSecretsCount += findings.length;
        console.error(`\x1b[31m\n🛑 [CodeGuard Pre-Commit Block] Exposed Secret in Staged File: ${file}\x1b[0m`);
        for (const f of findings) {
          console.error(`   • Line ${f.startLine}: ${f.title}`);
          console.error(`     \x1b[33m${f.description}\x1b[0m`);
        }
      }
    } catch {
      // Ignore binary or read errors
    }
  }

  if (foundSecretsCount > 0) {
    console.error('\x1b[31m\n════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error(`\x1b[31m🛑 [CodeGuard Block] ${foundSecretsCount} secret(s) detected in staged files!\x1b[0m`);
    console.error('Commit rejected. Remove hardcoded credentials before committing.');
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\n\x1b[0m');
    return false;
  }

  console.log(`\x1b[32m✔ [CodeGuard] Scanned ${stagedFiles.length} staged file(s) — 0 exposed secrets detected.\x1b[0m`);
  return true;
}
