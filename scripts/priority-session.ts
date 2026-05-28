/**
 * @fileoverview Operator-facing session entrypoint for the file-overview standards workflow.
 * Owned by `ts-file-overviews`. Combines the root audit inventory, stale-metadata counts,
 * generic-`@see` counts, and top-ranked priority targets into a single ranked remediation queue
 * before manual accuracy review. Package scoping is driven by the host project's
 * `.ts-file-overviews.json` config — no package names are hardcoded here.
 *
 * @example
 * ```bash
 * # Run an interactive session for the top 15 targets
 * npx tsx skills/ts-file-overviews/scripts/priority-session.ts
 *
 * # JSON output for the top 10 targets across all packages
 * npx tsx skills/ts-file-overviews/scripts/priority-session.ts --limit 10 --json
 *
 * # Scope to a single package (name from .ts-file-overviews.json)
 * npx tsx skills/ts-file-overviews/scripts/priority-session.ts --package my-lib --limit 10
 * ```
 *
 * @testing CLI: `npx tsx skills/ts-file-overviews/scripts/priority-session.ts --limit 10`
 * @testing CLI: `npx tsx skills/ts-file-overviews/scripts/priority-session.ts --package my-lib --limit 10`
 * @see scripts/file-overview-standards/priority-targets.ts - Root ranking command whose scored targets are surfaced here as the main remediation queue.
 * @see skills/ts-file-overviews/scripts/target-update-brief.ts - Companion skill script that drills into one selected target after this session identifies it.
 * @documentation reviewed=2026-04-30 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import {
  fileOverview_findGenericSeeSuffixes,
  fileOverview_findStaleReviewDates,
  fileOverview_findStaleStandardVersions,
  fileOverview_loadInventory,
  fileOverview_rankPriorityTargets,
} from "../../../scripts/file-overview-standards/lib.js";

/**
 * Operator-controlled toggles and scoping knobs for this session after argv parsing.
 *
 * @remarks
 * Drives inventory filters and output mode; only flags understood by `parseArgs` populate this shape.
 */
type SessionArgs = {
  json: boolean;
  limit: number;
  packageFilter?: string;
  pathPrefix?: string;
};

/**
 * Interprets session argv tokens into structured options for the standards workflow.
 *
 * @remarks
 * PURITY: reads only the provided `argv` slice; unknown tokens are ignored without error.
 */
function parseArgs(argv: string[]): SessionArgs {
  let json = false;
  let limit = 15;
  let packageFilter: string | undefined;
  let pathPrefix: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--limit") {
      limit = Number(argv[index + 1] ?? "15");
      index += 1;
      continue;
    }
    if (argument.startsWith("--limit=")) {
      limit = Number(argument.slice("--limit=".length));
      continue;
    }
    if (argument === "--package") {
      packageFilter = argv[index + 1] ?? undefined;
      index += 1;
      continue;
    }
    if (argument.startsWith("--package=")) {
      packageFilter = argument.slice("--package=".length);
      continue;
    }
    if (argument === "--path-prefix") {
      pathPrefix = argv[index + 1] ?? undefined;
      index += 1;
      continue;
    }
    if (argument.startsWith("--path-prefix=")) {
      pathPrefix = argument.slice("--path-prefix=".length);
    }
  }

  return {
    json,
    limit,
    packageFilter,
    pathPrefix,
  };
}

/**
 * Runs the session: loads inventory, ranks remediation targets, prints JSON or operator guidance.
 *
 * @remarks
 * I/O: inventory and scoring run through imported helpers; results go to `process.stdout` only.
 */
function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const inventory = fileOverview_loadInventory({
    packageFilter: args.packageFilter,
    pathPrefix: args.pathPrefix,
  });
  const targets = fileOverview_rankPriorityTargets(
    inventory.records,
    args.limit,
  );
  const staleStandards = fileOverview_findStaleStandardVersions(
    inventory.records,
  );
  const staleReviews = fileOverview_findStaleReviewDates(inventory.records, 90);
  const genericSees = fileOverview_findGenericSeeSuffixes(inventory.records);

  if (args.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          currentStandardIdentifier: inventory.currentStandardIdentifier,
          generatedAt: inventory.generatedAt,
          genericSeeCount: genericSees.length,
          staleReviewCount: staleReviews.length,
          staleStandardCount: staleStandards.length,
          targets,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write("File Overview Standards Session\n");
  process.stdout.write(
    `Current standard: ${inventory.currentStandardIdentifier}\n`,
  );
  process.stdout.write(
    `Flagged files: ${inventory.summary.flaggedFileCount}/${inventory.summary.scannedFileCount}\n`,
  );
  process.stdout.write(`Stale standard tokens: ${staleStandards.length}\n`);
  process.stdout.write(`Reviewed>=90d: ${staleReviews.length}\n`);
  process.stdout.write(`Generic @see suffixes: ${genericSees.length}\n`);
  process.stdout.write(
    "Scope note: this queue prioritizes structural file-overview work but does not prove that existing documentation claims are still accurate.\n\n",
  );

  process.stdout.write("Top priority targets:\n");
  if (targets.length === 0) {
    process.stdout.write("- No matching targets.\n");
    return;
  }

  for (const [index, target] of targets.entries()) {
    process.stdout.write(
      `${index + 1}. score=${target.score} ${target.filePath} [${target.family}] ${target.scoreReasons.join(
        ", ",
      )}\n`,
    );
  }

  process.stdout.write("\nNext step: run the target brief for one file with:\n");
  process.stdout.write(
    "npx tsx skills/ts-file-overviews/scripts/target-update-brief.ts --file <repo-relative-path>\n",
  );
  process.stdout.write(
    "Then re-read the selected file end to end to verify retained file-overview claims and any related symbol-level JSDoc decisions against the current code.\n",
  );
}

main();
