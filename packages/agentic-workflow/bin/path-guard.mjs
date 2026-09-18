#!/usr/bin/env node
// Tier 1 path-protection gate (feature 60).
//
// Deterministic, read-only, offline: it reads the effective policy, the plan
// declaration, the escape records, and the changed paths derived from git,
// evaluates every (path, operation) pair, and prints one fixed block. It writes
// nothing (the git reads use `--no-optional-locks`, so not even `.git/index`).
//
// usage: path-guard --unit <unit-dir> --phase <P<n>> [--base <ref>] [--help]
// prints:
//   PATH-GUARD <pass|fail> — <code>
//   offenders: <path:operation:reason[, …]|none>
//   phase: <P<n>> · freeze-after: <P<m>|none> · checked: <n>
//   DEGRADED — <code>: <detail>        (only when a degradation is reported)
// exit: 0 pass | 1 fail | 2 usage error

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  CHANGED_PATH_LIMIT,
  PATH_POLICY_MAX_BYTES,
  SHIPPED_PATH_POLICY,
  evaluatePathGuard,
  parsePathPolicy,
  parsePlanDeclaration,
  parseRecords,
  resolvePathPolicy,
} from "../src/path-policy.mjs";

const USAGE =
  "usage: path-guard --unit <unit-dir> --phase <P<n>> [--base <ref>] [--help]\n\n" +
  "  --unit <dir>    the unit directory holding the plan declaration and records\n" +
  "  --phase <P<n>>  the phase whose protected changes are checked\n" +
  "  --base <ref>    union the committed range <ref>..HEAD into the changed paths\n" +
  "  --help          print this usage and exit 0\n";

