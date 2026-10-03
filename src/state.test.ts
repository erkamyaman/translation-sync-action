import { describe, expect, it } from 'vitest';
import { parseState } from './state.js';

describe('parseState', () => {
  it('reads a valid state file', () => {
    const sha = 'c'.repeat(40);
    expect(parseState(JSON.stringify({ lastSyncedSha: sha }))).toEqual({ lastSyncedSha: sha });
  });

  it('rejects invalid JSON', () => {
    expect(() => parseState('{')).toThrow('not valid JSON');
  });

  it('rejects a missing or short SHA', () => {
    expect(() => parseState('{}')).toThrow('40-character');
    expect(() => parseState(JSON.stringify({ lastSyncedSha: 'abc123' }))).toThrow('40-character');
  });
});
