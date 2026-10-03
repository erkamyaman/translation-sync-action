import { countFiles, type ChangedFile, type Groups } from './classify.js';

export interface ReportInput {
  upstreamRepo: string;
  base: string;
  head: string;
  groups: Groups;
}

const STATUS_LABEL: Record<string, string> = {
  added: 'new',
  removed: 'deleted',
  renamed: 'renamed',
  modified: 'changed',
};

function line(input: ReportInput, file: ChangedFile): string {
  const status = STATUS_LABEL[file.status] ?? file.status;
  const url = `https://github.com/${input.upstreamRepo}/blob/${input.head}/${file.filename}`;
  const renamed = file.previous_filename ? ` (was \`${file.previous_filename}\`)` : '';
  return `- [ ] [\`${file.filename}\`](${url}) ${status}${renamed}`;
}

export function buildIssueBody(input: ReportInput): string {
  const { groups } = input;
  const total = countFiles(groups);
  const compare = `https://github.com/${input.upstreamRepo}/compare/${input.base}...${input.head}`;
  const out: string[] = [
    `${total} upstream files changed since the last sync. [Full diff](${compare}).`,
    '',
    `Last synced: \`${input.base}\``,
    `Compared against: \`${input.head}\``,
  ];

  if (groups.content.length) {
    out.push('', `## Content (${groups.content.length})`, '', ...groups.content.map((file) => line(input, file)));
  }

  const areas = [...groups.infra.keys()].sort();
  if (areas.length) {
    const infraTotal = areas.reduce((sum, area) => sum + (groups.infra.get(area)?.length ?? 0), 0);
    out.push('', `## Dev infra (${infraTotal})`);
    for (const area of areas) {
      const files = groups.infra.get(area) ?? [];
      out.push('', `### ${area} (${files.length})`, '', ...files.map((file) => line(input, file)));
    }
  }

  out.push(
    '',
    '---',
    `After syncing, set \`lastSyncedSha\` in the state file to \`${input.head}\`.`,
  );
  return out.join('\n');
}
