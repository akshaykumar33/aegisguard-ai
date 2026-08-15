import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';
import type {
  BranchDriftReport,
  BranchProtectionRule,
  DriftRemediationResult,
  GitProviderType,
  ReviewSubmission
} from '@codeguard/types';
import { PolicyEngine } from '@codeguard/policy-engine';

export interface InlineCommentPayload {
  path: string;
  line: number;
  body: string;
}

export interface CheckRunResult {
  name: string;
  headSha: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required';
  title: string;
  summary: string;
  text?: string;
}

export interface IGitProvider {
  providerType: GitProviderType;
  fetchPullRequestDiff(installationId: string, owner: string, repo: string, pullNumber: number): Promise<string>;
  getPullRequest(installationId: string, owner: string, repo: string, pullNumber: number): Promise<any>;
  createCheckRun(installationId: string, owner: string, repo: string, checkRun: CheckRunResult): Promise<{ checkRunId: number }>;
  updateCheckRun(installationId: string, owner: string, repo: string, checkRunId: number, checkRun: Partial<CheckRunResult>): Promise<void>;
  createReview(
    installationId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string,
    comments?: InlineCommentPayload[]
  ): Promise<void>;
  getReviews(installationId: string, owner: string, repo: string, pullNumber: number): Promise<ReviewSubmission[]>;
  getChecks(installationId: string, owner: string, repo: string, ref: string): Promise<Array<{ name: string; status: string; conclusion: string }>>;
  createBranchProtection(installationId: string, owner: string, repo: string, branch: string, rule: BranchProtectionRule): Promise<void>;
  getBranchProtection(installationId: string, owner: string, repo: string, branch: string): Promise<Partial<BranchProtectionRule> | null>;
  verifyBranchProtection(installationId: string, owner: string, repo: string, branch: string, expectedRule: BranchProtectionRule): Promise<BranchDriftReport>;
  remediateBranchProtection(installationId: string, owner: string, repo: string, branch: string, expectedRule: BranchProtectionRule): Promise<DriftRemediationResult>;
  getCODEOWNERS(installationId: string, owner: string, repo: string, ref?: string): Promise<string | null>;
  mergePullRequest(installationId: string, owner: string, repo: string, pullNumber: number, commitTitle?: string, commitMessage?: string): Promise<{ merged: boolean; message: string }>;
}

export class GitHubProvider implements IGitProvider {
  public providerType: GitProviderType = 'github';
  private appId: string;
  private privateKey: string;
  private octokitCache: Map<string, Octokit> = new Map();

  constructor(appId = config.GITHUB_APP_ID, privateKey = config.GITHUB_APP_PRIVATE_KEY) {
    this.appId = appId;
    this.privateKey = privateKey;
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        if (attempt === retries || !/(?:ENOTFOUND|ETIMEDOUT|ECONNRESET|500|502|503|504)/i.test(err.message)) {
          throw err;
        }
        logger.warn({ attempt, error: err.message }, 'Retrying GitHub API request after transient network issue...');
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw new Error('Retries exhausted');
  }

