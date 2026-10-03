import { describe, expect, it } from 'vitest';
import { groupFiles } from './classify.js';
import { buildIssueBody } from './issue-body.js';

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);

describe('buildIssueBody', () => {
  const groups = groupFiles(
    [
      { filename: 'adev/src/content/guide/signals.md', status: 'modified' },
      { filename: 'adev/src/content/guide/new.md', status: 'added' },
      { filename: 'adev/src/app/home.ts', status: 'renamed', previous_filename: 'adev/src/app/old.ts' },
    ],
    ['adev/'],
    ['adev/src/content/'],
  );
  const body = buildIssueBody({ upstreamRepo: 'angular/angular', base, head, groups });

  it('lists content and dev infra sections with counts', () => {
    expect(body).toContain('3 upstream files changed');
    expect(body).toContain('## Content (2)');
    expect(body).toContain('## Dev infra (1)');
    expect(body).toContain('### adev/src/app (1)');
  });

  it('links each file at the head commit and notes status and renames', () => {
    expect(body).toContain(`https://github.com/angular/angular/blob/${head}/adev/src/content/guide/new.md`);
    expect(body).toContain('new');
    expect(body).toContain('(was `adev/src/app/old.ts`)');
  });

  it('links the full diff and says how to update the state', () => {
    expect(body).toContain(`https://github.com/angular/angular/compare/${base}...${head}`);
    expect(body).toContain(`set \`lastSyncedSha\` in the state file to \`${head}\``);
  });
});
