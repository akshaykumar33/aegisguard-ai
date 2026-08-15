import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { config } from '@codeguard/config';

async function main(): Promise<void> {
  const formattedKey = config.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.GITHUB_APP_ID,
      privateKey: formattedKey
    }
  });

  const { data: installations } = await appOctokit.apps.listInstallations();
  if (installations.length === 0) {
    console.log('No installations found.');
    return;
  }

  const inst = installations[0];

  const installationOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.GITHUB_APP_ID,
      privateKey: formattedKey,
      installationId: inst.id
    }
  });

  const { data: repoData } = await installationOctokit.apps.listReposAccessibleToInstallation();

  console.log(`Checking open Pull Requests across ${repoData.repositories.length} repos in [${inst.account?.login || 'unknown'}]...`);

  for (const repo of repoData.repositories) {
    const { data: prs } = await installationOctokit.pulls.list({
      owner: repo.owner.login,
      repo: repo.name,
      state: 'open'
    });

    if (prs.length > 0) {
      console.log(`\n📌 Found ${prs.length} open PR(s) in [${repo.full_name}]:`);
      for (const pr of prs) {
        console.log(`   - #${pr.number}: "${pr.title}" (URL: ${pr.html_url})`);
      }
    }
  }
}

main().catch(console.error);
