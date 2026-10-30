#!/usr/bin/env node

/**
 * Per-file review state — the single writer of `.review-state/review-state.json`
 * (#318 S16, from #218).
 *
 * The review loop asks "which files did this cycle actually read?". A model's
 * self-report answers that by assertion, and a skip is indistinguishable from a
 * file nobody opened. This script is the only writer: it derives the inventory
 * from git (never from a hand-written list), records each file's mark as
 * `reviewed@<sha>` or `skipped@<sha>` with a reason, reopens a skip the moment a
 * later commit touches that file, and answers coverage closure
 * (`inventory − reviewed − skipped = 0`) as an exit code.
 *
 * The state file is DERIVED and rebuildable: the markdown ledger stays canonical,
 * this is a receipt. Model passes read it; they never write it.
 *
 * Usage
 *   node scripts/review-state.mjs record --unit <slug> [--base <ref>] [--head <ref>] [--reset]
 *   node scripts/review-state.mjs mark   --unit <slug> --path <p> --status reviewed|skipped [--reason <r>]
 *   node scripts/review-state.mjs check  --unit <slug>
 *   node scripts/review-state.mjs show   --unit <slug>
 *
 * Exit: 0 ok / closure complete; 1 a usage error, a refused mark, an unknown
 * unit, or an open closure. Diagnostics go to stderr; `check` prints the block
 * a reviewer branches on.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// `REVIEW_STATE_REPO` re-points the script at a fixture tree, the same way
// `UNIT_ROUTE_REPO` does for the router: a suite proves the exit contract on a
// throwaway repository without writing into the checkout it runs from.
const REPO_ROOT = process.env.REVIEW_STATE_REPO
  ? path.resolve(process.env.REVIEW_STATE_REPO)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_DIR = () => path.join(REPO_ROOT, ".review-state");
const STATE_FILE = () => path.join(STATE_DIR(), "review-state.json");
const STATUSES = Object.freeze(["reviewed", "skipped"]);

function fail(message) {
  process.stderr.write(`REVIEW STATE — error\n${message}\n`);
  process.exit(1);
}

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function resolveRef(ref) {
  const sha = git("rev-parse", "--verify", "--quiet", `${ref}^{commit}`);
  if (!sha) fail(`cannot resolve ${ref} to a commit`);
  return sha;
}

/**
 * The affecting-path inventory: the files a cycle must account for. Computed from
 * git, so it cannot drift from the change it describes.
 */
function inventoryFor(base, head) {
  const out = git("diff", "--name-only", base, head);
  if (out === null) fail(`cannot diff ${base}..${head}`);
  return out.split("\n").map((line) => line.trim()).filter(Boolean).sort();
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE(), "utf8"));
  } catch {
    return null;
  }
}

function writeState(state) {
  fs.mkdirSync(STATE_DIR(), { recursive: true });
  fs.writeFileSync(STATE_FILE(), `${JSON.stringify(state, null, 2)}\n`);
}

function requireState(unit) {
  const state = readState();
  if (!state) fail("no review state — run `record` first");
  if (state.unit !== unit) fail(`review state belongs to ${state.unit}, not ${unit}`);
  return state;
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) fail(`${name} requires a value`);
  return value;
}

function commandRecord(argv) {
  const unit = flag(argv, "--unit");
  if (!unit) fail("record requires --unit");
  const base = flag(argv, "--base") ?? "HEAD~1";
  const head = flag(argv, "--head") ?? "HEAD";
  const baseSha = resolveRef(base);
  const headSha = resolveRef(head);
  const paths = inventoryFor(baseSha, headSha);
  const previous = readState();
  const keep = !argv.includes("--reset") && previous && previous.unit === unit
    ? new Map(previous.inventory.map((entry) => [entry.path, entry]))
    : new Map();

  const state = {
    unit,
    base: baseSha,
    head: headSha,
    inventory: paths.map((entry) => keep.get(entry) ?? {
      path: entry,
      status: "pending",
      mark: null,
      reason: null,
      at: null,
    }),
  };
  writeState(state);
  process.stdout.write(
    `recorded: ${unit}\nhead: ${headSha}\nbase: ${baseSha}\ninventory: ${paths.length} file(s)\n`,
  );
}

