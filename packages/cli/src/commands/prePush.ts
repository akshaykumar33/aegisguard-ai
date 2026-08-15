import { execSync } from 'node:child_process';

const PROTECTED_BRANCHES = [
  'main',
  'master',
  'staging',
  'stage',
  'production',
  'prod',
  'dev',
  'development',
  'release'
];

/**
 * Validates that direct pushes to protected branches are strictly prohibited.
 */
export async function validatePrePush(remote: string, url: string): Promise<boolean> {
  let currentBranch = '';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    currentBranch = 'unknown';
  }

  const isProtected = PROTECTED_BRANCHES.some(
    (b) => currentBranch === b || currentBranch.startsWith(`${b}/`) || currentBranch.startsWith('release/')
  );

  if (isProtected) {
    console.error('\x1b[31m\n════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error('\x1b[31m🛑 [CodeGuard Zero-Trust Engine] DIRECT PUSH TO PROTECTED BRANCH BLOCKED!\x1b[0m');
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error(`\x1b[33mActive Branch:\x1b[0m \x1b[31m${currentBranch}\x1b[0m`);
    console.error(`\x1b[33mRemote Target:\x1b[0m ${remote} (${url})`);
    console.error('\n\x1b[36mOrganization Guardrail Policy [PROTECTED_BRANCH_NO_PUSH]:\x1b[0m');
    console.error('  You cannot push code directly to protected branches:');
    console.error(`  [${PROTECTED_BRANCHES.join(', ')}]`);
    console.error('\n\x1b[32m✔ Required Developer Workflow:\x1b[0m');
    console.error('  1. Create a dedicated feature branch:');
    console.error('     git checkout -b feature/my-descriptive-feature');
    console.error('  2. Push your feature branch to remote:');
    console.error('     git push origin feature/my-descriptive-feature');
    console.error('  3. Open a Pull Request on GitHub for CodeGuard AI + Human peer review!');
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\n\x1b[0m');
    return false;
  }

  console.log(`\x1b[32m✔ [CodeGuard] Branch "${currentBranch}" is eligible for remote push via PR.\x1b[0m`);
  return true;
}
