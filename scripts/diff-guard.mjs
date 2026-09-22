#!/usr/bin/env node
/**
 * diff-guard.mjs — deterministic diff-size guard (feature 61, phase P5).
 *
 * Measures the diff between --base and HEAD (or worktree if dirty changes
 * exist). Enforces the phase budget (max-lines / max-files) and prints a
 * fixed, byte-stable block. Exit: 0 = PASS, 1 = BREACH, 2 = ERROR.
 *
 * Usage
 *   node diff-guard.mjs --base <git-ref> [--repo <path>] [--unit <label>]
 *                        [--max-lines N] [--max-files N] [--json]
 *
 * The script uses `git diff --numstat` to count authored changes only.
 * It counts staged changes (--cached, index vs base) and unstaged changes
 * (working tree vs index) separately so both sides of the working tree
 * are captured without double-counting.
 *
 * Renamed and binary rows (the `R` or `B` status / `100644 100644 0` /
 * `0 0` shapes) contribute one file but zero lines.
 *
 * Anti-gaming rule baked in as code: NEVER shrink a diff by deleting
 * comments, blank lines, docs or tests.
 *
 * Read-only: never writes, never calls the network, no external dependencies.
 * Deterministic: same repo state always produces the same output (no
 * timestamps, no hashes).
 */

import child_process from "node:child_process";
import process from "node:process";

const DEFAULT_MAX_LINES = 400;
const DEFAULT_MAX_FILES = 8;

/** Run a git command inside a repo directory and return { stdout, error }. */
function git(cmd, ...args) {
  const cwd = args.cwd || process.cwd();
  const opts = { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], cwd };
  try {
    const result = child_process.spawnSync(
      "git",
      [cmd, ...args.filter((a) => typeof a !== "object")],
      opts,
    );
    return {
      stdout: result.stdout,
      error: result.error,
      status: result.status,
      stderr: result.stderr,
    };
  } catch (err) {
    return { stdout: "", error: err, status: 1, stderr: err.message };
  }
}

/** Parse --numstat output into { additions, deletions, fileCount }. */
function parseNumstat(output) {
  let additions = 0;
  let deletions = 0;
  let fileCount = 0;
  if (!output) return { additions, deletions, fileCount };
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    fileCount += 1;
    const a = parts[0];
    const d = parts[1];
    if (a === "-" || d === "-") continue;
    additions += parseInt(a, 10) || 0;
    deletions += parseInt(d, 10) || 0;
  }
  return { additions, deletions, fileCount };
}

/**
 * Measure the diff between base and the current state (HEAD + worktree + staged).
 * Returns { additions, deletions, fileCount, lineCount, base, err } (err is a
 * string when the base is unknown or git fails).
 */
function measureDiff(base, repoCwd) {
  // Verify the base ref exists.
  const catFile = git("cat-file", "-e", base, { cwd: repoCwd });
  if (catFile.status !== 0) {
    return { err: `unknown base ref: ${base}` };
  }

  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalFiles = 0;

  // 1. Staged changes (index vs base).
  const staged = git("diff", "--numstat", "--cached", base, { cwd: repoCwd });
  if (staged.status === 0) {
    const s = parseNumstat(staged.stdout);
    totalAdditions += s.additions;
    totalDeletions += s.deletions;
    totalFiles += s.fileCount;
  }

  // 2. Unstaged worktree changes (working tree vs index).
  const worktree = git("diff", "--numstat", { cwd: repoCwd });
  if (worktree.status === 0) {
    const w = parseNumstat(worktree.stdout);
    totalAdditions += w.additions;
    totalDeletions += w.deletions;
    totalFiles += w.fileCount;
  }

  const lineCount = totalAdditions + totalDeletions;

  // The base label is the resolved short sha — authoritative, never a nearby
  // tag name: a receipt naming a different commit than the one measured is a
  // false record.
  const resolved = git("rev-parse", "--short", base, { cwd: repoCwd });
  const baseLabel = resolved.status === 0 ? resolved.stdout.trim() : base;

  return {
    additions: totalAdditions,
    deletions: totalDeletions,
    fileCount: totalFiles,
    lineCount,
    base: baseLabel,
  };
}

// The separator character used in the output block (U+00B7 MIDDLE DOT).
const SEP = "\u00b7";

