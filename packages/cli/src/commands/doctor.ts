import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { LocalPolicyManager } from '../policyManager.js';
import { PolicyEngine } from '@codeguard/policy-engine';

export async function runDoctor(targetDir = process.cwd()): Promise<boolean> {
  console.log('\x1b[36m\n╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m║           CodeGuard Local Environment Health Doctor                ║\x1b[0m');
  console.log('\x1b[36m╚════════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  const checks: Array<{ name: string; status: 'PASS' | 'WARN' | 'FAIL'; details: string }> = [];

  // 1. Git Installation & Repo check
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir)) {
      checks.push({ name: 'Git Repository', status: 'PASS', details: `${gitVersion} (${targetDir})` });
    } else {
      checks.push({ name: 'Git Repository', status: 'FAIL', details: 'No .git directory found' });
    }
  } catch (err: any) {
    checks.push({ name: 'Git Binary', status: 'FAIL', details: err.message });
  }

  // 2. Git Hooks Check
  const gitDir = path.join(targetDir, '.git');
  const hooksDir = path.join(gitDir, 'hooks');
  const commitMsgHook = path.join(hooksDir, 'commit-msg');
  const prePushHook = path.join(hooksDir, 'pre-push');
  const preCommitHook = path.join(hooksDir, 'pre-commit');

  const hooksPresent = fs.existsSync(commitMsgHook) && fs.existsSync(prePushHook) && fs.existsSync(preCommitHook);
  if (hooksPresent) {
    checks.push({ name: 'Local Git Hooks', status: 'PASS', details: 'commit-msg, pre-push, pre-commit installed' });
  } else {
    checks.push({
      name: 'Local Git Hooks',
      status: 'WARN',
      details: 'Missing one or more hooks. Run "codeguard init" to repair.'
    });
  }

  // 3. Policy Cache & Digital Signature Check
  const policyCheck = LocalPolicyManager.loadPolicy(targetDir);
  if (policyCheck.isVerified) {
    checks.push({
      name: 'Organization Policy',
      status: 'PASS',
      details: `v${policyCheck.policy.version} (Cryptographic signature verified)`
    });
  } else {
    checks.push({
      name: 'Organization Policy',
      status: 'WARN',
      details: policyCheck.error || 'Policy signature unverified'
    });
  }

  // 4. Branch Naming Standard Check
  let currentBranch = 'unknown';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {}

  const isProtected = PolicyEngine.matchesProtectedBranch(currentBranch);
  const isCompliantName = /^(feature|fix|hotfix|chore|refactor|docs|test)\/[a-zA-Z0-9_\-./]+$/.test(currentBranch);

  if (isProtected) {
    checks.push({
      name: 'Active Branch',
      status: 'WARN',
      details: `"${currentBranch}" is a PROTECTED branch (Direct push is blocked on server & client)`
    });
  } else if (isCompliantName) {
    checks.push({
      name: 'Active Branch',
      status: 'PASS',
      details: `"${currentBranch}" complies with organization branch naming standard`
    });
  } else {
    checks.push({
      name: 'Active Branch',
      status: 'WARN',
      details: `"${currentBranch}" does not follow <type>/<description> convention`
    });
  }

  // 5. Server Connectivity / Git Remote
  let remoteOrigin = '';
  try {
    remoteOrigin = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
  } catch {}

  if (remoteOrigin) {
    checks.push({ name: 'Remote Git Provider', status: 'PASS', details: remoteOrigin });
  } else {
    checks.push({ name: 'Remote Git Provider', status: 'WARN', details: 'No remote origin configured' });
  }

  // Render Table
  console.log('| Check Name | Status | Diagnostic Details |');
  console.log('| :--- | :---: | :--- |');
  for (const c of checks) {
    const icon = c.status === 'PASS' ? '\x1b[32m✔ PASS\x1b[0m' : c.status === 'WARN' ? '\x1b[33m⚠ WARN\x1b[0m' : '\x1b[31m✖ FAIL\x1b[0m';
    console.log(`| ${c.name.padEnd(22)} | ${icon} | ${c.details} |`);
  }

  const allOk = checks.every((c) => c.status !== 'FAIL');
  console.log('\n' + (allOk ? '\x1b[32m✔ CodeGuard Local Health Check Completed: System is Healthy.\x1b[0m\n' : '\x1b[31m✖ Action Required on Failed Diagnostic Items.\x1b[0m\n'));

  return allOk;
}
