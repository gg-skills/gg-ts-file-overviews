/**
 * @fileoverview Generates a structural per-file remediation brief that tells a human or agent
 * which TypeScript file-overview requirements are missing before the header is normalized to the
 * current standard. This script owns the "update one target safely" part of the file-overview
 * remediation workflow. Owned by `ts-file-overviews`.
 *
 * The brief is structural only, so every selected file still requires an end-to-end accuracy
 * review of its existing file-overview claims and any relevant symbol-level JSDoc.
 *
 * @testing CLI: host project `file-overview-standards:target-brief` npm script -- --file scripts/file-overview-standards/lib.ts
 * @testing CLI: host project `file-overview-standards:target-brief` npm script -- --file packages/my-lib/src/index.ts
 *
 * @see scripts/file-overview-standards/lib.ts - Shared scanner library that parses the selected file and exposes the diagnostics rendered in this brief.
 * @see host project's file-overview standards documentation - Canonical format document that defines the header order and metadata requirements summarized by this script.
 * @documentation reviewed=2026-04-30 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";

import {
  fileOverview_scanSource,
  fileOverview_loadCurrentStandardIdentifier,
} from "../../../scripts/file-overview-standards/lib.js";

/**
 * CLI configuration produced after parsing `target-brief` argv-style arguments.
 *
 * @remarks
 * `filePath` is normalized to forward slashes before being passed to the scanner.
 */
type BriefArgs = {
  filePath: string;
  json: boolean;
};

/**
 * Parses `--file` and optional `--json` from a process argv slice.
 *
 * @throws When `--file` is missing or resolves to an empty path after parsing.
 */
function parseArgs(argv: string[]): BriefArgs {
  let filePath = "";
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--file") {
      filePath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (argument.startsWith("--file=")) {
      filePath = argument.slice("--file=".length);
    }
  }

  if (!filePath) {
    throw new Error("--file <repo-relative-path> is required.");
  }

  return {
    filePath: filePath.replace(/\\/g, "/"),
    json,
  };
}

/**
 * Runs the structural file-overview scan for one target and prints JSON or a human-readable brief.
 *
 * @remarks
 * I/O: synchronous filesystem existence check and read; writes results to stdout.
 */
function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const absoluteFilePath = path.join(process.cwd(), args.filePath);
  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`File does not exist: ${args.filePath}`);
  }

  const record = fileOverview_scanSource({
    currentStandardIdentifier: fileOverview_loadCurrentStandardIdentifier(),
    filePath: args.filePath,
    sourceText: fs.readFileSync(absoluteFilePath, "utf8"),
  });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
    return;
  }

  process.stdout.write("File Overview Structural Target Brief\n");
  process.stdout.write(`File: ${record.filePath}\n`);
  process.stdout.write(`Family: ${record.family}\n`);
  process.stdout.write(`Example required: ${record.exampleRequired}\n`);
  process.stdout.write(
    `Current standard: ${record.currentStandardIdentifier}\n\n`,
  );
  process.stdout.write(
    "Scope: Structural brief only; it flags file-overview shape, ordering, and metadata "
      + "gaps but does not prove that existing claims are still correct.\n\n",
  );

  process.stdout.write("Issues:\n");
  if (record.diagnostics.length === 0) {
    process.stdout.write("- No structural issues detected.\n");
  } else {
    for (const diagnostic of record.diagnostics) {
      const lineDetails = diagnostic.line
        ? ` (line ${String(diagnostic.line)})`
        : "";
      process.stdout.write(
        `- ${diagnostic.code}${lineDetails}: ${diagnostic.message}\n`,
      );
    }
  }

  process.stdout.write("\nRequired header order:\n");
  process.stdout.write("- @fileoverview\n");
  process.stdout.write("- optional compact flow/state/matrix paragraph\n");
  if (record.exampleRequired) {
    process.stdout.write("- @example\n");
  }
  process.stdout.write("- @testing\n");
  process.stdout.write("- @see\n");
  process.stdout.write("- @documentation\n");

  process.stdout.write("\nRequired accuracy review:\n");
  process.stdout.write(
    "- Re-read the selected file end to end and verify every existing file-overview claim "
      + "against the current implementation.\n",
  );
  process.stdout.write(
    "- Review any relevant symbol-level JSDoc in the same file and update stale summaries, "
      + "remarks, tags, or examples before considering the remediation complete.\n",
  );

  process.stdout.write("\nVerification commands:\n");
  process.stdout.write(
    `- <host-project> file-overview-standards:target-brief -- --file ${record.filePath}\n`,
  );
  process.stdout.write(
    `- <host-project> file-overview-standards:priority-targets -- --path-prefix ${path.dirname(
      record.filePath,
    )}\n`,
  );
}

main();
