import { describe, it, expect } from 'vitest';
import { SecretScanner, calculateShannonEntropy } from './secretScanner.js';
import { SensitiveDataScanner, validateLuhn } from './sensitiveDataScanner.js';
import { SastScanner } from './sastScanner.js';
import { DependencyScanner } from './dependencyScanner.js';
import { SecurityOrchestrator } from './orchestrator.js';

describe('Security Scanner Engine & Multi-Form Credential Detection', () => {
  const secretScanner = new SecretScanner();
  const sensitiveScanner = new SensitiveDataScanner();
  const sastScanner = new SastScanner();
  const depScanner = new DependencyScanner();
  const orchestrator = new SecurityOrchestrator();

  it('should detect exposed AWS Access Keys, Gemini Keys, GitHub PATs, and Private Keys', () => {
    const codeWithSecrets = `
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
      const geminiKey = "AIzaSyD9876543210abcdefghijklmnopqrs";
      const ghToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
      const privateKey = "-----BEGIN RSA PRIVATE KEY----- MIIEowIBAAKCAQEA...";
      const dbUrl = "postgres://admin:SuperSecretPass123!@db.internal:5432/production";
    `;

    const findings = secretScanner.scanFile('config/keys.ts', codeWithSecrets, 'org-1', 'repo-1');
    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(findings.every((f) => f.category === 'SECRET')).toBe(true);
    expect(findings.some((f) => f.title.includes('AWS Access Key'))).toBe(true);
    expect(findings.some((f) => f.title.includes('GitHub Personal Access Token'))).toBe(true);
    expect(findings.some((f) => f.title.includes('Private Encryption Key'))).toBe(true);
    expect(findings.some((f) => f.title.includes('Database Connection String'))).toBe(true);
  });

  it('should calculate Shannon entropy accurately to identify high-entropy tokens', () => {
    const lowEntropy = calculateShannonEntropy('aaaaaaaaaaaaaaaa');
    const highEntropy = calculateShannonEntropy('d9F$k2#Lp9!vMx8@wQz3');
    expect(lowEntropy).toBe(0);
    expect(highEntropy).toBeGreaterThan(3.5);
  });

  it('should detect sensitive PII, Luhn-validated Credit Cards, and SSNs', () => {
    // Valid test Visa number (Luhn valid)
    expect(validateLuhn('4532-0150-1234-5671')).toBe(true);
    expect(validateLuhn('1234-5678-9012-3456')).toBe(false);

    const sensitiveSnippet = `
      const testCard = "4532-0150-1234-5671";
      const userSsn = "123-45-6789";
      const internalHost = "https://vault.corp.internal/api/v1";
    `;

    const findings = sensitiveScanner.scanFile('src/users.ts', sensitiveSnippet, 'org-1', 'repo-1');
    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.some((f) => f.title.includes('Credit / Debit Card'))).toBe(true);
    expect(findings.some((f) => f.title.includes('Social Security Number'))).toBe(true);
    expect(findings.some((f) => f.title.includes('Internal Corporate Endpoint'))).toBe(true);
  });

  it('should detect SQL Injection, Command Injection, and dynamic eval', () => {
    const vulnerableCode = `
      // SQL Injection
      const result = await db.query("SELECT * FROM users WHERE id = " + req.query.id);

      // Command Injection
      child_process.exec("ping " + req.params.host);

      // Dynamic eval
      eval(req.body.code);
    `;

    const findings = sastScanner.scanFile('src/routes.ts', vulnerableCode, 'org-1', 'repo-1');
    expect(findings.length).toBe(3);

    const titles = findings.map((f) => f.title);
    expect(titles.some((t) => t.includes('SQL Query'))).toBe(true);
    expect(titles.some((t) => t.includes('Command Execution'))).toBe(true);
    expect(titles.some((t) => t.includes('Dynamic Code Execution'))).toBe(true);
  });

  it('should detect vulnerable package dependencies in package.json', () => {
    const packageJson = JSON.stringify({
      name: 'my-app',
      dependencies: {
        'cross-spawn': '^7.0.0',
        'axios': '1.5.0'
      }
    });

    const findings = depScanner.scanManifest('package.json', packageJson, 'org-1', 'repo-1');
    expect(findings.length).toBe(2);
    expect(findings[0].category).toBe('DEPENDENCY');
    expect(findings[0].title).toContain('cross-spawn');
  });

  it('should run unified scanning across multiple files via SecurityOrchestrator', () => {
    const files = [
      { filePath: 'src/aws.ts', content: 'const key = "AKIAIOSFODNN7EXAMPLE";' },
      { filePath: 'src/db.ts', content: 'db.query("SELECT * FROM " + req.params.table);' }
    ];

    const findings = orchestrator.scanFiles(files, 'org-1', 'repo-1');
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });
});