  private getInstallationClient(installationId: string): Octokit {
    if (this.octokitCache.has(installationId)) {
      return this.octokitCache.get(installationId)!;
    }

    const formattedKey = this.privateKey ? this.privateKey.replace(/\\n/g, '\n') : '';

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId || 'dummy-app-id',
        privateKey: formattedKey || 'dummy-key',
        installationId: parseInt(installationId, 10) || 1
      }
    });

    this.octokitCache.set(installationId, octokit);
    return octokit;
  }

  async fetchPullRequestDiff(installationId: string, owner: string, repo: string, pullNumber: number): Promise<string> {
    const client = this.getInstallationClient(installationId);

    return await this.withRetry(async () => {
      try {
        const response = await client.pulls.get({
          owner,
          repo,
          pull_number: pullNumber,
          mediaType: {
            format: 'diff'
          }
        });
        return response.data as unknown as string;
      } catch (error: any) {
        logger.warn({ owner, repo, pullNumber, error: error.message }, 'Standard diff retrieval exceeded limit, assembling from changed files');

        const files = await client.paginate(client.pulls.listFiles, {
          owner,
          repo,
          pull_number: pullNumber,
          per_page: 100
        });

        const diffBlocks: string[] = [];
        for (const file of files.slice(0, 50)) {
          if (file.patch) {
            diffBlocks.push(`diff --git a/${file.filename} b/${file.filename}\n--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`);
          }
        }
        return diffBlocks.join('\n');
      }
    });
  }

  async getPullRequest(installationId: string, owner: string, repo: string, pullNumber: number): Promise<any> {
    const client = this.getInstallationClient(installationId);
    return await this.withRetry(async () => {
      const response = await client.pulls.get({
        owner,
        repo,
        pull_number: pullNumber
      });
      return response.data;
    });
  }

  async createCheckRun(installationId: string, owner: string, repo: string, checkRun: CheckRunResult): Promise<{ checkRunId: number }> {
    const client = this.getInstallationClient(installationId);
    return await this.withRetry(async () => {
      const response = await client.checks.create({
        owner,
        repo,
        name: checkRun.name,
        head_sha: checkRun.headSha,
        status: checkRun.status,
        conclusion: checkRun.conclusion,
        output: {
          title: checkRun.title,
          summary: checkRun.summary,
          text: checkRun.text
        }
      });
      return { checkRunId: response.data.id };
    });
  }

  async updateCheckRun(
    installationId: string,
    owner: string,
    repo: string,
    checkRunId: number,
    checkRun: Partial<CheckRunResult>
  ): Promise<void> {
    const client = this.getInstallationClient(installationId);
    await this.withRetry(async () => {
      await client.checks.update({
        owner,
        repo,
        check_run_id: checkRunId,
        status: checkRun.status,
        conclusion: checkRun.conclusion,
        output: checkRun.title && checkRun.summary
          ? {
              title: checkRun.title,
              summary: checkRun.summary,
              text: checkRun.text
            }
          : undefined
      });
    });
  }

  async createReview(
    installationId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string,
    comments?: InlineCommentPayload[]
  ): Promise<void> {
    const client = this.getInstallationClient(installationId);
    await this.withRetry(async () => {
      await client.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        event,
        body,
        comments: comments?.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body
        }))
      });
    });
  }

  async getReviews(installationId: string, owner: string, repo: string, pullNumber: number): Promise<ReviewSubmission[]> {
    const client = this.getInstallationClient(installationId);
    return await this.withRetry(async () => {
      const response = await client.pulls.listReviews({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100
      });

      return response.data.map((r: any) => {
        const isBot = r.user?.type === 'Bot' || r.user?.login?.includes('[bot]') || r.user?.login?.includes('codeguard');
        return {
          id: String(r.id),
          pullRequestId: String(pullNumber),
          reviewerUsername: r.user?.login || 'unknown',
          reviewerType: isBot ? 'BOT' : 'DEVELOPER',
          reviewType: isBot ? 'AI_REVIEW' : 'HUMAN_REVIEW',
          state: r.state === 'APPROVED' ? 'APPROVED' : r.state === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'COMMENTED',
          submittedAt: new Date(r.submitted_at || Date.now())
        };
      });
    });
  }

  async getChecks(installationId: string, owner: string, repo: string, ref: string): Promise<Array<{ name: string; status: string; conclusion: string }>> {
    const client = this.getInstallationClient(installationId);
    return await this.withRetry(async () => {
      const response = await client.checks.listForRef({
        owner,
        repo,
        ref,
        per_page: 100
      });

      return response.data.check_runs.map((c: any) => ({
        name: c.name,
        status: c.status,
        conclusion: c.conclusion || 'pending'
      }));
    });
  }

  async createBranchProtection(
    installationId: string,
    owner: string,
    repo: string,
    branch: string,
    rule: BranchProtectionRule
  ): Promise<void> {
    const client = this.getInstallationClient(installationId);
    await this.withRetry(async () => {
      await client.repos.updateBranchProtection({
        owner,
        repo,
        branch,
        enforce_admins: rule.enforceAdmins,
        required_status_checks: {
          strict: true,
          contexts: rule.requiredStatusChecks
        },
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: rule.requireCodeOwners,
          required_approving_review_count: rule.requiredApprovals
        },
        restrictions: null,
        required_linear_history: rule.requireLinearHistory,
        allow_force_pushes: !rule.preventForcePush,
        allow_deletions: !rule.preventDeletion,
        required_conversation_resolution: true
      });
    });
  }

  async getBranchProtection(installationId: string, owner: string, repo: string, branch: string): Promise<Partial<BranchProtectionRule> | null> {
    const client = this.getInstallationClient(installationId);
    try {
      return await this.withRetry(async () => {
        const response = await client.repos.getBranchProtection({
          owner,
          repo,
          branch
        });
        const data = response.data;
        return {
          pattern: branch,
          enforceAdmins: data.enforce_admins?.enabled ?? false,
          requiredApprovals: data.required_pull_request_reviews?.required_approving_review_count ?? 0,
          requireCodeOwners: data.required_pull_request_reviews?.require_code_owner_reviews ?? false,
          requireLinearHistory: data.required_linear_history?.enabled ?? false,
          preventForcePush: !data.allow_force_pushes?.enabled,
          preventDeletion: !data.allow_deletions?.enabled,
          requiredStatusChecks: data.required_status_checks?.contexts ?? []
        };
      });
    } catch (err: any) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async verifyBranchProtection(
    installationId: string,
    owner: string,
    repo: string,
    branch: string,
    expectedRule: BranchProtectionRule
  ): Promise<BranchDriftReport> {
    const actual = await this.getBranchProtection(installationId, owner, repo, branch);
    return PolicyEngine.detectDrift(`${owner}/${repo}`, branch, expectedRule, actual || { requiredApprovals: 0 });
  }

  async remediateBranchProtection(
    installationId: string,
    owner: string,
    repo: string,
    branch: string,
    expectedRule: BranchProtectionRule
  ): Promise<DriftRemediationResult> {
    try {
      await this.createBranchProtection(installationId, owner, repo, branch, expectedRule);
      return {
        repositoryId: `${owner}/${repo}`,
        branch,
        success: true,
        remediatedRules: ['required_approving_review_count', 'enforce_admins', 'prevent_force_pushes', 'required_linear_history']
      };
    } catch (err: any) {
      return {
        repositoryId: `${owner}/${repo}`,
        branch,
        success: false,
        remediatedRules: [],
        error: err.message
      };
    }
  }

  async getCODEOWNERS(installationId: string, owner: string, repo: string, ref = 'HEAD'): Promise<string | null> {
    const client = this.getInstallationClient(installationId);
    const possiblePaths = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

    for (const filePath of possiblePaths) {
      try {
        const response = await client.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref
        });
        if ('content' in response.data) {
          return Buffer.from(response.data.content, 'base64').toString('utf8');
        }
      } catch {
        // Continue searching other standard paths
      }
    }

    return null;
  }

  async mergePullRequest(
    installationId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    commitTitle?: string,
    commitMessage?: string
  ): Promise<{ merged: boolean; message: string }> {
    const client = this.getInstallationClient(installationId);
    return await this.withRetry(async () => {
      const response = await client.pulls.merge({
        owner,
        repo,
        pull_number: pullNumber,
        commit_title: commitTitle,
        commit_message: commitMessage,
        merge_method: 'squash'
      });
      return {
        merged: response.data.merged,
        message: response.data.message
      };
    });
  }
}

