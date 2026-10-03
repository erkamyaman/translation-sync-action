import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { countFiles, groupFiles, splitList, type ChangedFile } from './classify.js';
import { buildIssueBody } from './issue-body.js';
import { parseState } from './state.js';

async function run(): Promise<void> {
  const token = core.getInput('github-token', { required: true });
  const upstream = core.getInput('upstream-repo');
  const branch = core.getInput('upstream-branch');
  const paths = splitList(core.getInput('paths'));
  const contentPaths = splitList(core.getInput('content-paths'));
  const stateFile = core.getInput('state-file');
  const title = core.getInput('issue-title');
  const label = core.getInput('issue-label');

  const [upstreamOwner, upstreamName] = upstream.split('/');
  if (!upstreamOwner || !upstreamName) throw new Error('upstream-repo must look like owner/name.');

  let stateText: string;
  try {
    stateText = await readFile(stateFile, 'utf8');
  } catch {
    throw new Error(`Cannot read ${stateFile}. Run actions/checkout first and add the file with lastSyncedSha.`);
  }
  const { lastSyncedSha } = parseState(stateText);

  const octokit = github.getOctokit(token);
  const head = (
    await octokit.rest.repos.getBranch({ owner: upstreamOwner, repo: upstreamName, branch })
  ).data.commit.sha;

  const changed: ChangedFile[] = [];
  const pages = octokit.paginate.iterator(octokit.rest.repos.compareCommitsWithBasehead, {
    owner: upstreamOwner,
    repo: upstreamName,
    basehead: `${lastSyncedSha}...${head}`,
    per_page: 100,
  });
  for await (const page of pages) {
    changed.push(...(page.data.files ?? []));
  }

  const groups = groupFiles(changed, paths, contentPaths);
  const total = countFiles(groups);
  core.setOutput('changed-files', String(total));
  core.setOutput('head-sha', head);

  const { owner, repo } = github.context.repo;
  const existing = await octokit.rest.issues.listForRepo({ owner, repo, labels: label, state: 'open', per_page: 1 });
  const current = existing.data[0];

  if (total === 0) {
    core.info('No tracked upstream files changed.');
    if (current) {
      await octokit.rest.issues.update({ owner, repo, issue_number: current.number, state: 'closed' });
    }
    return;
  }

  const body = buildIssueBody({ upstreamRepo: upstream, base: lastSyncedSha, head, groups });
  if (current) {
    await octokit.rest.issues.update({ owner, repo, issue_number: current.number, title, body });
    core.info(`Updated issue #${current.number}.`);
  } else {
    const created = await octokit.rest.issues.create({ owner, repo, title, body, labels: [label] });
    core.info(`Opened issue #${created.data.number}.`);
  }
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
