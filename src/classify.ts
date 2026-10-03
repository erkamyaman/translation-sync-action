export interface ChangedFile {
  filename: string;
  status: string;
  previous_filename?: string;
}

export interface Groups {
  content: ChangedFile[];
  infra: Map<string, ChangedFile[]>;
}

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function underAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path.startsWith(prefix));
}

export function groupFiles(files: ChangedFile[], paths: string[], contentPaths: string[]): Groups {
  const groups: Groups = { content: [], infra: new Map() };
  for (const file of files) {
    if (!underAny(file.filename, paths)) continue;
    if (underAny(file.filename, contentPaths)) {
      groups.content.push(file);
      continue;
    }
    const area = file.filename.split('/').slice(0, 3).join('/');
    const bucket = groups.infra.get(area) ?? [];
    bucket.push(file);
    groups.infra.set(area, bucket);
  }
  groups.content.sort((a, b) => a.filename.localeCompare(b.filename));
  return groups;
}

export function countFiles(groups: Groups): number {
  let total = groups.content.length;
  for (const bucket of groups.infra.values()) total += bucket.length;
  return total;
}
