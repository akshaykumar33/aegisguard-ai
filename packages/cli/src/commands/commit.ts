import { execSync } from 'node:child_process';

export function suggestConventionalCommit(inputMessage: string): string {
  const clean = inputMessage.trim().replace(/^["']|["']$/g, '');
  const lower = clean.toLowerCase();

  let type = 'feat';
  if (lower.startsWith('fix') || lower.includes('bug') || lower.includes('issue') || lower.includes('error') || lower.includes('crash')) {
    type = 'fix';
  } else if (lower.includes('refactor') || lower.includes('clean') || lower.includes('simplify') || lower.includes('restructure')) {
    type = 'refactor';
  } else if (lower.includes('doc') || lower.includes('readme')) {
    type = 'docs';
  } else if (lower.includes('test') || lower.includes('spec')) {
    type = 'test';
  } else if (lower.includes('build') || lower.includes('dep') || lower.includes('upgrade') || lower.includes('config') || lower.includes('pnpm') || lower.includes('npm')) {
    type = 'chore';
  } else if (lower.includes('perf') || lower.includes('speed') || lower.includes('optimize')) {
    type = 'perf';
  }

  // Strip leading verbs like "fixed", "added", "updated"
  let description = clean
    .replace(/^(fixed|fixes|fix|added|adds|add|updated|updates|update|upgraded|upgrade|optimized|optimize|refactored|refactor|cleaned|clean|improved|improve)\s+/i, '')
    .trim();

  if (description.length === 0) description = clean;
  // Lowercase first letter of description
  description = description.charAt(0).toLowerCase() + description.slice(1);

  return `${type}: ${description}`;
}

export async function handleCommitHelper(message?: string): Promise<boolean> {
  if (!message) {
    console.log('\x1b[36mConventional Commit standard format:\x1b[0m <type>(<optional-scope>): <description>');
    console.log('Types: feat, fix, docs, refactor, perf, test, chore, build, ci');
    console.log('Examples:');
    console.log('  feat(auth): implement JWT token refresh');
    console.log('  fix(api): handle null payment parameters');
    return true;
  }

  const isConventional = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-./]+\))?!?: .{1,120}$/.test(message);

  if (isConventional) {
    console.log(`\x1b[32m✔ Commit message is valid:\x1b[0m "${message}"`);
    return true;
  }

  const suggestion = suggestConventionalCommit(message);
  console.log('\x1b[33m\nCommit message does not follow Conventional Commits format.\x1b[0m');
  console.log(`\x1b[90mCurrent:\x1b[0m   "${message}"`);
  console.log(`\x1b[32mSuggested:\x1b[0m "${suggestion}"\n`);
  return false;
}
