import fs from 'node:fs';
import path from 'node:path';
import type { Finding } from '@codeguard/types';
import { generateFindingFingerprint, hashSecret, maskSecret } from './fingerprint.js';

export interface SecretPattern {
  id: string;
  name: string;
  secretType: string;
  regex: RegExp;
  description: string;
  severity: 'CRITICAL' | 'HIGH';
  confidence: number;
  minEntropy?: number;
}

export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export const DEFAULT_SECRET_PATTERNS: SecretPattern[] = [
  // 1. AWS Credentials
  {
    id: 'SEC-001',
    name: 'AWS Access Key ID',
    secretType: 'AWS_ACCESS_KEY',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    description: 'Exposed AWS Access Key ID detected',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-002',
    name: 'AWS Secret Access Key Assignment',
    secretType: 'AWS_SECRET_KEY',
    regex: /(?:aws_secret_access_key|aws_secret_key|secret_access_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/gi,
    description: 'Exposed AWS 40-character Secret Access Key',
    severity: 'CRITICAL',
    confidence: 1.0
  },

  // 2. GitHub & GitLab Tokens
  {
    id: 'SEC-003',
    name: 'GitHub Personal Access Token',
    secretType: 'GITHUB_TOKEN',
    regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
    description: 'Exposed GitHub Personal Access Token or App Token',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-004',
    name: 'GitLab Personal Access Token',
    secretType: 'GITLAB_TOKEN',
    regex: /glpat-[a-zA-Z0-9_\-]{20,}/g,
    description: 'Exposed GitLab Personal Access Token',
    severity: 'CRITICAL',
    confidence: 1.0
  },

  // 3. Cryptographic Private Keys
  {
    id: 'SEC-005',
    name: 'Private Encryption Key',
    secretType: 'PRIVATE_KEY',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
    description: 'Unencrypted Private Cryptographic Key embedded in source code',
    severity: 'CRITICAL',
    confidence: 1.0
  },

  // 4. Team Chat & Webhooks
  {
    id: 'SEC-006',
    name: 'Slack Bot / User Token',
    secretType: 'SLACK_TOKEN',
    regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    description: 'Exposed Slack API authentication token',
    severity: 'HIGH',
    confidence: 0.95
  },
  {
    id: 'SEC-007',
    name: 'Slack Incoming Webhook URL',
    secretType: 'SLACK_WEBHOOK',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/g,
    description: 'Exposed Slack Incoming Webhook URL',
    severity: 'HIGH',
    confidence: 1.0
  },
  {
    id: 'SEC-008',
    name: 'Discord Bot Token / Webhook',
    secretType: 'DISCORD_TOKEN',
    regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d{18,20}\/[A-Za-z0-9_-]{68}|(?:mfa\.[a-z0-9_-]{20,}|[a-z0-9_-]{24}\.[a-z0-9_-]{6}\.[a-z0-9_-]{27})/gi,
    description: 'Exposed Discord Bot Token or Webhook',
    severity: 'HIGH',
    confidence: 0.95
  },

  // 5. Payment Gateways
  {
    id: 'SEC-009',
    name: 'Stripe Live API Key',
    secretType: 'STRIPE_API_KEY',
    regex: /(?:sk|rk)_live_[0-9a-zA-Z]{24,}/g,
    description: 'Exposed Stripe live production secret key',
    severity: 'CRITICAL',
    confidence: 1.0
  },

  // 6. Database URIs & Connection Strings
  {
    id: 'SEC-010',
    name: 'Database Connection String with Credentials',
    secretType: 'DATABASE_URL',
    regex: /(?:postgres|postgresql|mysql|mongodb|redis|cassandra|couchdb):\/\/[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.~%!$&'()*+,;=-]+@[a-zA-Z0-9_.-]+(?::[0-9]+)?\/[a-zA-Z0-9_.-]*/g,
    description: 'Hardcoded database credentials in connection URI',
    severity: 'CRITICAL',
    confidence: 0.9
  },

  // 7. AI Providers & Cloud LLMs
  {
    id: 'SEC-011',
    name: 'Google AI Studio / Gemini API Key',
    secretType: 'GEMINI_API_KEY',
    regex: /AIzaSy[0-9A-Za-z_\-]{25,45}/g,
    description: 'Exposed Google Gemini / Cloud API Key',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-012',
    name: 'OpenAI API Secret Key',
    secretType: 'OPENAI_API_KEY',
    regex: /sk-(?:proj-|live-)?[a-zA-Z0-9]{32,64}/g,
    description: 'Exposed OpenAI API Secret Key',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-013',
    name: 'Anthropic Claude API Key',
    secretType: 'ANTHROPIC_API_KEY',
    regex: /sk-ant-[a-zA-Z0-9_\-]{32,}/g,
    description: 'Exposed Anthropic Claude API key',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-014',
    name: 'HuggingFace Access Token',
    secretType: 'HUGGINGFACE_TOKEN',
    regex: /hf_[a-zA-Z0-9]{34,}/g,
    description: 'Exposed Hugging Face User Access Token',
    severity: 'HIGH',
    confidence: 1.0
  },

  // 8. Package Managers & Registries
  {
    id: 'SEC-015',
    name: 'NPM Registry Access Token',
    secretType: 'NPM_TOKEN',
    regex: /npm_[a-zA-Z0-9]{36}/g,
    description: 'Exposed NPM Registry Auth Token',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-016',
    name: 'PyPI Upload Token',
    secretType: 'PYPI_TOKEN',
    regex: /pypi-AgEIcHlwaS5vcmc[A-Za-z0-9\-_]{50,}/g,
    description: 'Exposed PyPI Package Registry Upload Token',
    severity: 'CRITICAL',
    confidence: 1.0
  },

  // 9. Communications & Email
  {
    id: 'SEC-017',
    name: 'SendGrid API Key',
    secretType: 'SENDGRID_API_KEY',
    regex: /SG\.[a-zA-Z0-9_\-\.]{66}/g,
    description: 'Exposed SendGrid Mail API Key',
    severity: 'HIGH',
    confidence: 1.0
  },
  {
    id: 'SEC-018',
    name: 'Twilio Auth Token / Account SID',
    secretType: 'TWILIO_CREDENTIALS',
    regex: /(?:SK[0-9a-fA-F]{32}|AC[0-9a-fA-F]{32})/g,
    description: 'Exposed Twilio API Account SID / Secret Key',
    severity: 'HIGH',
    confidence: 0.95
  },

  // 10. Cloud Platforms (Azure / Supabase / GCP)
  {
    id: 'SEC-019',
    name: 'Azure Storage / Shared Access Key',
    secretType: 'AZURE_ACCOUNT_KEY',
    regex: /AccountKey=[a-zA-Z0-9+/=]{86,88}/g,
    description: 'Exposed Azure Storage Account Key',
    severity: 'CRITICAL',
    confidence: 1.0
  },
  {
    id: 'SEC-020',
    name: 'Supabase Service Role / Anon Key',
    secretType: 'SUPABASE_KEY',
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    description: 'Exposed Supabase JWT Auth or Service Role Key',
    severity: 'CRITICAL',
    confidence: 1.0
  },

  // 11. Generic Hardcoded Secrets & High Entropy Heuristics
  {
    id: 'SEC-021',
    name: 'Generic Hardcoded Password / Credential in Code Assignment',
    secretType: 'GENERIC_PASSWORD_ASSIGNMENT',
    regex: /(?:password|passwd|pwd|secret|api_key|apikey|auth_token|client_secret|private_key|secret_key|jwt_secret)\s*[:=]\s*['"]([^\s'"]{8,128})['"]/gi,
    description: 'Hardcoded secret or credential assigned in code variable',
    severity: 'HIGH',
    confidence: 0.85,
    minEntropy: 2.8
  },
  {
    id: 'SEC-022',
    name: 'JSON Web Token (JWT)',
    secretType: 'JWT_TOKEN',
    regex: /eyJ[A-Za-z0-9-_=]{10,}\.eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_.+/=]{10,}/g,
    description: 'Hardcoded JSON Web Token (JWT) with encoded claims & signature',
    severity: 'HIGH',
    confidence: 0.95
  }
];

const IGNORED_FILE_PATTERNS = [
  /\.env\.(example|sample|template|test|dist)$/i,
  /\.example$/i,
  /\.sample$/i,
  /\.template$/i,
  /\.md$/i,
  /\.markdown$/i,
  /(?:^|\/)(?:test|tests|__tests__|mocks|fixtures|spec|node_modules|\.git)\//i,
  /\.(test|spec)\.[a-zA-Z0-9]+$/i
];

const PLACEHOLDER_STRINGS = [
  'localhost',
  '127.0.0.1',
  'example.com',
  'dummy_token',
  'your_api_key',
  'your_secret_key',
  'insert_key_here',
  'changeme',
  'username:password',
  'user:pass',
  'admin:admin',
  'root:root'
];

export class SecretScanner {
  private patterns: SecretPattern[];

  constructor(customPatterns: SecretPattern[] = []) {
    this.patterns = [...DEFAULT_SECRET_PATTERNS, ...customPatterns];
  }

  private isIgnoredFile(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return IGNORED_FILE_PATTERNS.some((p) => p.test(normalized));
  }

  private isPlaceholderSecret(match: string): boolean {
    const lower = match.toLowerCase();
    return PLACEHOLDER_STRINGS.some((p) => lower.includes(p));
  }

  scanFile(
    filePath: string,
    content: string,
    orgId: string,
    repoId: string,
    prId?: string,
    reviewRunId?: string
  ): Finding[] {
    if (this.isIgnoredFile(filePath)) {
      return [];
    }

    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      for (const pattern of this.patterns) {
        pattern.regex.lastIndex = 0;
        const matches = line.matchAll(pattern.regex);

        for (const match of matches) {
          // If regex has a capturing group (e.g. for variable assignment values), evaluate that group
          const rawMatch = match[1] || match[0];

          if (this.isPlaceholderSecret(rawMatch)) {
            continue;
          }

          if (pattern.minEntropy) {
            const entropy = calculateShannonEntropy(rawMatch);
            if (entropy < pattern.minEntropy) {
              continue;
            }
          }

          const masked = maskSecret(rawMatch);
          const hash = hashSecret(rawMatch);
          const fingerprint = generateFindingFingerprint(pattern.id, filePath, `${lineNumber}:${hash}`);

          findings.push({
            id: `finding-sec-${fingerprint.slice(0, 12)}`,
            organizationId: orgId,
            repositoryId: repoId,
            pullRequestId: prId,
            reviewRunId: reviewRunId,
            fingerprint,
            severity: pattern.severity,
            category: 'SECRET',
            source: 'DETERMINISTIC',
            title: `${pattern.name} Detected`,
            description: `${pattern.description} (Pattern: ${pattern.id}). Masked preview: ${masked}`,
            filePath,
            startLine: lineNumber,
            endLine: lineNumber,
            evidence: `Line ${lineNumber}: ${line.replace(rawMatch, masked).trim()}`,
            impact: 'Unauthorized access, credential compromise, lateral movement, or data exfiltration.',
            recommendation: 'Immediately revoke and rotate the exposed secret. Store credentials in environment variables or a secure Secrets Manager.',
            ruleId: pattern.id,
            confidence: pattern.confidence,
            blocking: true,
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    return findings;
  }

  scanDirectory(dirPath: string, orgId: string, repoId: string, maxFiles = 100): Finding[] {
    const findings: Finding[] = [];
    if (!fs.existsSync(dirPath)) return findings;

    const walk = (currentDir: string, count = 0): number => {
      if (count >= maxFiles) return count;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (count >= maxFiles) break;
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;

        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          count = walk(fullPath, count);
        } else if (entry.isFile()) {
          count++;
          try {
            const stats = fs.statSync(fullPath);
            if (stats.size <= 1024 * 1024) {
              const content = fs.readFileSync(fullPath, 'utf8');
              const relPath = path.relative(dirPath, fullPath).replace(/\\/g, '/');
              const fileFindings = this.scanFile(relPath, content, orgId, repoId);
              findings.push(...fileFindings);
            }
          } catch {}
        }
      }
      return count;
    };

    walk(dirPath);
    return findings;
  }
}
