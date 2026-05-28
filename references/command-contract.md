# File Overview Standards Command Contract

This skill is anchored on the root audit family in `scripts/file-overview-standards/` and the
host project's file-overview standards documentation (consumer-supplied; not bundled with this skill).

## Root Audit Commands

### `npm run file-overview-standards:audit`

Purpose:

- inventory tracked `*.ts` and `*.tsx` files across the root repo and initialized submodules
- summarize flagged files by package, family, and diagnostic code
- list matching files in human-readable form

Useful flags:

- `--json`
- `--include-clean`
- `--limit <n>`
- `--package <name>` — must match a `name` entry in the host project's `.ts-file-overviews.json` config; validated at runtime against the config (no hardcoded values)
- `--path-prefix <repo-relative-prefix>`

### `npm run file-overview-standards:priority-targets`

Purpose:

- rank the highest-value normalization targets first
- weight structural failures together with file-family importance

Useful flags:

- `--json`
- `--limit <n>`
- `--package <name>`
- `--path-prefix <repo-relative-prefix>`

### `npm run file-overview-standards:stale-review-dates`

Purpose:

- find the oldest valid `reviewed=` metadata values
- support age-based hygiene passes

Useful flags:

- `--json`
- `--limit <n>`
- `--older-than-days <n>`
- `--package <name>`
- `--path-prefix <repo-relative-prefix>`

### `npm run file-overview-standards:stale-standard-version`

Purpose:

- find files whose `@documentation standard=` token is missing or behind the current standard
  identifier

Useful flags:

- `--json`
- `--limit <n>`
- `--package <name>`
- `--path-prefix <repo-relative-prefix>`

### `npm run file-overview-standards:generic-see-suffixes`

Purpose:

- find `@see` entries that still use banned label-only suffixes such as `High-stakes consumer`

Useful flags:

- `--json`
- `--limit <n>`
- `--package <name>`
- `--path-prefix <repo-relative-prefix>`

## Skill Workflow Commands

### `npx tsx skills/ts-file-overviews/scripts/priority-session.ts`

Purpose:

- run the root audit family as one operator-oriented session
- summarize flagged-file count, stale-standard count, stale-review count, and generic-`@see` count
- emit the top priority targets plus the next command to inspect a single file

Useful flags:

- `--json`
- `--limit <n>`
- `--package <name>`
- `--path-prefix <repo-relative-prefix>`

### `npm run file-overview-standards:target-brief -- --file <repo-relative-path>`

Purpose:

- inspect one file in detail before manual normalization
- report structural failures, whether `@example` is required, and the exact header order to apply

Useful flags:

- `--json`

## Output Intent

Human-readable output is the default for operator sessions.
Every command also supports `--json` so downstream scripts, lint rollouts, and automations can
consume the same audit surface without reparsing prose.
