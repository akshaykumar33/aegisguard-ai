#!/usr/bin/env node
import { Command } from 'commander';
import {
  initHooks,
  runDoctor,
  displayStatus,
  runCheck,
  handleBranchCommand,
  handleCommitHelper,
  runLocalReview,
  validateCommitMsg,
  validatePrePush,
  validateBranchName,
  validatePreCommit
} from '../dist/index.js';

const program = new Command();

program
  .name('codeguard')
  .alias('orgcode')
  .description('CodeGuard & OrgCode Enterprise CLI & Zero-Trust Git Guardrail Engine')
  .version('1.0.0');

// 1. init / install
program
  .command('init')
  .alias('install')
  .description('Install CodeGuard local git hooks, download signed policy, and verify repository protection')
  .action(async () => {
    const ok = await initHooks();
    process.exit(ok ? 0 : 1);
  });

// 2. doctor
program
  .command('doctor')
  .description('Run local diagnostics on git hooks, signed policy cache, and remote protection')
  .action(async () => {
    const ok = await runDoctor();
    process.exit(ok ? 0 : 1);
  });

// 3. status
program
  .command('status')
  .description('Display interactive developer governance status, PR reviews, and merge eligibility')
  .action(async () => {
    await displayStatus();
  });

// 4. check
program
  .command('check')
  .description('Execute full pre-flight verification: branch naming, secrets scan, commit formatting')
  .action(async () => {
    const ok = await runCheck();
    process.exit(ok ? 0 : 1);
  });

// 5. review
program
  .command('review')
  .description('Run local static analysis and security review on staged or modified files')
  .action(async () => {
    await runLocalReview();
  });

// 6. branch
program
  .command('branch [action] [branchName]')
  .description('Validate active branch name or create a standard-compliant branch')
  .action(async (action, branchName) => {
    const ok = await handleBranchCommand(action, branchName);
    process.exit(ok ? 0 : 1);
  });

// 7. commit
program
  .command('commit [message]')
  .description('Validate commit message against Conventional Commits or get suggestions')
  .action(async (message) => {
    const ok = await handleCommitHelper(message);
    process.exit(ok ? 0 : 1);
  });

// Git Hook Entry Points
program
  .command('hook:commit-msg <msgFile>')
  .description('Run commit-msg hook check against Conventional Commits')
  .action(async (msgFile) => {
    const ok = await validateCommitMsg(msgFile);
    process.exit(ok ? 0 : 1);
  });

program
  .command('hook:pre-push')
  .description('Run pre-push hook to block direct push to protected branches')
  .argument('[remote]', 'Remote repository name', 'origin')
  .argument('[url]', 'Remote repository URL', '')
  .action(async (remote, url) => {
    const ok = await validatePrePush(remote, url);
    process.exit(ok ? 0 : 1);
  });

program
  .command('hook:pre-commit')
  .description('Run pre-commit hook to scan staged files for secrets and check branch naming')
  .action(async () => {
    const branchOk = await validateBranchName();
    if (!branchOk) process.exit(1);
    const commitOk = await validatePreCommit();
    process.exit(commitOk ? 0 : 1);
  });

program
  .command('check-branch')
  .description('Validate current git branch against naming standards')
  .action(async () => {
    const ok = await validateBranchName();
    process.exit(ok ? 0 : 1);
  });

program.parse(process.argv);
