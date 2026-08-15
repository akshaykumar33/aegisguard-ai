import { execSync } from 'node:child_process';

const ALLOWED_BRANCH_PREFIXES = ['feature', 'bugfix', 'hotfix', 'refactor', 'chore', 'test', 'docs', 'feat', 'fix'];
const BRANCH_NAME_REGEX = /^(feature|bugfix|hotfix|refactor|chore|test|docs|feat|fix)\/[a-zA-Z0-9_\-./]+$/;

export async function validateBranchName(): Promise<boolean> {
  let currentBranch = '';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    console.error('\x1b[31m[CodeGuard] Unable to determine git branch.\x1b[0m');
    return false;
  }

  // Exempt detached HEAD or initial main branches before branch creation
  if (currentBranch === 'HEAD') {
    return true;
  }

  if (!BRANCH_NAME_REGEX.test(currentBranch)) {
    console.error('\x1b[31m\n════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error('\x1b[31m🛑 [CodeGuard Gatekeeper] Branch Name Violates Naming Standards!\x1b[0m');
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error(`\x1b[33mYour Branch Name:\x1b[0m "${currentBranch}"`);
    console.error('\n\x1b[36mRequired Format:\x1b[0m <type>/<description-or-issue-key>');
    console.error(`\x1b[32mAllowed Types:\x1b[0m [${ALLOWED_BRANCH_PREFIXES.join(', ')}]`);
    console.error('\n\x1b[32mExamples:\x1b[0m');
    console.error('  ✔ feature/auth-jwt-rotation');
    console.error('  ✔ bugfix/order-timeout-fix');
    console.error('  ✔ refactor/database-migrations');
    console.error('\n\x1b[33mTo rename your active branch:\x1b[0m');
    console.error(`  git branch -m feature/${currentBranch.replace(/[^a-zA-Z0-9_-]/g, '-')}`);
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\n\x1b[0m');
    return false;
  }

  console.log(`\x1b[32m✔ [CodeGuard] Branch name verified: "${currentBranch}"\x1b[0m`);
  return true;
}
