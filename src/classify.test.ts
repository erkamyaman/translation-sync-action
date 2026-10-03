import { describe, expect, it } from 'vitest';
import { countFiles, groupFiles, splitList, type ChangedFile } from './classify.js';

const file = (filename: string, status = 'modified'): ChangedFile => ({ filename, status });

describe('splitList', () => {
  it('trims and drops empty items', () => {
    expect(splitList(' adev/ , ,.github/ ')).toEqual(['adev/', '.github/']);
  });
});

describe('groupFiles', () => {
  const paths = ['adev/'];
  const contentPaths = ['adev/src/content/'];

  it('splits content from dev infra and groups infra by area', () => {
    const groups = groupFiles(
      [
        file('adev/src/content/guide/signals.md'),
        file('adev/src/content/aria/aria-tree.json'),
        file('adev/src/app/core/app.ts'),
        file('adev/src/app/features/home.html'),
        file('adev/shared-docs/pipeline/shared/marked.mts'),
      ],
      paths,
      contentPaths,
    );
    expect(groups.content.map((f) => f.filename)).toEqual([
      'adev/src/content/aria/aria-tree.json',
      'adev/src/content/guide/signals.md',
    ]);
    expect([...groups.infra.keys()].sort()).toEqual(['adev/shared-docs/pipeline', 'adev/src/app']);
    expect(groups.infra.get('adev/src/app')?.length).toBe(2);
  });

  it('ignores files outside the tracked paths', () => {
    const groups = groupFiles([file('packages/core/src/x.ts'), file('adev/src/content/a.md')], paths, contentPaths);
    expect(countFiles(groups)).toBe(1);
  });
});