/** Format the PASS block. */
function formatPass(unitLabel, lineCount, additions, deletions, fileCount, maxFiles) {
  return (
    `DIFF-GUARD PASS — ${unitLabel}\n` +
    `Lines: ${lineCount} (+${additions}/-${deletions}) ${SEP} Files: ${fileCount} (limit ${maxFiles})`
  );
}

/** Format the BREACH block. */
function formatBreach(unitLabel, lineCount, maxLines, fileCount, maxFiles) {
  return (
    `DIFF-GUARD BREACH — ${unitLabel}\n` +
    `Lines: ${lineCount} > ${maxLines} ${SEP} Files: ${fileCount} > ${maxFiles}\n` +
    "Anti-gaming: NEVER shrink a diff by deleting comments, blank lines, docs or\n" +
    "tests. One honest split attempted? If the unit still cannot fit, stop and\n" +
    "report the real count with an exception flag — never force the number.\n" +
    "\u2192 Next: re-triage the unit (/unit-lane <NN> re-triage) or record an exception"
  );
}

/** Format the ERROR block. */
function formatError(reason) {
  return `DIFF-GUARD ERROR — ${reason}`;
}

/** Format the JSON output. */
function formatJson(result, maxLines, maxFiles, error) {
  return JSON.stringify({
    lines: result.lineCount,
    files: result.fileCount,
    additions: result.additions,
    deletions: result.deletions,
    maxLines,
    maxFiles,
    breach: error || result.lineCount > maxLines || result.fileCount > maxFiles,
    base: result.base,
    error,
  });
}

/** Parse CLI arguments. */
function parseArgs(argv) {
  const args = {
    base: null,
    repo: process.cwd(),
    unit: null,
    maxLines: DEFAULT_MAX_LINES,
    maxFiles: DEFAULT_MAX_FILES,
    json: false,
  };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--base" && i + 1 < argv.length) {
      args.base = argv[++i];
    } else if (arg === "--repo" && i + 1 < argv.length) {
      args.repo = argv[++i];
    } else if (arg === "--unit" && i + 1 < argv.length) {
      args.unit = argv[++i];
    } else if (arg === "--max-lines" && i + 1 < argv.length) {
      args.maxLines = parseInt(argv[++i], 10) || DEFAULT_MAX_LINES;
    } else if (arg === "--max-files" && i + 1 < argv.length) {
      args.maxFiles = parseInt(argv[++i], 10) || DEFAULT_MAX_FILES;
    } else if (arg === "--json") {
      args.json = true;
    }
    i += 1;
  }
  return args;
}

/** Main entry point. */
function main(argv) {
  const parsed = parseArgs(argv);

  if (!parsed.base) {
    const msg = "missing --base argument";
    if (parsed.json) {
      process.stdout.write(
        formatJson(
          { lineCount: 0, fileCount: 0, additions: 0, deletions: 0, base: null },
          parsed.maxLines,
          parsed.maxFiles,
          msg,
        ) + "\n",
      );
    } else {
      process.stdout.write(formatError(msg) + "\n");
    }
    process.exitCode = 2;
    return;
  }

  const result = measureDiff(parsed.base, parsed.repo);

  if (result.err) {
    const msg = result.err;
    if (parsed.json) {
      process.stdout.write(
        formatJson(
          { lineCount: 0, fileCount: 0, additions: 0, deletions: 0, base: null },
          parsed.maxLines,
          parsed.maxFiles,
          msg,
        ) + "\n",
      );
    } else {
      process.stdout.write(formatError(msg) + "\n");
    }
    process.exitCode = 2;
    return;
  }

  const unitLabel = parsed.unit || `${parsed.base}..HEAD`;
  const breach = result.lineCount > parsed.maxLines || result.fileCount > parsed.maxFiles;

  if (parsed.json) {
    process.stdout.write(formatJson(result, parsed.maxLines, parsed.maxFiles) + "\n");
    process.exitCode = breach ? 1 : 0;
  } else if (breach) {
    process.stdout.write(
      formatBreach(
        unitLabel,
        result.lineCount,
        parsed.maxLines,
        result.fileCount,
        parsed.maxFiles,
      ) + "\n",
    );
    process.exitCode = 1;
  } else {
    process.stdout.write(
      formatPass(
        unitLabel,
        result.lineCount,
        result.additions,
        result.deletions,
        result.fileCount,
        parsed.maxFiles,
      ) + "\n",
    );
    process.exitCode = 0;
  }
}

// CLI guard: run only when invoked directly.
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith("diff-guard.mjs");
if (invokedDirectly) {
  main(process.argv.slice(2));
}
