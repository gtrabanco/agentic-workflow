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
//   phase: <P<n>> · freeze-after: <P<m>|none|n/a> · checked: <n>   (n/a when no declaration)
//   DEGRADED — <code>: <detail>        (only when a degradation is reported; code ∈
//                                        missing-config | malformed-config | ignored-removal | ignored-lowering)
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

/** Run git. `ok` is false when the process could not run or exited non-zero. */
function runGit(root, args) {
  const result = spawnSync("git", ["--no-optional-locks", "-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return { ok: result.status === 0 && result.error === undefined, stdout: result.status === 0 ? result.stdout : "" };
}

const PHASE_RE = /^P\d+$/;

/** Map a porcelain v1 `-z` status pair to an operation. Both columns count: an unstaged deletion (` D`) is a delete. */
function operationFor(index, worktree) {
  if (index === "?" || worktree === "?") return "create";
  if (index === "A" || index === "C") return "create";
  if (index === "D" || worktree === "D") return "delete";
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
  const tokens = raw.split("\0");
  for (let index = 0; index < tokens.length; index += 1) {
    const status = tokens[index];
    if (status === "") continue;
    const code = status[0];
    if (code === "R" || code === "C") {
      const original = tokens[(index += 1)] ?? "";
      const target = tokens[(index += 1)] ?? "";
      if (target) changes.push({ path: target, operation: "create" });
      if (original) changes.push({ path: original, operation: "delete" });
      continue;
    }
    const target = tokens[(index += 1)];
    if (!target) continue;
    const operation = code === "A" ? "create" : code === "D" ? "delete" : "modify";
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
  const top = runGit(cwd, ["rev-parse", "--show-toplevel"]);
  if (!top.ok || top.stdout.trim() === "") return fail("not inside a git repository");
  const repoRoot = top.stdout.trimEnd();

  // The unit directory must stay inside the repository: an out-of-root --unit
  // could read a fabricated declaration/records and flip a failing gate to pass (F22).
  const unitPath = path.resolve(cwd, unit);
  const unitRelative = path.relative(repoRoot, unitPath);
  if (
    unitRelative === "" ||
    unitRelative === ".." ||
    unitRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(unitRelative)
  ) {
    return fail("--unit must be a directory inside the repository");
  }

  // Changed paths: the dirty working tree, unioned with the committed range.
  // A git failure is a gate error, never an empty change list (F5): an
  // unresolvable `--base` must not read as "nothing changed".
  const status = runGit(repoRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (!status.ok) return fail("git status failed; cannot determine the changed paths");
  let changes = parsePorcelain(status.stdout);
  if (base !== "") {
    // Resolve the ref first and diff the resolved commit, so a value beginning
    // with `-` can never reach git's option parser (F6).
    const resolved = runGit(repoRoot, ["rev-parse", "--verify", "--quiet", "--end-of-options", `${base}^{commit}`]);
    const baseCommit = resolved.stdout.trim().split(/\r?\n/).pop() ?? "";
    if (!resolved.ok || baseCommit === "") return fail(`unknown base ref: ${base}`);
    const diff = runGit(repoRoot, ["diff", "--name-status", "-z", "--diff-filter=ACMRD", baseCommit]);
    if (!diff.ok) return fail("git diff failed; cannot determine the committed range");
    changes = changes.concat(parseNameStatus(diff.stdout));
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
      degradations.push({ code: "malformed-config", detail: `shipped defaults in force — ${malformed}` });
    }
  }
  for (const record of policy.degradations) degradations.push(record);

  // Plan declaration (PLAN.md, else the SPEC's own block).
  const planFile = path.join(unitPath, "PLAN.md");
  const specFile = path.join(unitPath, "SPEC.md");
  let declaration = null;
  if (existsSync(planFile)) declaration = parsePlanDeclaration(readFileSync(planFile, "utf8"));
  else if (existsSync(specFile)) declaration = parsePlanDeclaration(readFileSync(specFile, "utf8"));
  if (declaration !== null && declaration.ok) declaration = declaration.declaration;
  else if (declaration !== null) declaration = null;

  // Escape records (the unit's decisions ledger; a missing block means none).
  const decisionsFile = path.join(unitPath, "decisions.md");
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
