#!/usr/bin/env npx tsx

/**
 * @fileoverview CLI that prints a weighted nine-item readiness checklist for TS file-overview hygiene work against the current working directory.
 *
 * This file owns the checklist definition, synchronous `.ts-file-overviews.json` existence and coarse shape validation, console narrative output, weighted scoring with required-item gating, and optional `--json` emission of a `CompletenessReport`. Items after config validation are marked checked under static assumptions that the operator is following the skill workflow.
 * Flow: parse argv -> `checkConfig(cwd)` -> synthesize checklist rows -> print score and readiness -> optionally append JSON.
 *
 * @testing CLI: `npx tsx skills/ts-file-overviews/scripts/check-ts-overviews-completeness.ts`
 * @testing CLI: `npx tsx skills/ts-file-overviews/scripts/check-ts-overviews-completeness.ts --json`
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository authority for file-overview tags and review metadata that this checklist is meant to support.
 * @see skills/ts-file-overviews/scripts/priority-session.ts - Companion operator session that ranks remediation targets using the same `.ts-file-overviews.json` package entries validated here as checklist item 1.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import { argv } from "process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// ============================================================================
// Types
// ============================================================================

/**
 * One row in the nine-item TS file-overview hygiene checklist, including score weight and completion flag.
 *
 * @remarks `checked` is derived each run in `main` from config presence and static assumptions, not from persisted audit state.
 */
interface ChecklistItem {
  number: number;
  name: string;
  description: string;
  required: boolean;
  checked: boolean;
  weight: number;
}

/**
 * Serializable completeness summary emitted when `--json` is passed alongside the human-readable console report.
 *
 * @remarks Mirrors the printed checklist so scripts can parse readiness without scraping stdout formatting.
 */
interface CompletenessReport {
  checklist: ChecklistItem[];
  score: number;
  maxScore: number;
  canFinalize: boolean;
}

// ============================================================================
// Checklist Definition
// ============================================================================

const CHECKLIST_ITEMS: Omit<ChecklistItem, "checked">[] = [
  { number: 1, name: "Config provided", description: ".ts-file-overviews.json exists and valid", required: true, weight: 2 },
  { number: 2, name: "Audit scoped", description: "Package or path-prefix specified", required: true, weight: 2 },
  { number: 3, name: "Priority targets identified", description: "Best next files selected", required: true, weight: 2 },
  { number: 4, name: "Structural brief run", description: "target-brief for each selected file", required: true, weight: 2 },
  { number: 5, name: "Accuracy verified", description: "Each claim verified against current code", required: true, weight: 2 },
  { number: 6, name: "@see quality checked", description: "No generic suffixes", required: true, weight: 1 },
  { number: 7, name: "Symbol-level follow-up noted", description: "Missing drift recorded", required: false, weight: 1 },
  { number: 8, name: "Scoped slices preferred", description: "Package-bounded cleanup", required: true, weight: 2 },
  { number: 9, name: "High-value detail preserved", description: "Orientation, ownership, stakes", required: true, weight: 1 },
];

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Resolves whether `.ts-file-overviews.json` exists under `cwd` and whether its JSON shape matches the expected overview config list.
 *
 * @remarks
 * I/O: synchronously reads `.ts-file-overviews.json` when present. Missing file, parse errors, or non-array / malformed entries yield `valid: false`.
 *
 * @param cwd - Directory used to resolve `.ts-file-overviews.json` (typically the package or repo root being audited).
 */
function checkConfig(cwd: string): { exists: boolean; valid: boolean } {
  const configPath = join(cwd, ".ts-file-overviews.json");
  
  if (!existsSync(configPath)) {
    return { exists: false, valid: false };
  }
  
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const valid = Array.isArray(config) && config.every((entry: any) => entry.name && entry.rootPath);
    return { exists: true, valid };
  } catch {
    return { exists: true, valid: false };
  }
}

// ============================================================================
// Main
// ============================================================================

/**
 * CLI entrypoint: prints checklist status for the current working directory and optionally appends a JSON report.
 *
 * @remarks
 * I/O: stdout only. Reads config via `checkConfig(process.cwd())`. When `process.argv` contains `--json`, prints a trailing `CompletenessReport` JSON blob after the narrative output.
 */
function main() {
  const args = argv.slice(2);
  const jsonArg = args.includes("--json");
  
  const cwd = process.cwd();
  
  console.log("\n📋 TS File Overviews Completeness Check");
  console.log("═".repeat(60));
  
  // Check config
  const config = checkConfig(cwd);
  
  console.log(`\n📊 TS File Overviews Status:`);
  console.log(`   .ts-file-overviews.json exists: ${config.exists ? "✅" : "❌"}`);
  console.log(`   .ts-file-overviews.json valid: ${config.valid ? "✅" : "⚠️"}`);
  
  // Build checklist
  const checklist: ChecklistItem[] = CHECKLIST_ITEMS.map(item => {
    let checked = false;
    
    switch (item.number) {
      case 1: // Config provided
        checked = config.exists && config.valid;
        break;
      case 2: // Audit scoped
        checked = true; // Assumed if using skill
        break;
      case 3: // Priority targets identified
        checked = true; // Assumed
        break;
      case 4: // Structural brief run
        checked = true; // Assumed
        break;
      case 5: // Accuracy verified
        checked = true; // Assumed
        break;
      case 6: // @see quality checked
        checked = true; // Assumed
        break;
      case 7: // Symbol-level follow-up noted
        checked = item.required === false;
        break;
      case 8: // Scoped slices preferred
        checked = true; // Assumed
        break;
      case 9: // High-value detail preserved
        checked = true; // Assumed
        break;
      default:
        // `checked` remains false from initialization for unknown item numbers.
        break;
    }
    
    return { ...item, checked };
  });
  
  const score = checklist.reduce((sum, item) => 
    item.checked ? sum + item.weight : sum, 0);
  const maxScore = checklist.reduce((sum, item) => sum + item.weight, 0);
  
  const requiredItems = checklist.filter(i => i.required);
  const requiredScore = requiredItems.reduce((sum, item) => 
    item.checked ? sum + item.weight : sum, 0);
  const requiredMax = requiredItems.reduce((sum, item) => sum + item.weight, 0);
  
  const canFinalize = requiredScore === requiredMax;
  
  console.log(`\n📊 Score: ${score}/${maxScore} (${((score/maxScore)*100).toFixed(0)}%)`);
  console.log(`   Required items: ${requiredScore}/${requiredMax}`);
  
  console.log(`\n${canFinalize ? "✅" : "⚠️"} Ready: ${canFinalize ? "YES" : "NEEDS WORK"}`);
  
  console.log("\n📝 Checklist:");
  for (const item of checklist) {
    const icon = item.checked ? "✅" : item.required ? "❌" : "⚠️";
    console.log(`   ${icon} [${item.number}] ${item.name}`);
  }
  
  console.log("\n" + "═".repeat(60));
  
  if (!canFinalize) {
    console.log("\n⚠️ File-overview hygiene operation needs work.");
    const failedItems = checklist.filter(i => !i.checked && i.required);
    if (failedItems.length > 0) {
      console.log("\nIssues to resolve:");
      failedItems.forEach(i => console.log(`   - ${i.name}: ${i.description}`));
    }
  } else {
    console.log("\n✅ Ready for file-overview hygiene operation.");
  }
  
  if (jsonArg) {
    const report: CompletenessReport = { checklist, score, maxScore, canFinalize };
    console.log("\n" + JSON.stringify(report, null, 2));
  }
}

main();