function gitOrNull(root, args) {
  const result = spawnSync("git", ["--no-optional-locks", "-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 ? result.stdout : null;
}

const PHASE_RE = /^P\d+$/;

/** Map a porcelain v1 `-z` status pair to an operation, or null. */
function operationFor(index, worktree) {
  if (index === "?" || worktree === "?") return "create";
  if (index === "A" || index === "C") return "create";
  if (index === "D") return "delete";
  if (index === "M" || index === "T" || index === "U" || index === "B") return "modify";
  return "modify";
}

function parsePorcelain(raw) {
  const changes = [];
  const tokens = raw.split("\0");
  for (let index = 0; index < tokens.length; index += 1) {
    const entry = tokens[index];
    if (entry === "") continue;
    const x = entry[0];
    const y = entry[1];
    const target = entry.slice(3);
    if (x === "R" || x === "C") {
      const original = tokens[(index += 1)] ?? "";
      changes.push({ path: target, operation: "create" });
      if (original !== "") changes.push({ path: original, operation: "delete" });
      continue;
    }
    if (target === "") continue;
    const operation = operationFor(x, y);
    if (operation === "rename") {
      changes.push({ path: target, operation: "create" });
      changes.push({ path: target, operation: "delete" });
      continue;
    }
    changes.push({ path: target, operation });
  }
  return changes;
}

function parseNameStatus(raw) {
  const changes = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    const cells = line.split("\t");
    const status = cells[0][0];
    if (status === "R" || status === "C") {
      const [original, target] = [cells[1], cells[2]];
      if (target) changes.push({ path: target, operation: "create" });
      if (original) changes.push({ path: original, operation: "delete" });
      continue;
    }
    const target = cells[1];
    if (!target) continue;
    const operation = status === "A" ? "create" : status === "D" ? "delete" : "modify";
    changes.push({ path: target, operation });
  }
  return changes;
}

function dedupe(changes) {
  const seen = new Set();
  const out = [];
  for (const change of changes) {
    const key = `${change.path}\0${change.operation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(change);
  }
  return out;
}

function fail(message) {
  process.stderr.write(`path-guard: ${message}\n`);
  process.stderr.write(USAGE);
  return 2;
}

function main(argv) {
  const args = [...argv];
  let unit = "";
  let phase = "";
  let base = "";
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--help") {
      process.stdout.write(USAGE);
      return 0;
    }
    if (arg === "--unit") unit = args.shift() ?? "";
    else if (arg === "--phase") phase = args.shift() ?? "";
    else if (arg === "--base") base = args.shift() ?? "";
    else return fail(`unknown argument: ${arg}`);
  }
  if (unit === "") return fail("--unit is required");
  if (phase === "" || !PHASE_RE.test(phase)) return fail("--phase must be P<n>");

  const cwd = process.cwd();
  const root = gitOrNull(cwd, ["rev-parse", "--show-toplevel"]);
  if (root === null) return fail("not inside a git repository");
  const repoRoot = root.trimEnd();

  // Changed paths: the dirty working tree, unioned with the committed range.
  const status = gitOrNull(repoRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]) ?? "";
  let changes = parsePorcelain(status);
  if (base !== "") {
    const diff = gitOrNull(repoRoot, ["diff", "--name-status", "--diff-filter=ACMRD", base]) ?? "";
    changes = changes.concat(parseNameStatus(diff));
  }
  changes = dedupe(changes);
  if (changes.length > CHANGED_PATH_LIMIT) return fail(`changed-path list exceeds ${CHANGED_PATH_LIMIT} entries`);

  // Effective policy: the project doc config over the shipped defaults.
  const degradations = [];
  const policyPath = path.join(repoRoot, ".agentic-workflow", "path-policy.json");
  let policy = resolvePathPolicy(SHIPPED_PATH_POLICY, null);
  if (!existsSync(policyPath)) {
    degradations.push({ code: "missing-config", detail: "shipped defaults in force" });
  } else {
    let malformed = null;
    try {
      if (statSync(policyPath).size > PATH_POLICY_MAX_BYTES) malformed = "policy exceeds the size bound";
      else {
        const parsed = parsePathPolicy(readFileSync(policyPath, "utf8"));
        if (parsed.ok) policy = resolvePathPolicy(SHIPPED_PATH_POLICY, parsed.policy);
        else malformed = parsed.message;
      }
    } catch (error) {
      malformed = error instanceof Error ? error.message : String(error);
    }
    if (malformed !== null) {
      policy = resolvePathPolicy(SHIPPED_PATH_POLICY, null);
      degradations.push({ code: "malformed-config", detail: "shipped defaults in force" });
    }
  }
  for (const record of policy.degradations) degradations.push(record);

  // Plan declaration (PLAN.md, else the SPEC's own block).
  const planFile = path.join(cwd, unit, "PLAN.md");
  const specFile = path.join(cwd, unit, "SPEC.md");
  let declaration = null;
  if (existsSync(planFile)) declaration = parsePlanDeclaration(readFileSync(planFile, "utf8"));
  else if (existsSync(specFile)) declaration = parsePlanDeclaration(readFileSync(specFile, "utf8"));
  if (declaration !== null && declaration.ok) declaration = declaration.declaration;
  else if (declaration !== null) declaration = null;

  // Escape records (the unit's decisions ledger; a missing block means none).
  const decisionsFile = path.join(cwd, unit, "decisions.md");
  let records = [];
  if (existsSync(decisionsFile)) {
    const parsed = parseRecords(readFileSync(decisionsFile, "utf8"));
    if (!parsed.ok) declaration = null;
    else records = parsed.records;
  }

  const result = evaluatePathGuard({ changes, policy, declaration, records, phase });
  const offenders =
    result.offenders.length === 0
      ? "none"
      : result.offenders.map((offender) => `${offender.path}:${offender.operation}:${offender.reason}`).join(", ");
  const freezeAfter =
    declaration === null || declaration.freezeAfter === undefined ? "n/a" : (declaration.freezeAfter ?? "none");

  const lines = [
    `PATH-GUARD ${result.verdict} — ${result.reason}`,
    `offenders: ${offenders}`,
    `phase: ${phase} · freeze-after: ${freezeAfter} · checked: ${changes.length}`,
  ];
  for (const degradation of degradations) lines.push(`DEGRADED — ${degradation.code}: ${degradation.detail}`);
  process.stdout.write(`${lines.join("\n")}\n`);

  return result.verdict === "pass" ? 0 : 1;
}

process.exitCode = main(process.argv.slice(2));