function commandMark(argv) {
  const unit = flag(argv, "--unit");
  if (!unit) fail("mark requires --unit");
  const target = flag(argv, "--path");
  if (!target) fail("mark requires --path");
  const status = flag(argv, "--status");
  if (!status) fail("mark requires --status");
  if (!STATUSES.includes(status)) fail(`unknown status ${status} — expected reviewed or skipped`);
  const reason = flag(argv, "--reason");
  // A skip with no reason is the defect the state exists to prevent: an
  // unexplained skip is a file nobody opened, wearing a decision's clothes.
  if (status === "skipped" && !reason) fail("a skipped mark requires --reason");

  const state = requireState(unit);
  const entry = state.inventory.find((candidate) => candidate.path === target);
  if (!entry) fail(`${target} is not in the inventory`);

  entry.status = status;
  entry.mark = `${status}@${state.head}`;
  entry.reason = reason ?? null;
  entry.at = new Date().toISOString();
  writeState(state);
  process.stdout.write(`${entry.mark} ${target}${reason ? ` — ${reason}` : ""}\n`);
}

/**
 * A mark is stale when a commit after the recorded head touched its file: the
 * skip or the review described an older tree, so it stops counting.
 */
function staleEntries(state, projectRoot) {
  const out = [];
  for (const entry of state.inventory) {
    if (entry.status === "pending") continue;
    const touched = git("rev-list", "--max-count=1", `${state.head}..HEAD`, "--", entry.path);
    if (touched) out.push({ entry, touched });
  }
  return out;
}

function closureOf(state, projectRoot) {
  const stale = staleEntries(state, projectRoot);
  const staleByPath = new Map(stale.map(({ entry, touched }) => [entry.path, touched]));
  const open = state.inventory.filter((entry) => entry.status === "pending" || staleByPath.has(entry.path));
  return { stale: staleByPath, open };
}

function commandCheck(argv) {
  const unit = flag(argv, "--unit");
  if (!unit) fail("check requires --unit");
  const state = requireState(unit);
  const { stale, open } = closureOf(state, REPO_ROOT);
  const reviewed = state.inventory.filter((entry) => entry.status === "reviewed").length;
  const skipped = state.inventory.filter((entry) => entry.status === "skipped").length;

  const lines = [
    `unit: ${unit}`,
    `head: ${state.head}`,
    `inventory: ${state.inventory.length}`,
    `reviewed: ${reviewed}`,
    `skipped: ${skipped}`,
    `closure: ${open.length === 0 ? "complete" : `open(${open.length})`}`,
  ];
  for (const entry of open) {
    const touched = stale.get(entry.path);
    lines.push(`  open: ${entry.path}${touched ? ` — stale skip (touched by ${touched.slice(0, 12)})` : " — never marked"}`);
  }
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(open.length === 0 ? 0 : 1);
}

function commandShow(argv) {
  const unit = flag(argv, "--unit");
  if (!unit) fail("show requires --unit");
  const state = requireState(unit);
  const lines = state.inventory.map(
    (entry) => `${entry.status.padEnd(8)} ${entry.path}${entry.reason ? ` — ${entry.reason}` : ""}`,
  );
  process.stdout.write(`${lines.join("\n")}\n`);
}

function main(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(
      "usage: node scripts/review-state.mjs record|mark|check|show [--unit <slug>] …\n\n"
      + "The single writer of .review-state/review-state.json: it derives the\n"
      + "affecting-path inventory from git, records reviewed@<sha> or skipped@<sha>,\n"
      + "reopens a skip a later commit invalidated, and answers coverage closure as\n"
      + "an exit code. Model passes read the file; they never write it.\n",
    );
    return;
  }
  const [command, ...rest] = argv;
  switch (command) {
    case "record": return commandRecord(rest);
    case "mark": return commandMark(rest);
    case "check": return commandCheck(rest);
    case "show": return commandShow(rest);
    default: fail(`unknown command ${command}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
