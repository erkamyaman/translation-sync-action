export interface SyncState {
  lastSyncedSha: string;
}

const SHA_PATTERN = /^[0-9a-f]{40}$/;

export function parseState(text: string): SyncState {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('The state file is not valid JSON.');
  }
  const sha = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>)['lastSyncedSha'] : undefined;
  if (typeof sha !== 'string' || !SHA_PATTERN.test(sha)) {
    throw new Error('The state file needs "lastSyncedSha" set to a full 40-character commit SHA.');
  }
  return { lastSyncedSha: sha };
}
