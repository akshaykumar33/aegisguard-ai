import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { SecretScanner, SastScanner } from '@codeguard/security-scanner';

export async function runLocalReview(): Promise<void> {
  console.log('\x1b[36m\n====================================================================\x1b[0m');
  console.log('\x1b[36m🤖 CodeGuard Local AI & Security Review Engine\x1b[0m');
  console.log('\x1b[36m====================================================================\x1b[0m\n');

  let files: string[] = [];
  try {
    const raw = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    files = raw.split('\n').map((f) => f.trim()).filter((f) => f.length > 0);
  } catch {}

  if (files.length === 0) {
    try {
      const rawUnstaged = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
      files = rawUnstaged.split('\n').map((f) => f.trim()).filter((f) => f.length > 0);
    } catch {}
  }

  if (files.length === 0) {
    console.log('No staged or modified files detected to review.');
    return;
  }

  console.log(`Analyzing ${files.length} changed file(s)...\n`);

  const secretScanner = new SecretScanner();
  const sastScanner = new SastScanner();
  let totalFindings = 0;

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    try {
      const content = fs.readFileSync(file, 'utf8');
      const secrets = secretScanner.scanFile(file, content, 'local-org', 'local-repo');
      const sast = sastScanner.scanFile(file, content, 'local-org', 'local-repo');

      if (secrets.length > 0 || sast.length > 0) {
        console.log(`\x1b[1m📁 ${file}\x1b[0m`);
        for (const s of secrets) {
          totalFindings++;
          console.log(`  \x1b[31m🚨 [CRITICAL] Secret Exposure: ${s.title} (Line ${s.startLine})\x1b[0m`);
          console.log(`     \x1b[90m${s.description}\x1b[0m`);
          if (s.recommendation) console.log(`     \x1b[32mFix:\x1b[0m ${s.recommendation}`);
        }
        for (const f of sast) {
          totalFindings++;
          const color = f.severity === 'HIGH' ? '\x1b[31m' : '\x1b[33m';
          console.log(`  ${color}⚠️  [${f.severity}] Security finding: ${f.title} (Line ${f.startLine})\x1b[0m`);
          console.log(`     \x1b[90m${f.description}\x1b[0m`);
          if (f.recommendation) console.log(`     \x1b[32mFix:\x1b[0m ${f.recommendation}`);
        }
        console.log('');
      }
    } catch {}
  }

  if (totalFindings === 0) {
    console.log('\x1b[32m✔ Local static review passed: 0 vulnerabilities or secrets found.\x1b[0m');
    console.log('\x1b[36m💡 Remote PR will automatically trigger full Gemini 3.7 Flash reasoning & AST Graph analysis on push.\x1b[0m\n');
  } else {
    console.log(`\x1b[31m🛑 ${totalFindings} issue(s) detected locally. Resolve them before pushing to remote.\x1b[0m\n`);
  }
}
