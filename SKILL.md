---
name: ts-file-overviews
description: when configuring TypeScript/TSX file-overview hygiene — repeatable inventory, prioritization, factual review, per-file remediation brief against repo standard. MCP-compatible. Not for non-TypeScript.
---

# GG → TS File Overviews → Standards

> **Snapshot age:** standard version reviewed `2026-04-30`.
> Verify release-sensitive answers with the host project's file-overview
> standards documentation before responding with high confidence.
> Consumers must supply their own documentation standards reference — see
> [Configuration](#configuration) below.

## Overview

Use this skill when TypeScript or TSX file-overview hygiene is in scope and the
work needs a repeatable inventory, prioritization pass, factual review, or
per-file remediation brief. It is the workflow wrapper around the host project's
`scripts/file-overview-standards/` family and the consumer-provided format
source of truth.

Use the host project's JSDoc documentation standard alongside this skill
whenever the selected files also need a decision about symbol-level operational
JSDoc coverage, accuracy, or follow-up ownership.

For a direct command lookup, see [Quick Commands](#quick-commands) below.

## Configuration

Consumers must provide a `.ts-file-overviews.json` config file in the host project's root. This
file lists the packages the scripts will scan and prioritize.

**Format:**

```json
[
  { "name": "root", "rootPath": "." },
  { "name": "my-lib", "rootPath": "packages/my-lib", "tsconfigPath": "packages/my-lib/tsconfig.json" }
]
```

Each entry:

- `name` — the identifier used with `--package <name>` flag; must be unique.
- `rootPath` — path relative to the repo root where the package lives.
- `tsconfigPath` — optional; path to a tsconfig for that package if it differs from the root.

Scripts load this config at runtime and validate `--package <name>` against it. No hardcoded
package names exist in the scripts themselves.

## When to Use This Skill

**TRIGGER when:**
- A user asks to audit, review, fix, or normalize TypeScript file-overview headers.
- The task involves `@fileoverview`, `@testing`, `@see`, or `@documentation` tags in `.ts` or `.tsx` files.
- A user references the host project's file-overview standards documentation.
- A code review or lint output flags stale file-overview metadata or generic `@see` suffixes.

**SKIP when:**
- The task is about runtime behavior, business logic, or general code quality (not documentation headers).
- The files are not TypeScript or TSX.
- The task is purely about JSDoc on individual symbols without any file-level header review.

## Quick Commands

```bash
# Run an interactive session for the top 15 targets
npx tsx skills/ts-file-overviews/scripts/priority-session.ts --limit 15

# JSON output for the top 10 targets across all packages
npx tsx skills/ts-file-overviews/scripts/priority-session.ts --limit 10 --json

# Scope to a single package (name must match an entry in .ts-file-overviews.json)
npx tsx skills/ts-file-overviews/scripts/priority-session.ts --package my-lib --limit 10
```

For the full command surface and flag reference, see `references/command-contract.md`.

## Common Misconceptions

| # | Misconception | Correction | Key concept |
|---|---------------|------------|-------------|
| 1 | A clean audit result means the file overview is accurate. | The audit checks structure and metadata only; every claim must still be verified against the current code. | Structural vs. accuracy review |
| 2 | File-overview work is only about fixing tag order. | Tag order is necessary but not sufficient; stale claims must be rewritten or removed even when the structure is valid. | Claim accuracy |
| 3 | Bulk repo-wide header rewrites are preferred. | Prefer small, package-bounded cleanup slices to reduce risk and review burden. | Scoped slices |
| 4 | Existing `@see` entries can be preserved without inspection. | Generic or label-only `@see` suffixes are banned; each `@see` must say why the target matters. | `@see` quality |
| 5 | Symbol-level JSDoc is out of scope for file-overview review. | If file-overview review exposes symbol-level drift, either update it or record a clear handoff note. | Symbol-level follow-up |
| 6 | Config not needed for script execution | .ts-file-overviews.json is required | Config-driven |

## Non-Negotiable Policy

1. Use the audit commands as the source of truth for inventory and prioritization; do not build ad-hoc grep-only inventories first.
2. Never reconstruct shell commands, CLI flags, or setup steps from memory -- always read `references/command-contract.md` or the canonical docs first.
3. Treat the host project's file-overview standards documentation as the canonical format source before editing any file header.
4. Do not treat a clean audit result or an existing header as proof that the current file-overview prose is still correct. Re-check every retained claim against the current file and nearby authority files.
5. Preserve high-value orientation detail (flow, ownership, contract shape, operational stakes, variant semantics, realistic examples, distinct testing modes, authoritative `@see` descriptions). Do not delete it unless you replace it with equal or better information.
6. Prefer small, package-bounded cleanup slices instead of repo-wide bulk rewrites.
7. For any answer about the current file-overview standard version or required tags: verify with the host project's file-overview standards documentation before stating specifics.
8. Hand off to the host project's documentation-sync workflow when a normalization pass also changes adjacent docs, guidance files, or workflow prompts.

## Command Decision Guide

| Scenario | Recommended command |
|----------|---------------------|
| First pass: see overall health | `npx tsx skills/ts-file-overviews/scripts/priority-session.ts --limit 15` |
| Find the best next target to fix | host project `file-overview-standards:priority-targets` script |
| Check one file before editing | host project `file-overview-standards:target-brief -- --file <repo-relative-path>` script |
| Find stale standard versions | host project `file-overview-standards:stale-standard-version` script |
| Find old review dates | host project `file-overview-standards:stale-review-dates` script |
| Find generic `@see` suffixes | host project `file-overview-standards:generic-see-suffixes` script |

**Rule of thumb:** Start with `session` for orientation, then use `target-brief` before editing any file.

## Workflow

1. **Inventory the scope.**

   - Run `priority-session.ts` or the underlying audit commands.
   - Use `--package` or `--path-prefix` to keep the slice bounded.
   - Treat the audit output as a prioritization surface, not as a substitute for verifying whether existing prose is still true.

2. **Pick a target file.**

   - Use `file-overview-standards:priority-targets` to rank the best next targets.
   - Prefer entry points, shared contracts, registries, factories, reusable utilities, route handlers, and complex pipelines first.

3. **Generate a remediation brief.**

   - Run:

     ```bash
     npm run file-overview-standards:target-brief -- --file <repo-relative-path>
     ```

   - Use the brief to confirm whether `@example` is required, which structural issues are present, and which tag order should be applied.

4. **Re-check the current file-overview claims.**

   - Read the selected file and enough adjacent source, tests, and authority references to verify the current header line by line before preserving any of it.
   - Confirm whether the existing file overview still accurately describes the ownership boundary, primary agent-facing operations, non-trivial control or data flow, verification steps and testing modes, `@see` authority references and high-stakes consumers, registry or variant descriptions, and any realistic examples already present.
   - If a retained line is no longer true, rewrite or delete it even if the audit tools did not flag that specific sentence.

5. **Decide whether symbol-level JSDoc review is part of the slice.**

   - Compare the file-level claims with the exported symbols and major orchestrators in the file.
   - If the file-overview review exposes missing, stale, or misplaced symbol-level operational detail, either update the relevant symbol-level JSDoc in the same task when that work is in scope, or record a clear handoff note that names the symbol or responsibility to review under `docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_JSDOC.md`.
   - If no symbol-level follow-up is needed, note that conclusion explicitly so the pass does not read as "file overview only" by omission.

6. **Normalize the header.**

   - Apply the header changes directly in the target file.
   - Keep the header concise but information-dense and aligned with the current standard.
   - Preserve the strongest orientation cues before removing detail: flow summaries, ownership details, realistic examples, distinct testing modes, operationally useful `@see` descriptions, authority references, high-stakes-consumer framing, and per-variant registry descriptions.
   - Do not delete lines that explain flow, ownership, contract shape, operational stakes, or variant semantics unless you replace them with equal or better information.
   - Do not replace realistic examples with placeholders such as `{} as never`.
   - Do not preserve banned generic `@see` suffixes.
   - Do not preserve stale-but-well-structured prose just because the tag order already passes.

   Compression review before saving:

   - If a removed line carried first-glance orientation value, did you replace it with something at least as informative?
   - If you kept a line, did you verify it is still true in the current code and authority surface?
   - If you shortened an example, does it still show the true contract shape?
   - If you shortened `@testing`, did you keep distinct validation modes that offer different value?
   - If you shortened `@see`, does it still say why the target matters instead of just naming it?
   - If an operational detail really belongs on a symbol, did you either move it there or record the symbol-level follow-up clearly?

7. **Re-run the audit commands for the same slice.**

   - Confirm the target disappeared from `priority-targets`.
   - Confirm stale-standard and generic-`@see` findings moved in the expected direction.
   - Note any remaining symbol-level JSDoc follow-up alongside the file-overview result.

## Task-Type Reference Loading

| Task type | Load these files | Skip |
|-----------|-----------------|------|
| Diagnostic / inspection-first | Run audit commands first; no reference files needed initially | `references/command-contract.md` until you know the specific command |
| Command lookup (flags, output intent) | `references/command-contract.md` | Workflow steps in SKILL.md |
| Per-file remediation | `references/command-contract.md` (for `target-brief` flags), then the target source file | Other reference files |
| Package-scoped cleanup | `references/command-contract.md`, then run scoped audit commands | Full-repo audit output |

For diagnostic requests, run the inspection commands first before loading any reference files. Load only the subset the task needs.

## Common Pitfalls

1. **Running a broad repo-wide audit without scoping.** Always use `--package` or `--path-prefix` to keep the result set actionable. Unscoped audits can return hundreds of files and stall the session.
2. **Treating the structural brief as sufficient.** The `target-brief` flags shape, ordering, and metadata gaps but does not prove that existing claims are still correct. The accuracy review in workflow step 4 is mandatory.
3. **Preserving generic `@see` labels.** Suffixes such as `High-stakes consumer` or `Authority` without context are banned. Replace them with descriptions that explain why the target matters.
4. **Replacing realistic examples with placeholders.** Do not substitute contract-valid examples with `{} as never` or generic snippets. If an example is stale, rewrite it to reflect the current contract shape.
5. **Deleting orientation detail to save lines.** Shortening a header is not the goal. If you remove a line that explains flow, ownership, or operational stakes, replace it with something at least as informative.
6. **Skipping symbol-level JSDoc follow-up.** When the file-overview review reveals missing or stale symbol-level detail, either update it in scope or leave an explicit handoff note.

## Troubleshooting

| Symptom | Likely cause and fix |
|---------|---------------------|
| `priority-targets` returns no matching targets. | All files in scope are structurally clean; try `--include-clean` or expand the scope with a broader `--path-prefix`. |
| `target-brief` throws "File does not exist". | The `--file` path must be repo-relative (e.g., `packages/my-lib/src/utils.ts`), not absolute. |
| Session shows 0 flagged files but stale standards exist. | The session prioritizes structural failures; run `stale-standard-version` separately for metadata-only gaps. |
| `--json` output is unexpectedly empty. | Verify the package name matches a `name` entry in `.ts-file-overviews.json` exactly. |
| `--package <name>` fails with "unknown package". | The name was not found in `.ts-file-overviews.json`; check spelling or add a new entry. |

## TS File Overviews Quality Checklist

Use this checklist before and during any file-overview hygiene operation.

| # | Checklist Item | Why It Matters | Gate |
|---|---------------|---------------|------|
| 1 | **Config provided** — .ts-file-overviews.json exists and valid | Script execution depends on config | Pre-audit |
| 2 | **Audit scoped** — Package or path-prefix specified | Prevents scope creep | Pre-audit |
| 3 | **Priority targets identified** — Best next files selected | Focuses effort | Draft |
| 4 | **Structural brief run** — target-brief for each selected file | Shapes remediation | Draft |
| 5 | **Accuracy verified** — Each claim verified against current code | Prevents stale claims | Draft |
| 6 | **@see quality checked** — No generic suffixes | Enforces @see standards | Draft |
| 7 | **Symbol-level follow-up noted** — Missing drift recorded | Prevents gaps | Draft |
| 8 | **Scoped slices preferred** — Package-bounded cleanup | Reduces risk | Closeout |
| 9 | **High-value detail preserved** — Orientation, ownership, stakes | Preserves knowledge | Closeout |

### Quality Tiers

| Tier | Criteria | Use When |
|------|----------|----------|
| **Minimal** | Items 1-3, 5, 8 | Quick priority pass |
| **Standard** | Items 1-6, 8 | Full remediation pass |
| **Full** | All 9 items | Complete hygiene review |

### Pre-Audit Verification

```
□ .ts-file-overviews.json exists and valid
□ Package or path-prefix scoped
□ Priority targets identified
□ Structural brief ready for each target
□ Accuracy review planned
```

## TS File Overviews Consistency Validator

Before finalizing, verify:

### Consistency Check Matrix

| Check | What to Verify | How to Fix |
|-------|---------------|------------|
| **Config vs Script** | Package name matches config entry | Update config |
| **Audit vs Scope** | Scope matches task scope | Re-scope |
| **Brief vs Accuracy** | Structural brief + accuracy review both done | Add accuracy check |
| **@see vs Standards** | No generic suffixes, meaningful descriptions | Update @see |

### Red Flags (Never Present)

- [ ] Unscoped repo-wide audit without --package or --path-prefix
- [ ] @see suffixes without context ("Authority", "High-stakes")
- [ ] Clean audit result treated as sufficient (no accuracy check)
- [ ] Orientation detail deleted without replacement
- [ ] Generic placeholders replacing realistic examples

## Local Corpus Layout

The `references/` directory contains **1 file** and has **no nested subfolders**.

### Command reference

- `command-contract.md` -- Precise flags, output intent, and the split between root audit commands and skill-level wrapper commands.

### Workflow scripts

- `scripts/priority-session.ts` -- Operator-facing session entrypoint that combines inventory, stale-metadata counts, and top-ranked priority targets into a single remediation queue.
- `scripts/target-update-brief.ts` -- Generates a structural per-file remediation brief before manual normalization.

### Agent definition

- `agents/openai.yaml` -- Agent definition for IDE skill surfacing.

## Related Documentation

- Host project's file-overview standards document -- Canonical format document that defines header order, metadata requirements, and tag semantics. Consumers must supply this; the skill does not bundle it.
- Host project's JSDoc standards document -- Canonical source for symbol-level operational JSDoc standards.
- Host project's documentation-sync workflow -- Hand off to this when a normalization pass also changes adjacent docs, guidance files, or workflow prompts.
