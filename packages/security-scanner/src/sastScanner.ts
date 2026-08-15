import type { Finding, FindingSeverity } from '@codeguard/types';
import { generateFindingFingerprint } from './fingerprint.js';

export interface SastRule {
  id: string;
  name: string;
  category: 'SAST' | 'SECURITY';
  severity: FindingSeverity;
  regex: RegExp;
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
}

export const SAST_RULES: SastRule[] = [
  {
    id: 'SAST-SQLI-001',
    name: 'Raw SQL Query String Concatenation (SQLi)',
    category: 'SAST',
    severity: 'CRITICAL',
    regex: /(?:execute|query|raw|queryRaw|sql)\s*\(\s*[`"'].*?\$\{[^}]+\}|(?:execute|query|raw)\s*\(\s*["'].*?["']\s*\+\s*[a-zA-Z0-9_.]+/gi,
    description: 'Dynamic SQL query built via string interpolation or concatenation without parameter binding.',
    impact: 'SQL Injection allows attackers to bypass authentication, dump databases, modify records, or execute arbitrary database commands.',
    recommendation: 'Use parameterized queries, prepared statements, or ORM query builders (e.g. Drizzle ORM, Prisma, TypeORM).',
    confidence: 0.95
  },
  {
    id: 'SAST-CMDI-002',
    name: 'Unsanitized Command Execution (Command Injection)',
    category: 'SAST',
    severity: 'CRITICAL',
    regex: /(?:exec|execSync|spawn|spawnSync|popen|system)\s*\(\s*(?:`.*?\$|\w+\s*\+|["'].*?["']\s*\+|req\.|params\.|body\.|query\.)/gi,
    description: 'Operating system command executed with unvalidated user input or dynamic parameters.',
    impact: 'Remote Code Execution (RCE) on the server host environment.',
    recommendation: 'Avoid shell execution. Use parameterized APIs (`execFile` with array arguments) and strictly validate input against an allowlist.',
    confidence: 0.95
  },
  {
    id: 'SAST-PATH-003',
    name: 'Path Traversal Vulnerability (Arbitrary File Read/Write)',
    category: 'SAST',
    severity: 'HIGH',
    regex: /(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync|open)\s*\(\s*(?:req\.|params\.|query\.|body\.|\w+\s*\+\s*req\.)/gi,
    description: 'File system operation directly uses unsanitized input without path resolution and sandboxing.',
    impact: 'Attackers can read sensitive files (e.g. /etc/passwd, .env) or overwrite critical application files.',
    recommendation: 'Sanitize file paths using `path.basename` and verify the resolved path is strictly within the allowed directory using `path.resolve`.',
    confidence: 0.9
  },
  {
    id: 'SAST-CRYPTO-004',
    name: 'Weak Cryptographic Algorithm (MD5 / SHA1)',
    category: 'SAST',
    severity: 'MEDIUM',
    regex: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)|hashlib\.(?:md5|sha1)\s*\(/gi,
    description: 'Use of deprecated and collision-prone hashing algorithm (MD5 or SHA1).',
    impact: 'Collision attacks and pre-image attacks allow cryptographic spoofing and hash cracking.',
    recommendation: 'Upgrade to modern cryptographic standards: SHA-256, SHA-384, SHA-512, or bcrypt/argon2 for password hashing.',
    confidence: 0.9
  },
  {
    id: 'SAST-EVAL-005',
    name: 'Dynamic Code Execution (eval / Function constructor)',
    category: 'SAST',
    severity: 'CRITICAL',
    regex: /(?:eval|Function)\s*\(\s*(?:req\.|params\.|query\.|body\.|\w+)/gi,
    description: 'Execution of dynamic strings as code via `eval()` or `new Function()`.',
    impact: 'Arbitrary Code Execution (ACE) directly in the JavaScript runtime context.',
    recommendation: 'Never pass user-controlled input to `eval` or dynamic code constructors. Use structured parsers (e.g., JSON.parse) instead.',
    confidence: 0.95
  },
  {
    id: 'SAST-INSEC-RAND-006',
    name: 'Insecure Pseudo-Random Number Generator for Security',
    category: 'SAST',
    severity: 'LOW',
    regex: /Math\.random\s*\(\s*\)/gi,
    description: '`Math.random()` is not cryptographically secure and predictable.',
    impact: 'Tokens, session IDs, or password reset secrets generated via Math.random() can be predicted by attackers.',
    recommendation: 'Use `crypto.randomBytes()` or `crypto.getRandomValues()` for security-sensitive tokens and secrets.',
    confidence: 0.85
  }
];

export class SastScanner {
  private rules: SastRule[];

  constructor(customRules: SastRule[] = []) {
    this.rules = [...SAST_RULES, ...customRules];
  }

  scanFile(
    filePath: string,
    content: string,
    orgId: string,
    repoId: string,
    prId?: string,
    reviewRunId?: string
  ): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      for (const rule of this.rules) {
        rule.regex.lastIndex = 0;
        if (rule.regex.test(line)) {
          const fingerprint = generateFindingFingerprint(rule.id, filePath, `${lineNumber}:${line.trim()}`);

          findings.push({
            id: `finding-sast-${fingerprint.slice(0, 12)}`,
            organizationId: orgId,
            repositoryId: repoId,
            pullRequestId: prId,
            reviewRunId: reviewRunId,
            fingerprint,
            severity: rule.severity,
            category: rule.category,
            source: 'DETERMINISTIC',
            title: rule.name,
            description: rule.description,
            filePath,
            startLine: lineNumber,
            endLine: lineNumber,
            evidence: `Line ${lineNumber}: ${line.trim()}`,
            impact: rule.impact,
            recommendation: rule.recommendation,
            ruleId: rule.id,
            confidence: rule.confidence,
            blocking: rule.severity === 'CRITICAL' || rule.severity === 'HIGH',
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    return findings;
  }
}
