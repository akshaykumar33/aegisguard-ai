import type { CodeOwnersEvaluation, CodeOwnersRule } from '@codeguard/types';

/**
 * Minimal wildcard pattern matcher for glob-like paths in CODEOWNERS
 */
function matchGlob(pattern: string, filePath: string): boolean {
  let normalizedPattern = pattern.trim();
  let normalizedPath = filePath.trim();

  // If pattern starts with '/', match from root
  if (normalizedPattern.startsWith('/')) {
    normalizedPattern = normalizedPattern.slice(1);
  } else if (!normalizedPattern.startsWith('*')) {
    // Relative pattern matches anywhere in path
    normalizedPattern = '**/' + normalizedPattern;
  }

  // Handle directory patterns e.g. "services/auth/" or "docs/"
  if (normalizedPattern.endsWith('/')) {
    normalizedPattern = normalizedPattern + '**';
  }

  // Convert glob pattern to regular expression
  const regexStr = '^' + normalizedPattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/(?<!\.)\*/g, '[^/]*')
    .replace(/\?/g, '[^/]') + '$';

  try {
    const regex = new RegExp(regexStr);
    return regex.test(normalizedPath);
  } catch {
    return false;
  }
}

export class CodeOwnersEngine {
  /**
   * Parse a standard CODEOWNERS file content into structured rules
   */
  static parseCodeOwners(content: string): CodeOwnersRule[] {
    const rules: CodeOwnersRule[] = [];
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) continue;

      // Tokenize by whitespace
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length < 2) continue;

      const pathPattern = tokens[0];
      const owners = tokens.slice(1).filter((t) => t.startsWith('@') || t.includes('@'));

      if (owners.length > 0) {
        rules.push({ pathPattern, owners });
      }
    }

    return rules;
  }

  /**
   * Evaluate changed files against CODEOWNERS rules and check approved human reviewers
   */
  static evaluate(
    codeOwnersContent: string,
    changedFiles: string[],
    approvedReviewers: string[]
  ): CodeOwnersEvaluation {
    const rules = this.parseCodeOwners(codeOwnersContent);
    const matchedRules: CodeOwnersRule[] = [];
    const requiredOwnersSet = new Set<string>();

    for (const file of changedFiles) {
      // Find matching rules (last matching pattern wins in standard git CODEOWNERS)
      let fileMatch: CodeOwnersRule | null = null;
      for (const rule of rules) {
        if (matchGlob(rule.pathPattern, file)) {
          fileMatch = rule;
        }
      }

      if (fileMatch) {
        matchedRules.push(fileMatch);
        for (const owner of fileMatch.owners) {
          requiredOwnersSet.add(owner);
        }
      }
    }

    const requiredOwners = Array.from(requiredOwnersSet);
    const approvedOwners = requiredOwners.filter((owner) => {
      // Match username directly e.g. "@alice" -> "alice" or team handles
      const cleanOwner = owner.replace(/^@/, '').toLowerCase();
      return approvedReviewers.some((rev) => rev.toLowerCase() === cleanOwner || rev.toLowerCase() === owner.toLowerCase());
    });

    const missingOwners = requiredOwners.filter((owner) => !approvedOwners.includes(owner));
    const satisfied = requiredOwners.length === 0 || missingOwners.length === 0;

    return {
      matchedRules,
      requiredOwners,
      approvedOwners,
      missingOwners,
      satisfied
    };
  }
}
