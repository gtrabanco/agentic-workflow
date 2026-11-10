#!/usr/bin/env node
/**
 * differential-baseline.mjs — the mechanical run behind the baseline-advisory
 * rule (issue #437, S9; absorbs #363's phase).
 *
 * `skills/review-implementation/references/CLASSIFY.md` owns the rule and keeps
 * owning it: a blocker is *caused by the change and reproducible with realistic
 * input*, so a failure already present at the base commit is a **pre-existing
 * advisory** that never earns a correction round. This script is the run that
 * proves cause: it executes each declared validator in a checkout of the base
 * commit and at the head, and classifies the pair.
 *
 * It also answers the review-staleness question the issue relocated from #363.
 * Owner decision D1 selected **two layers**:
 *
 *   mechanism   the affecting-path scope digest `scripts/scope-manifest.mjs`
 *               already publishes (fix/286) — imported, never copied;
 *   policy      the declared trivial-path list below, one class per entry with
 *               its reason and its test. A `chore(...)`/`docs(...)` commit
 *               subject is never consulted: bytes decide.
 *
 * Usage
 *   bun scripts/differential-baseline.mjs --base <ref> --validators <file>
 *                                        [--head <ref>] [--repo <dir>]
 *                                        [--reviewed <ref>] [--json]
 *   bun scripts/differential-baseline.mjs --policy
 *
 * The validators file carries one shell command per line; blank lines and `#`
 * comments are ignored.
 *
 * Exit: 0 PASS or PRE-EXISTING (an advisory never blocks); 1 REGRESSION or an
 * unreadable validators file; 2 a usage error. Read-only over the repository:
 * the base checkout is a temporary worktree, removed before exit.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { changedPathsBetween, isNonAffecting } from "./scope-manifest.mjs";

export const BASELINE_CONTRACT = "differential-baseline@1";

/**
 * The declared policy layer. Each entry names the paths it owns and why a delta
 * there cannot change the behaviour a validator exercises. `scope-manifest.mjs`
 * keeps its own closed set for review receipts; this list composes with it and
 * never rewrites it.
 */
export const TRIVIAL_PATH_CLASSES = Object.freeze([
  {
    name: "documentation",
    patterns: ["docs/**"],
    reason: "documentation-only delta: no executable path is touched",
  },
  {
    name: "changeset",
    patterns: [".changeset/**"],
    reason: "release intent is prose consumed by the release step, never by a validator",
  },
  {
    name: "lockfile",
    patterns: ["bun.lock", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
    reason: "dependency resolution, not reviewed bytes; a dependency change that alters behaviour fails its own validator",
  },
]);

/** Recorded but not declared: this repository ships no formatter, so a
 *  formatting-only hunk cannot be detected deterministically. */
export const EXCLUDED_CLASSES = Object.freeze([
  {
    name: "formatting-only",
    reason: "this repository declares no formatter (AGENTS.md §Normalizer inventory), so the class has no deterministic detector",
  },
]);

const GLOB_TO_REGEX = (pattern) => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\\u0000").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped.replace(/\\u0000/g, ".*")}$`);
};

const COMPILED = TRIVIAL_PATH_CLASSES.flatMap((entry) =>
  entry.patterns.map((pattern) => ({ name: entry.name, regex: GLOB_TO_REGEX(pattern) })),
);

