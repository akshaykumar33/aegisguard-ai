import fs from 'node:fs';

const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-./]+\))?!?: .{1,120}$/;

export async function validateCommitMsg(msgFilePath: string): Promise<boolean> {
  if (!fs.existsSync(msgFilePath)) {
    console.error(`\x1b[31m[CodeGuard] Error: Commit message file not found at ${msgFilePath}\x1b[0m`);
    return false;
  }

  const raw = fs.readFileSync(msgFilePath, 'utf8');
  // Strip comments and leading/trailing whitespace
  const firstLine = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))[0];

  if (!firstLine) {
    console.error('\x1b[31m[CodeGuard] 🛑 Aborting commit: Commit message cannot be empty.\x1b[0m');
    return false;
  }

  if (!CONVENTIONAL_COMMIT_REGEX.test(firstLine)) {
    console.error('\x1b[31m\n════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error('\x1b[31m🛑 [CodeGuard Gatekeeper] Invalid Commit Message Format!\x1b[0m');
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\x1b[0m');
    console.error(`\x1b[33mYour commit message:\x1b[0m "${firstLine}"`);
    console.error('\x1b[36mExpected Conventional Commit standard:\x1b[0m');
    console.error('  <type>(<optional scope>): <description>');
    console.error('\n\x1b[32mAllowed Types:\x1b[0m');
    console.error('  • feat     : A new feature');
    console.error('  • fix      : A bug fix');
    console.error('  • docs     : Documentation changes only');
    console.error('  • refactor : Code change that neither fixes a bug nor adds a feature');
    console.error('  • perf     : Performance improvements');
    console.error('  • test     : Adding or updating unit/integration tests');
    console.error('  • chore    : Build process, auxiliary tools, dependencies');
    console.error('\n\x1b[32mExamples:\x1b[0m');
    console.error('  ✔ feat(auth): add JWT token rotation');
    console.error('  ✔ fix(api): handle null payment payload');
    console.error('  ✔ refactor(database): optimize connection pooling');
    console.error('\x1b[31m════════════════════════════════════════════════════════════════════\n\x1b[0m');
    return false;
  }

  console.log(`\x1b[32m✔ [CodeGuard] Commit message standard verified: "${firstLine}"\x1b[0m`);
  return true;
}
