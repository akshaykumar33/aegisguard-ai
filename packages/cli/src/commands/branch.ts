import { execSync } from 'node:child_process';
import { validateBranchName } from './checkBranch.js';

export async function handleBranchCommand(action?: string, branchName?: string): Promise<boolean> {
  if (!action && !branchName) {
    return await validateBranchName();
  }

  if (action === 'new' || action === 'create') {
    if (!branchName) {
      console.error('\x1b[31mUsage: codeguard branch create <type>/<ticket-or-description>\x1b[0m');
      console.error('Example: codeguard branch create feature/PROJ-123-payment-gateway');
      return false;
    }

    const isCompliant = /^(feature|fix|bugfix|hotfix|chore|refactor|docs|test)\/[a-zA-Z0-9_\-./]+$/.test(branchName);
    if (!isCompliant) {
      console.error(`\x1b[31m🛑 Invalid branch name "${branchName}". Must start with feature/, fix/, hotfix/, refactor/, chore/, test/, docs/\x1b[0m`);
      return false;
    }

    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      console.log(`\x1b[32m✔ Created and switched to compliant branch: "${branchName}"\x1b[0m`);
      return true;
    } catch (err: any) {
      console.error(`\x1b[31mError creating branch: ${err.message}\x1b[0m`);
      return false;
    }
  }

  return await validateBranchName();
}
