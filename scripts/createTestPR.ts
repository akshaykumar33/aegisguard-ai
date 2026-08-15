import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { config } from '@codeguard/config';

async function main(): Promise<void> {
  console.log('🔍 Connecting to GitHub with GitHub App credentials...');
  const formattedKey = config.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.GITHUB_APP_ID,
      privateKey: formattedKey
    }
  });

  // 1. List App Installations
  const { data: installations } = await appOctokit.apps.listInstallations();
  console.log(`Found ${installations.length} installation(s):`);

  if (installations.length === 0) {
    console.log('❌ No installations found. Please make sure the GitHub App is installed on an organization or repository.');
    return;
  }

  for (const inst of installations) {
    console.log(`\n🏢 Installation ID: ${inst.id} (Account: ${inst.account?.login || 'unknown'})`);

    const installationOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: config.GITHUB_APP_ID,
        privateKey: formattedKey,
        installationId: inst.id
      }
    });

    // 2. List Repositories accessible to this installation
    const { data: repoData } = await installationOctokit.apps.listReposAccessibleToInstallation({
      per_page: 10
    });

    console.log(`   Found ${repoData.repositories.length} repository(ies):`);
    for (const repo of repoData.repositories) {
      console.log(`   - 📁 ${repo.full_name} (Default branch: ${repo.default_branch})`);
    }

    if (repoData.repositories.length > 0) {
      const targetRepo = repoData.repositories[0];
      const owner = targetRepo.owner.login;
      const repo = targetRepo.name;
      const baseBranch = targetRepo.default_branch || 'main';

      console.log(`\n🚀 Raising a test Pull Request on [${targetRepo.full_name}]...`);

      // Get latest commit SHA of default branch
      const { data: refData } = await installationOctokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`
      });
      const baseSha = refData.object.sha;

      // Create new branch
      const branchName = `codeguard/test-security-review-${Date.now()}`;
      await installationOctokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      });
      console.log(`   ✅ Created branch: ${branchName}`);

      // Sample code with realistic features and intentional security bugs for CodeGuard to catch
      const testCode = `// CodeGuard Security & Review Test File
import express, { Request, Response } from 'express';
import crypto from 'crypto';

export const router = express.Router();

// 1. Hardcoded Secret Test (CodeGuard should detect and block)
export const TEST_AWS_KEY = "AKIAIOSFODNN7EXAMPLE";

// 2. Insecure Cryptography (MD5)
export function hashUserPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

// 3. User Lookup with SQL query string concatenation (SQL Injection)
router.get('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;
  const sql = "SELECT id, username, email FROM users WHERE id = '" + userId + "'";
  return res.json({ query: sql, status: 'simulated' });
});
`;

      // Create/Commit test file
      await installationOctokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'src/codeguard-test.ts',
        message: 'test: Add payment & auth helper with security test cases',
        content: Buffer.from(testCode).toString('base64'),
        branch: branchName
      });
      console.log('   ✅ Committed test file: src/codeguard-test.ts');

      // Create Pull Request
      const { data: pr } = await installationOctokit.pulls.create({
        owner,
        repo,
        title: '🛡️ CodeGuard AI Reviewer Test PR',
        head: branchName,
        base: baseBranch,
        body: `### CodeGuard Automated Review Test
This pull request was automatically created to test **CodeGuard Enterprise AI PR Reviewer**.

#### Changes Included:
1. Hardcoded AWS credential test pattern.
2. Insecure MD5 cryptographic hashing.
3. Unsanitized SQL query parameter interpolation.

CodeGuard should inspect this PR, evaluate security policies, and post check runs & inline feedback.`
      });

      console.log(`\n🎉 Pull Request created successfully!`);
      console.log(`🔗 PR URL: ${pr.html_url}`);
      console.log(`   PR Number: #${pr.number}`);
    }
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Error raising test PR:', message);
  process.exit(1);
});