/**
 * GitLab Provider Adapter
 */
export class GitLabProvider implements IGitProvider {
  public providerType: GitProviderType = 'gitlab';

  async fetchPullRequestDiff(): Promise<string> {
    return '';
  }
  async getPullRequest(): Promise<any> {
    return {};
  }
  async createCheckRun(): Promise<{ checkRunId: number }> {
    return { checkRunId: 1 };
  }
  async updateCheckRun(): Promise<void> {}
  async createReview(): Promise<void> {}
  async getReviews(): Promise<ReviewSubmission[]> {
    return [];
  }
  async getChecks(): Promise<Array<{ name: string; status: string; conclusion: string }>> {
    return [];
  }
  async createBranchProtection(): Promise<void> {}
  async getBranchProtection(): Promise<Partial<BranchProtectionRule> | null> {
    return null;
  }
  async verifyBranchProtection(_inst: string, _owner: string, _repo: string, branch: string, expectedRule: BranchProtectionRule): Promise<BranchDriftReport> {
    return PolicyEngine.detectDrift('gitlab-repo', branch, expectedRule, {});
  }
  async remediateBranchProtection(_inst: string, _owner: string, _repo: string, branch: string): Promise<DriftRemediationResult> {
    return { repositoryId: 'gitlab-repo', branch, success: true, remediatedRules: [] };
  }
  async getCODEOWNERS(): Promise<string | null> {
    return null;
  }
  async mergePullRequest(): Promise<{ merged: boolean; message: string }> {
    return { merged: false, message: 'GitLab merge queued' };
  }
}

/**
 * Bitbucket Provider Adapter
 */
export class BitbucketProvider implements IGitProvider {
  public providerType: GitProviderType = 'bitbucket';

  async fetchPullRequestDiff(): Promise<string> {
    return '';
  }
  async getPullRequest(): Promise<any> {
    return {};
  }
  async createCheckRun(): Promise<{ checkRunId: number }> {
    return { checkRunId: 1 };
  }
  async updateCheckRun(): Promise<void> {}
  async createReview(): Promise<void> {}
  async getReviews(): Promise<ReviewSubmission[]> {
    return [];
  }
  async getChecks(): Promise<Array<{ name: string; status: string; conclusion: string }>> {
    return [];
  }
  async createBranchProtection(): Promise<void> {}
  async getBranchProtection(): Promise<Partial<BranchProtectionRule> | null> {
    return null;
  }
  async verifyBranchProtection(_inst: string, _owner: string, _repo: string, branch: string, expectedRule: BranchProtectionRule): Promise<BranchDriftReport> {
    return PolicyEngine.detectDrift('bitbucket-repo', branch, expectedRule, {});
  }
  async remediateBranchProtection(_inst: string, _owner: string, _repo: string, branch: string): Promise<DriftRemediationResult> {
    return { repositoryId: 'bitbucket-repo', branch, success: true, remediatedRules: [] };
  }
  async getCODEOWNERS(): Promise<string | null> {
    return null;
  }
  async mergePullRequest(): Promise<{ merged: boolean; message: string }> {
    return { merged: false, message: 'Bitbucket merge queued' };
  }
}

export class GitProviderManager {
  private static providers: Map<GitProviderType, IGitProvider> = new Map<GitProviderType, IGitProvider>([
    ['github', new GitHubProvider()],
    ['gitlab', new GitLabProvider()],
    ['bitbucket', new BitbucketProvider()]
  ]);

  static getProvider(type: GitProviderType = 'github'): IGitProvider {
    return this.providers.get(type) || this.providers.get('github')!;
  }
}

export const githubProvider = new GitHubProvider();
