# translation-sync-action

Opens one issue in a translation fork listing the upstream files that changed since the fork last synced. Files under the content paths are listed as content; everything else under the tracked paths is grouped by area as dev infra.

## Use

Add the state file to the fork, with the upstream commit you last synced to:

```json
{ "lastSyncedSha": "0123456789abcdef0123456789abcdef01234567" }
```

Save it as `.github/translation-sync.json`, then add a workflow:

```yaml
name: Translation sync
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:
permissions:
  contents: read
  issues: write
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: erkamyaman/translation-sync-action@main
```

After a sync, set `lastSyncedSha` to the commit the issue names. The issue updates on every run and closes itself when nothing changed.

## Inputs

| Input | Default |
| --- | --- |
| `upstream-repo` | `angular/angular` |
| `upstream-branch` | `main` |
| `paths` | `adev/` |
| `content-paths` | `adev/src/content/` |
| `state-file` | `.github/translation-sync.json` |
| `issue-title` | `Upstream changes to translate` |
| `issue-label` | `translation-sync` |

## Develop

```sh
pnpm install
pnpm test
pnpm build
```

Commit `dist/` after building, because the action runs the bundle.