/** The policy layer: which class, if any, owns this path. */
export function trivialClassOf(relPath) {
  const candidate = String(relPath ?? "").replace(/^\.\//, "");
  if (!candidate) return null;
  if (isNonAffecting(candidate)) return "agent-state";
  for (const rule of COMPILED) if (rule.regex.test(candidate)) return rule.name;
  return null;
}

/**
 * Judge a delta in the two declared layers: a path no class owns is affecting,
 * and a delta carrying one affecting path is stale (fail-closed).
 */
export function judgeStaleness({ changedPaths }) {
  const paths = [...new Set((changedPaths ?? []).filter(Boolean))].sort();
  if (paths.length === 0) return { state: "fresh", affecting: [], trivial: [] };
  const affecting = [];
  const trivial = [];
  for (const relPath of paths) {
    if (trivialClassOf(relPath) === null) affecting.push(relPath);
    else trivial.push(relPath);
  }
  return { state: affecting.length === 0 ? "trivial" : "stale", affecting, trivial };
}

/** The four classes, from the two exit codes. */
export function classifyVerdict(baseExit, headExit) {
  if (baseExit === 0 && headExit === 0) return "pass";
  if (baseExit === 0 && headExit !== 0) return "regression";
  if (baseExit !== 0 && headExit === 0) return "repaired";
  return "pre-existing-failure";
}

function gitRunner(cwd) {
  return (...args) => {
    const run = spawnSync("git", args, { cwd, encoding: "utf8" });
    if (run.status !== 0) throw new Error(run.stderr.trim() || `git ${args.join(" ")} failed`);
    return run.stdout.trim();
  };
}

function resolveRef(git, ref) {
  return git("rev-parse", "--verify", `${ref}^{commit}`);
}

function runValidator(command, cwd) {
  const result = spawnSync("sh", ["-c", command], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { exit: result.status === null ? 1 : result.status };
}

function readValidators(file) {
  const text = fs.readFileSync(file, "utf8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function policyBlock() {
  const lines = [
    BASELINE_CONTRACT,
    "mechanism — scope-digest · scripts/scope-manifest.mjs",
    ...TRIVIAL_PATH_CLASSES.map((entry) => `class — ${entry.name} · ${entry.patterns.join(", ")} · ${entry.reason}`),
    ...EXCLUDED_CLASSES.map((entry) => `excluded — ${entry.name} · ${entry.reason}`),
  ];
  return `${lines.join("\n")}\n`;
}

const USAGE =
  "usage: differential-baseline.mjs --base <ref> --validators <file> [--head <ref>] [--repo <dir>] [--reviewed <ref>] [--json]\n" +
  "       differential-baseline.mjs --policy";

function parseArgs(argv) {
  const opts = { base: null, head: "HEAD", validators: null, repo: null, reviewed: null, policy: false, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--policy") opts.policy = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--base") opts.base = argv[++i];
    else if (arg === "--head") opts.head = argv[++i];
    else if (arg === "--validators") opts.validators = argv[++i];
    else if (arg === "--repo") opts.repo = argv[++i];
    else if (arg === "--reviewed") opts.reviewed = argv[++i];
    else if (arg === "--help" || arg === "-h") return { help: true };
    else return { error: `unknown argument ${arg}` };
  }
  for (const key of ["base", "validators", "repo", "reviewed"]) {
    if (opts[key] !== null && typeof opts[key] !== "string") return { error: `--${key} needs a value` };
  }
  if (opts.policy) return { opts };
  if (!opts.base) return { error: "--base is required" };
  if (!opts.validators) return { error: "--validators is required" };
  return { opts };
}

function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  if (parsed.error) {
    process.stderr.write(`differential-baseline: ${parsed.error}\n${USAGE}\n`);
    process.exitCode = 2;
    return;
  }
  if (parsed.opts.policy) {
    process.stdout.write(policyBlock());
    return;
  }

  const root = parsed.opts.repo
    ? path.resolve(parsed.opts.repo)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const git = gitRunner(root);

  let commands;
  try {
    commands = readValidators(path.resolve(parsed.opts.validators));
  } catch (error) {
    process.stderr.write(`differential-baseline: cannot read validators file (${error.message})\n`);
    process.exitCode = 1;
    return;
  }
  if (commands.length === 0) {
    process.stderr.write("differential-baseline: the validators file declares no command\n");
    process.exitCode = 1;
    return;
  }

  const baseSha = resolveRef(git, parsed.opts.base);
  const headSha = resolveRef(git, parsed.opts.head);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "differential-baseline-"));
  const baseDir = path.join(temp, "base");
  const added = spawnSync("git", ["-C", root, "worktree", "add", "--detach", "--quiet", baseDir, baseSha], {
    encoding: "utf8",
  });
  if (added.status !== 0) {
    fs.rmSync(temp, { recursive: true, force: true });
    process.stderr.write(`differential-baseline: cannot check out ${baseSha} (${added.stderr.trim()})\n`);
    process.exitCode = 1;
    return;
  }

  let results;
  try {
    results = commands.map((command) => {
      const base = runValidator(command, baseDir);
      const head = runValidator(command, root);
      return { command, baseExit: base.exit, headExit: head.exit, verdict: classifyVerdict(base.exit, head.exit) };
    });
  } finally {
    spawnSync("git", ["-C", root, "worktree", "remove", "--force", baseDir], { encoding: "utf8" });
    fs.rmSync(temp, { recursive: true, force: true });
  }

  const regressions = results.filter((row) => row.verdict === "regression");
  const advisories = results.filter((row) => row.verdict === "pre-existing-failure");
  const verdict = regressions.length > 0 ? "REGRESSION" : advisories.length > 0 ? "PRE-EXISTING" : "PASS";

  let staleness = null;
  if (parsed.opts.reviewed) {
    const reviewedSha = resolveRef(git, parsed.opts.reviewed);
    const changedPaths = reviewedSha === headSha ? [] : changedPathsBetween((...args) => git(...args), reviewedSha, headSha);
    staleness = judgeStaleness({ changedPaths });
  }

  const report = { contract: BASELINE_CONTRACT, base: baseSha, head: headSha, results, verdict, staleness };
  if (parsed.opts.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const lines = [BASELINE_CONTRACT, `base | ${baseSha}`, `head | ${headSha}`];
    for (const row of results) {
      lines.push(`validator — ${row.command} · base exit ${row.baseExit} · head exit ${row.headExit} · ${row.verdict}`);
    }
    lines.push(`verdict | ${verdict}`);
    if (staleness) {
      lines.push(`staleness | ${staleness.state}`);
      for (const relPath of staleness.affecting) lines.push(`affecting — ${relPath}`);
      for (const relPath of staleness.trivial) lines.push(`trivial — ${relPath}`);
    }
    process.stdout.write(`${lines.join("\n")}\n`);
  }

  if (verdict === "REGRESSION") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main(process.argv.slice(2));
