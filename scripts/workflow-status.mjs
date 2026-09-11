#!/usr/bin/env node

/**
 * workflow-status — the deterministic sensor.
 *
 * One read-only pass over the current repository that emits the fixed
 * Envelope v2 document on stdout (feature 38). The script is the single
 * producer of the envelope; consumers (drivers, `ship-roadmap`, humans) read
 * the JSON and never assemble it.
 *
 * Collection follows the published `SENSOR_CORE` sequence (steps 1-9 including
 * 6a). The script performs no write of any kind: every forge/git call is a read,
 * output goes to stdout only, and diagnostics go to stderr.
 *
 * The envelope vocabulary is consumed through the repository's established
 * loader (`./schema-runtime.mjs`), which imports the built local package by
 * explicit path and fails with a named precondition when `dist/` is missing.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadSchemaRuntime } from "./schema-runtime.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
/** The sensor's own checkout — owns the schema runtime and the snapshot verifier. */
const SENSOR_REPO = path.resolve(SCRIPT_DIR, "..");
/** The repository being sensed. Defaults to the process working directory. */
const PROJECT = process.cwd();

/** Bound for git/forge subprocesses, in milliseconds (E-38-5, suite-pinned). */
export const COMMAND_TIMEOUT_MS = 15_000;
/** Bound for forge (`gh`) calls, in milliseconds (E-38-5, suite-pinned). */
export const FORGE_TIMEOUT_MS = 10_000;
/**
 * Total wall-clock budget for the whole forge dimension, in milliseconds (F19).
 * `FORGE_TIMEOUT_MS` bounds ONE read; the dimension runs three reads eagerly and
 * a fourth lazily, so four sequential reads each paying their own bound priced a
 * poll at ~40s on a slow-but-alive forge. Every forge read draws from this one
 * shared budget instead, and the reads left over when it is spent answer the
 * declared timeout degradation without spawning — so a hanging forge costs one
 * bound, which is what the failure contract already promises.
 */
export const FORGE_DIMENSION_MS = 10_000;
/** The single fatal-invocation exit code (A:20; repo convention 1-2). */
export const FATAL_EXIT_CODE = 1;

const FIVE_STATES = ["idea", "defined", "planned", "in-progress", "done"];
const OPEN_STATES = new Set(["defined", "planned", "in-progress"]);

const TIER_MAP = new Map([
  ["/discover-repository-state", "strong"],
  ["/resolve-repository-state", "strong"],
  ["/plan-feature", "strong"],
  ["/design-feature", "strong"],
  ["/review-change", "strong"],
  ["/audit-pr", "strong"],
  ["/triage-issue", "strong"],
  ["/product-audit", "strong"],
  ["/execute-phase", "cheap"],
  ["/review-spec", "strong"],
  ["/review-plan", "strong"],
]);

const USAGE = `Usage: bun scripts/workflow-status.mjs [--json-only] [--last-envelope <json|path>]

Read-only workflow sensor: compute repository, roadmap, dependency, PR, finding,
and recovery state, then print the fixed Envelope v2 JSON on stdout.

Options:
  --json-only                  accepted no-op (output is already envelope-only)
  --last-envelope <json|path>  persisted hint envelope (inline JSON or a file path)
  --help                       print this usage and exit 0
  --version                    print the schema package version and exit 0
`;

// ---------------------------------------------------------------------------
// Process helpers — never throw, always bounded.
// ---------------------------------------------------------------------------

/** Run a command, bounded, and return a structured result. Never throws. */
function run(command, args, { cwd = PROJECT, timeout = COMMAND_TIMEOUT_MS } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    maxBuffer: 16 * 1024 * 1024,
  });
  const timedOut = result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM";
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    missing: result.error?.code === "ENOENT",
    timedOut,
  };
}

/** `git` in the sensed repository. Returns the trimmed stdout, or null. */
const git = (...args) => {
  const result = run("git", args);
  return result.ok ? result.stdout : null;
};

/** One forge dimension's shared wall-clock budget (F19) — see `FORGE_DIMENSION_MS`. */
function forgeBudget() {
  return { remaining: FORGE_DIMENSION_MS, exhausted: false };
}

/**
 * `gh` in the sensed repository, bounded by both the per-call timeout and the
 * dimension's remaining budget. A read attempted after the budget is spent
 * answers a synthetic timeout (`timedOut: true`, no spawn), so the caller's
 * existing degradation path names it `unavailable-forge-timeout`.
 */
function ghBounded(budget, ...args) {
  if (budget.remaining <= 0) {
    budget.exhausted = true;
    return { ok: false, status: null, stdout: "", stderr: "", missing: false, timedOut: true };
  }
  const started = Date.now();
  const result = run("gh", args, { timeout: Math.min(FORGE_TIMEOUT_MS, budget.remaining) });
  budget.remaining -= Date.now() - started;
  if (result.timedOut) budget.exhausted = true;
  return result;
}

/**
 * Resolve a path under the sensed repository, or null when it escapes it. Every
 * filesystem read goes through this: a roadmap/fix-index cell becomes a path
 * segment, and repo content must never direct the sensor outside the project.
 *
 * The lexical prefix check alone is not confinement: an ancestor *directory*
 * symlink inside the project (`docs/features/<unit>` → elsewhere) keeps the
 * unresolved path under the root while the bytes come from outside it — the leaf
 * `lstat` in `readProject` only refuses a symlinked leaf (F21). The resolved
 * path is therefore re-checked against the resolved root; a path that cannot be
 * resolved (absent) reads as absent, never as an escape hatch.
 */
function projectPath(rel) {
  if (typeof rel !== "string") return null;
  const abs = path.resolve(PROJECT, rel);
  const prefix = PROJECT.endsWith(path.sep) ? PROJECT : `${PROJECT}${path.sep}`;
  if (!abs.startsWith(prefix)) return null;
  try {
    const realRoot = fs.realpathSync(PROJECT);
    const realPrefix = realRoot.endsWith(path.sep) ? realRoot : `${realRoot}${path.sep}`;
    return fs.realpathSync(abs).startsWith(realPrefix) ? abs : null;
  } catch {
    return null;
  }
}

/** Read a file under the sensed repository, or null when absent (or outside it). */
function readProject(rel) {
  const abs = projectPath(rel);
  if (abs === null) return null;
  try {
    return fs.lstatSync(abs).isFile() ? fs.readFileSync(abs, "utf8") : null;
  } catch {
    return null;
  }
}

/** Read a file under the sensor's own checkout. */
function readSensor(rel) {
  try {
    return fs.readFileSync(path.join(SENSOR_REPO, rel), "utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Step 0 — Normalized Repository State
// ---------------------------------------------------------------------------

function readRepositoryState() {
  const text = readProject("docs/workflow/REPOSITORY_STATE.md");
  if (text === null) {
    return { status: "missing", snapshot_id: null, source_revision: null };
  }
  // The ledger ships two canonical shapes and both are read: the snapshot table
  // (`| Status | \`frozen\` |`) and colon lines (`Status: frozen`, optionally bold).
  // Reading only the colon shape parsed every table-form ledger — this repository's
  // own frozen ledger and the shipped template — as `draft`, which blocked the whole
  // run on the substrate the sensor was shipped with.
  const field = (label) => {
    const colon = new RegExp(`^\\s*\\*{0,2}${label}\\*{0,2}\\s*:\\s*(.+)$`, "m").exec(text)?.[1];
    if (colon) return colon;
    return new RegExp(`^\\s*\\|\\s*\\*{0,2}${label}\\*{0,2}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, "m").exec(text)?.[1] ?? null;
  };
  const clean = (value) => value?.replace(/[`*]/g, "").replace(/\s*\([^)]*\)\s*$/, "").trim() || null;
  const declared = (clean(field("Status")) ?? "draft").toLowerCase();
  return {
    status: declared,
    snapshot_id: clean(field("Snapshot ID")) ?? clean(field("Snapshot id")) ?? clean(field("Snapshot")),
    source_revision: clean(field("Source revision")) ?? clean(field("Source")),
  };
}

const NRS_BLOCKING = new Set(["missing", "draft", "contradicted", "resolved"]);

// ---------------------------------------------------------------------------
// Step 1 — Git state
// ---------------------------------------------------------------------------

function readGitState() {
  const degradations = [];
  const branchProbe = run("git", ["branch", "--show-current"]);
  if (branchProbe.missing) {
    degradations.push({ source: "git", code: "unavailable-git-missing", detail: "the git binary was not found on PATH" });
    return { branch: "", dirty: false, dirtyFiles: [], ahead: 0, observations: ["git is unavailable — git-derived facts are omitted"], porcelain: "", degradations };
  }
  const branch = branchProbe.ok ? branchProbe.stdout : "";
  const porcelain = git("status", "--porcelain") ?? "";
  // No `git fetch`: it writes remote-tracking refs and FETCH_HEAD, and this sensor's
  // contract is "performs no write of any kind". `ahead` is advisory and reads the
  // local upstream ref; a stale count is a smaller cost than mutating a user's repo
  // mid-rebase/mid-checkout.
  const shortStatus = git("status", "-sb") ?? "";
  const dirtyFiles = porcelain === "" ? [] : porcelain.split("\n").filter(Boolean);
  const ahead = /\[ahead (\d+)/.exec(shortStatus)?.[1];
  const observations = [];
  if (dirtyFiles.length > 0) {
    observations.push(`${dirtyFiles.length} uncommitted change(s) on ${branch || "(detached)"}`);
  }
  if (ahead && Number(ahead) > 0) {
    observations.push(`branch ${branch} is ${ahead} commit(s) ahead of its upstream`);
  }
  return { branch, dirty: dirtyFiles.length > 0, dirtyFiles, ahead: ahead ? Number(ahead) : 0, observations, porcelain, degradations };
}

// ---------------------------------------------------------------------------
// Step 2 — Forge state
// ---------------------------------------------------------------------------

const FORGE_READS = {
  openPrs: ["pr", "list", "--state", "open", "--json", "number,title,headRefName,url,statusCheckRollup"],
  mergedPrs: ["pr", "list", "--state", "merged", "--limit", "20", "--json", "number,headRefName"],
  // The authoritative merge state for a PR outside the recent-merge window. The
  // `--limit 20` window above is a fast path, never evidence: reading its absence
  // as "unmerged" falsified every long-shipped unit's dependencies and produced
  // spurious substrate blockers. Read lazily — only a `done` row whose PR is
  // neither open nor recently merged needs it.
  allPrStates: ["pr", "list", "--state", "all", "--limit", "1000", "--json", "number,state"],
  openIssues: ["issue", "list", "--state", "open", "--json", "number,title,labels"],
};

/** A forge read failure degrades the whole dimension with one declared code. */
const degradationFor = (failure) => {
  if (failure.missing) return "unavailable-forge-missing-cli";
  if (failure.timedOut) return "unavailable-forge-timeout";
  if (/authenticat|401|credential|bad credentials/i.test(failure.stderr ?? "")) return "unavailable-forge-auth";
  return "unavailable-forge-no-network";
};

function readForgeState(budget = forgeBudget()) {
  const observations = [];
  const degradations = [];

  const readList = (key) => {
    const result = ghBounded(budget, ...FORGE_READS[key]);
    if (result.ok) {
      try {
        return { data: JSON.parse(result.stdout), available: true };
      } catch {
        return { data: [], available: false };
      }
    }
    return { data: [], available: false, failure: result };
  };

  /** A forge read failure degrades the whole dimension with one declared code. */
  const first = readList("openPrs");
  if (!first.available) {
    const code = degradationFor(first.failure ?? {});
    degradations.push({ source: "forge", code, detail: "forge reads are unavailable; forge-derived sections are omitted" });
    observations.push(`forge unavailable (${code})`);
    return { openPrs: [], mergedPrs: [], openIssues: [], observations, available: false, degradations };
  }

  const mergedPrs = readList("mergedPrs");
  const openIssues = readList("openIssues");
  if (!mergedPrs.available || !openIssues.available) {
    const code = degradationFor(!mergedPrs.available ? (mergedPrs.failure ?? {}) : (openIssues.failure ?? {}));
    degradations.push({ source: "forge", code, detail: "a partial forge read failed; affected sections are omitted" });
    observations.push(`forge partially unavailable (${code})`);
  }
  return {
    openPrs: first.data,
    mergedPrs: mergedPrs.data,
    openIssues: openIssues.data,
    observations,
    available: true,
    degradations,
  };
}

// ---------------------------------------------------------------------------
// Step 3 — Urgency (labels-only) + the in-flight unit's interruptibility facts
// ---------------------------------------------------------------------------

function readUrgency(issues) {
  const issues_ = [];
  for (const issue of issues) {
    const names = (issue.labels ?? []).map((label) => (typeof label === "string" ? label : label.name));
    const label = names.includes("urgent") ? "urgent" : names.includes("fix-next") ? "fix-next" : null;
    if (label) issues_.push({ number: issue.number, title: issue.title, label });
  }
  issues_.sort((a, b) => a.number - b.number);
  return issues_;
}

// ---------------------------------------------------------------------------
// Step 4/5 — Roadmap + fix index parsing and the dependency closure
// ---------------------------------------------------------------------------

/**
 * Split a markdown table row into cells, honoring `\|` escapes: a cell may carry a
 * literal pipe (prose, a code fragment), and splitting on it misaligned every column
 * after it — the fix-now projection then read prose fragments as its severity/axis.
 */
const cellsOf = (line) => line
  .replace(/\\\|/g, "\u0000")
  .split("|")
  .map((cell) => cell.replace(/\u0000/g, "|").trim());

/** Parse one status cell into `{status, raw, unknown, pr}`. */
function parseStatus(cell) {
  const raw = cell.replace(/`/g, "").trim();
  const prMatch = raw.match(/\[(?:PR )?#(\d+)(?: open)?\]\((https?:\/\/[^)]+)\)/) ?? raw.match(/\[PR #(\d+) open\]/);
  const token = raw.match(/^([a-z][a-z-]*)/i)?.[1]?.toLowerCase() ?? raw.toLowerCase();
  const pr = prMatch ? { number: Number(prMatch[1]), url: prMatch[2] ?? null } : null;
  if (FIVE_STATES.includes(token)) return { status: token, raw, unknown: false, pr };
  return { status: "idea", raw, unknown: true, pr };
}

function parseRoadmap(text) {
  const units = [];
  if (!text) return units;
  for (const line of text.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = cellsOf(line).slice(1, -1);
    if (cells.length < 4) continue;
    const [nn, slugCell, statusCell, depsCell] = cells;
    if (!/^\d+$/.test(nn)) continue;
    const slug = slugCell.replace(/`/g, "").trim();
    if (!slug || slug === "Slug") continue;
    const parsed = parseStatus(statusCell);
    units.push({
      kind: "feature",
      nn,
      slug,
      id: `${nn}-${slug}`,
      status: parsed.status,
      rawStatus: parsed.raw,
      statusUnknown: parsed.unknown,
      pr: parsed.pr,
      deps: (depsCell === "—" || depsCell === "-" || depsCell === "") ? [] : depsCell.split(/[\s,]+/).filter(Boolean),
    });
  }
  return units;
}

function parseFixIndex(text) {
  const units = [];
  if (!text) return units;
  for (const line of text.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = cellsOf(line).slice(1, -1);
    if (cells.length < 3) continue;
    const [issueCell, topicCell, statusCell] = cells;
    const issueNumber = /(\d+)/.exec(issueCell)?.[1];
    if (!issueNumber) continue;
    const topic = topicCell.replace(/`/g, "").trim();
    if (!topic || /^topic$/i.test(topic)) continue;
    const parsed = parseStatus(statusCell);
    units.push({
      kind: "fix",
      issue: Number(issueNumber),
      id: `fix-${issueNumber}`,
      slug: topic,
      status: parsed.status,
      rawStatus: parsed.raw,
      statusUnknown: parsed.unknown,
      pr: parsed.pr,
      deps: [],
    });
  }
  return units;
}

/**
 * Merge detection. A `done` row asserts its linked PR closed; the one negative the
 * forge can prove is that the PR is still OPEN — and an open PR is NOT met.
 *
 * The recently-merged window (`--limit 20`) confirms a recent merge early, but its
 * ABSENCE is never evidence of non-merge: the window is bounded, and reading a
 * long-shipped unit's PR as unmerged there falsified its dependencies and every
 * dependent, and produced "done but dependencies are unmerged" substrate blockers
 * across the roadmap. A PR outside the window is resolved from the forge's own
 * per-PR state, and when the forge cannot answer at all the `done` row stands —
 * optimistic, because a false "unmerged" blocks startable work repo-wide.
 */
function makeMergeResolver(forge, budget = forgeBudget()) {
  const openNumbers = new Set((forge.openPrs ?? []).map((pr) => pr.number));
  const recentMerged = new Set((forge.mergedPrs ?? []).map((pr) => pr.number));
  let resolvable = Boolean(forge.available);
  let states = null;
  const allStates = () => {
    if (states) return states;
    states = new Map();
    // The lazy fourth read draws from the same dimension budget as the eager
    // three: an already-spent budget answers a timeout here instead of paying a
    // fresh per-call bound (F19).
    const result = ghBounded(budget, ...FORGE_READS.allPrStates);
    if (result.ok) {
      try {
        for (const pr of JSON.parse(result.stdout)) states.set(pr.number, String(pr.state ?? "").toUpperCase());
      } catch { /* an unparsable list reads as no list, handled below */ }
    }
    if (states.size === 0) {
      const code = degradationFor(result);
      (forge.degradations ?? []).push({
        source: "forge",
        code,
        detail: "the all-states PR read failed; a closed-unmerged PR cannot be told from a merged one",
      });
      (forge.observations ?? []).push(`merge state unverified outside the recent-merge window (${code})`);
      resolvable = false;
    }
    return states;
  };
  return (unit) => {
    if (unit.status !== "done") return false;
    if (!unit.pr) return true;
    if (openNumbers.has(unit.pr.number)) return false;
    if (recentMerged.has(unit.pr.number)) return true;
    if (!resolvable) return true;
    const state = allStates().get(unit.pr.number);
    return state ? state === "MERGED" : true;
  };
}

const byNumber = (units) => {
  const map = new Map();
  for (const unit of units) {
    if (unit.kind === "feature") map.set(String(Number(unit.nn)), unit);
  }
  return map;
};

/** Step 5 — transitive dependency closure + substrate inconsistencies. */
function computeDependencies(units, mergeResolver) {
  const featureByNumber = byNumber(units);
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const merged = new Set(units.filter((unit) => mergeResolver(unit)).map((unit) => unit.id));
  const blockers = [];
  const observations = [];

  const directDeps = (unit) => unit.deps
    .map((dep) => featureByNumber.get(String(Number(dep)))?.id)
    .filter(Boolean);

  const unmetFor = (unit) => directDeps(unit).filter((depId) => !merged.has(depId));

  // Cycle detection over the direct edges.
  const visiting = new Set();
  const visited = new Set();
  const cycleNodes = new Set();
  const visit = (unit) => {
    if (visiting.has(unit.id)) { cycleNodes.add(unit.id); return; }
    if (visited.has(unit.id)) return;
    visiting.add(unit.id);
    for (const depId of directDeps(unit)) {
      const dep = byId.get(depId);
      if (dep) visit(dep);
    }
    visiting.delete(unit.id);
    visited.add(unit.id);
  };
  for (const unit of units) visit(unit);
  for (const id of cycleNodes) {
    blockers.push({ kind: "substrate", id, scope: "unit", detail: `dependency cycle involving ${id}` });
  }

  // A `done` row whose own deps are not merged is an inconsistency.
  for (const unit of units) {
    if (unit.status !== "done") continue;
    const unmet = unmetFor(unit);
    if (unmet.length > 0) {
      blockers.push({
        kind: "substrate",
        id: unit.id,
        scope: "unit",
        detail: `${unit.id} is done but its dependencies are unmerged: ${unmet.join(", ")}`,
      });
    }
  }

  const unmet = [];
  const buildOrder = [];
  for (const unit of units) {
    const unmetDeps = unmetFor(unit);
    if (unmetDeps.length > 0) {
      unmet.push(unit.id, ...unmetDeps);
      buildOrder.push(...unmetDeps, unit.id);
    }
  }
  return {
    blockers,
    observations,
    merged,
    unmet: [...new Set(unmet)],
    buildOrder: [...new Set(buildOrder)],
    directDeps,
    unmetFor,
    byId,
  };
}

// ---------------------------------------------------------------------------
// Step 6a — pre-execution receipt sensing (subprocess to the snapshot verifier)
// ---------------------------------------------------------------------------

const RECEIPT_SPLIT = /^## Pre-execution review receipt v1 — /m;
const field = (chunk, label) => new RegExp(`${label}:\\s*([^\\n·]+)`).exec(chunk)?.[1]?.replace(/[`]/g, "").trim() ?? null;

/** The newest receipt block for a stage, or null. */
function newestReceipt(progressText, stage) {
  if (!progressText) return null;
  const blocks = progressText.split(RECEIPT_SPLIT).slice(1);
  let found = null;
  for (const block of blocks) {
    const blockStage = block.startsWith("plan") ? "plan" : block.startsWith("spec") ? "spec" : "unknown";
    if (blockStage !== stage) continue;
    found = {
      stage: blockStage,
      id: field(block, "Review"),
      snapshot: field(block, "Snapshot"),
      verdict: field(block, "Verdict"),
      parent: field(block, "Parent SPEC snapshot") ?? field(block, "Parent"),
    };
  }
  return found;
}

/** Sense one stage's receipt through the verifier; returns `{label, ...}`. */
function senseStage(unitDir, unitId, stage, parent) {
  const verifier = path.join(SENSOR_REPO, "scripts", "pre-execution-snapshot.mjs");
  if (!fs.existsSync(verifier)) {
    return { label: "missing", verdict: null, boundDigest: null, observedDigest: null, reason: "snapshot verifier absent" };
  }
  const progress = readProject(path.join(unitDir, "progress.md"));
  const receipt = newestReceipt(progress, stage);
  if (!receipt) {
    return { label: "missing", verdict: null, boundDigest: null, observedDigest: null, reason: "no receipt for this stage" };
  }
  // `--root`/`--dir` bind the verifier to the SENSED repository and unit: it resolves
  // its repository from its own location by default, so a foreign project's receipts
  // were re-derived against the sensor's checkout — fabricated `missing`/`stale` rows.
  const args = ["verify", "--stage", stage, "--unit", unitId, "--dir", unitDir, "--root", PROJECT];
  const boundParent = parent ?? receipt.parent;
  if (stage === "plan" && boundParent) args.push("--parent", boundParent);
  const result = run(process.execPath, [verifier, ...args], { cwd: PROJECT });
  let payload = null;
  try { payload = JSON.parse(result.stdout); } catch { payload = null; }
  const observedDigest = payload?.observedDigest ?? null;
  if (payload && payload.current === true && payload.verdictIsPass === true) {
    return { label: "current", verdict: payload.receipt?.verdict ?? receipt.verdict, boundDigest: payload.receipt?.snapshot ?? receipt.snapshot, observedDigest, reason: null };
  }
  const reasonCode = payload?.structural?.reasonCode ?? null;
  const label = reasonCode === "impossible-timeline" ? "impossible-timeline"
    : (payload?.digestMatches === false || reasonCode) ? "stale"
    : (receipt.verdict && receipt.verdict !== "pass") ? "missing"
    : "missing";
  return {
    label,
    verdict: payload?.receipt?.verdict ?? receipt.verdict,
    boundDigest: payload?.receipt?.snapshot ?? receipt.snapshot,
    observedDigest,
    reason: reasonCode ?? "receipt is not current",
  };
}

/** A roadmap/fix-index slug becomes a path segment: anything that could leave the
 *  repository is refused, and the unit is reported instead of read. */
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function unitDirFor(unit) {
  const slug = String(unit.slug ?? "");
  if (!SAFE_SEGMENT.test(slug)) return null;
  return unit.kind === "fix" ? `docs/fix/${unit.issue}-${slug}` : `docs/features/${unit.id}`;
}

/** The stage a unit is about to enter, per its resolved status. */
const stageFor = (unit) => (unit.status === "defined" ? "spec" : "plan");

function recommendedFor(label, unit, stage) {
  if (label === "current") return stage === "spec" ? `/plan-feature ${unit.id}` : `/execute-phase ${unit.nn ?? unit.issue}`;
  return stage === "spec" ? `/review-spec ${unit.id}` : `/review-plan ${unit.nn ?? unit.issue}`;
}

// ---------------------------------------------------------------------------
// Step 7-9 — phase progress, review marks, fix-now fold ledger
// ---------------------------------------------------------------------------

function readPhaseProgress(unitDir) {
  const tasks = readProject(path.join(unitDir, "TASKS.md")) ?? readProject(path.join(unitDir, "SPEC.md"));
  if (!tasks) return null;
  const phases = [...tasks.matchAll(/^##\s+(P\d+)\s+—/gm)].map((match) => match[1]);
  if (phases.length === 0) return null;
  const boxes = [...tasks.matchAll(/^\s*-\s*\[( |x|X)\]/gm)].map((match) => match[1].toLowerCase() === "x");
  const done = boxes.filter(Boolean).length;
  const sectionOf = (phase) => tasks.split(new RegExp(`^##\\s+${phase}\\s+—`, "m"))[1]?.split(/^##\s+/m)[0] ?? "";
  const current = phases.find((phase) => /^\s*-\s*\[ \]/m.test(sectionOf(phase))) ?? phases.at(-1);
  // `tasks_from_boundary`: the unticked boxes left in the current phase — the fact
  // `detail.urgent.interruptibility` publishes as a count, never as `null`.
  const remaining = [...sectionOf(current).matchAll(/^\s*-\s*\[ \]/gm)].length;
  return { current, total: phases.length, completed: done, remaining };
}

/**
 * The paths a pre-execution review binds: the stage's artifact files plus the
 * governing authorities. Mirrors the two tables `scripts/pre-execution-snapshot.mjs`
 * owns (`STAGE_ARTIFACTS` + `CONTEXT_SOURCES`); `pre-execution-review`'s
 * `SNAPSHOT.md` is the owner of record for the set, and step 8 orders currency over
 * exactly these paths.
 */
const REVIEW_STAGE_ARTIFACTS = {
  spec: ["SPEC.md"],
  plan: ["SPEC.md", "ACCEPTANCE.md", "planning-evidence.md", "planning-obligations.md", "PLAN.md", "TASKS.md", "testing.md", "decisions.md", "architecture-notes.md"],
};
const REVIEW_CONTEXT_PATHS = ["CLAUDE.md", "docs/workflow/REPOSITORY_STATE.md", "docs/architecture/ARCHITECTURAL_INVARIANTS.md"];
const boundPathsFor = (unitDir, stage) => [
  ...(REVIEW_STAGE_ARTIFACTS[stage] ?? REVIEW_STAGE_ARTIFACTS.plan).map((file) => `${unitDir}/${file}`),
  ...REVIEW_CONTEXT_PATHS,
];

/** Step 8 — the durable review mark's currency (ancestor + no later bound-input edit). */
function readReviewMark(unitDir, stage) {
  const ledger = readProject(path.join(unitDir, "review-findings.md"));
  if (!ledger) return null;
  const mark = ledger.split("\n").find((line) => line.startsWith("| REVIEW-RAN"));
  if (!mark) return null;
  const sha = /HEAD ([0-9a-f]{40})/.exec(mark)?.[1] ?? null;
  if (!sha) return { sha: null, current: false };
  const ancestor = run("git", ["merge-base", "--is-ancestor", sha, "HEAD"]).ok;
  // Currency is over the BOUND inputs, never the unit directory: the ledger the mark
  // lives in is not bound, and the commit that carries the mark touches it — scoping
  // the check to the unit dir aged every mark on arrival, so no unit could ever
  // report a current review.
  const later = git("log", "--oneline", `${sha}..HEAD`, "--", ...boundPathsFor(unitDir, stage));
  return { sha, current: ancestor && (later ?? "") === "" };
}

/** Step 9 — unfold ledger projection. */
const STRONG_AXES = new Set(["security", "correctness", "logic", "architecture", "design", "concurrency"]);

/**
 * The envelope schema's severity enum is `high|med|low`; a ledger may carry the
 * finder scale (`critical`/`major`/`minor`) or prose. Passing a row through unmapped
 * emitted a schema-invalid envelope (the self-check named every one) while still
 * exiting 0, so the sensor published a document its own validator rejected.
 */
const SEVERITY_VOCABULARY = new Map([
  ["critical", "high"], ["major", "med"], ["medium", "med"], ["minor", "low"],
  ["high", "high"], ["med", "med"], ["low", "low"],
]);

function readFixNow(unitDir, observations = []) {
  const ledger = readProject(path.join(unitDir, "review-findings.md"));
  if (!ledger) return [];
  const items = [];
  for (const line of ledger.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = cellsOf(line).slice(1, -1);
    if (cells.length < 7) continue;
    const [id, file, axis, severity, klass, route, folded] = cells;
    if (/^id$/i.test(id) || folded === "yes" || folded === "—" || folded === "n/a") continue;
    // A separator row in any dash spelling (`|---|`, `| --- |`, `|-----|`) projects a
    // bogus finding whose id is the dash run: the guard is the id's shape, not one
    // separator's spelling.
    if (/^[-:\s]*$/.test(id)) continue;
    const normalized = SEVERITY_VOCABULARY.get(String(severity).toLowerCase()) ?? null;
    if (!normalized) {
      // Named, never silent: the row is dropped from the envelope, and the ledger's
      // own vocabulary drift is reported (the AC-19 degradation pattern).
      observations.push(`${unitDir}: dropped review-findings row '${id}' — severity '${severity}' is outside high|med|low`);
      continue;
    }
    const tier = normalized === "high" || STRONG_AXES.has(axis) ? "strong" : "cheap";
    items.push({ id, file, axis, severity: normalized, class: klass, route, suggested_tier: tier });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Crash recovery (step 17) + hint guard
// ---------------------------------------------------------------------------

/** Worst verdict wins across the branches classified (CRASH_RECOVERY.md precedence). */
const CRASH_RANK = { CLEAN: 0, RESUMABLE: 1, AMBIGUOUS: 2 };

/** A branch with no upstream has every commit unpushed by definition (CRASH_RECOVERY). */
function branchIsUnpushed(name) {
  const upstream = git("rev-parse", "--abbrev-ref", `${name}@{u}`);
  if (upstream === null) return true;
  const count = git("rev-list", "--count", `${upstream}..${name}`);
  return count === null ? true : Number(count) > 0;
}

function readCrashRecovery({ gitState, units, phases }) {
  const branch = gitState.branch;
  const unitFor = (name) => name && units.find((candidate) => name.endsWith(candidate.id)
    || name.includes(candidate.id)
    || (candidate.issue != null && name.includes(`/${candidate.issue}-`))
    || (candidate.slug && name.includes(candidate.slug)));

  /** One branch's row: the dirty/unpushed facts plus its ledger's unique next phase. */
  const classify = (name, unit, { dirty, dirtyFiles, unpushed }) => {
    if (!dirty && !unpushed) return { branch: name, evidence: "clean tree; branch pushed", verdict: "CLEAN", resume_command: null };
    const phase = unit ? phases.get(unit.id) : null;
    if (unit && phase?.current) {
      return {
        branch: name,
        evidence: `${dirty ? `${dirtyFiles} dirty file(s)` : "clean tree"}; ledger points at ${phase.current}/${phase.total}`,
        verdict: "RESUMABLE",
        resume_command: `/execute-phase ${unit.nn ?? unit.issue} ${phase.current}`,
      };
    }
    return {
      branch: name,
      evidence: `${dirty ? `${dirtyFiles} dirty file(s)` : "clean tree"}; no unique next phase (unknown or contradictory ledger)`,
      verdict: "AMBIGUOUS",
      resume_command: null,
    };
  };

  const current = branch || "—";
  const currentUnit = unitFor(branch);
  const rows = [classify(current, currentUnit, {
    dirty: gitState.dirty,
    dirtyFiles: gitState.dirtyFiles.length,
    // Untracked/no-upstream state is only recoverable state on a unit branch: a
    // non-unit branch (main, a scratch branch) has no interrupted execution to
    // resume, so its own cleanliness is the whole fact.
    unpushed: branch === "" ? false : (currentUnit ? (!git("rev-parse", "--abbrev-ref", `${branch}@{u}`) || gitState.ahead > 0) : false),
  })];

  // Every *unit* branch is classified too, and worst wins: a driver that died on
  // another checkout left state the single reduced verdict must see. A branch that
  // resolves to no roadmap unit is not a unit branch — it is not a recovery
  // candidate, and letting one hijack `state` would stall every driver on a
  // leftover scratch branch.
  const locals = (git("for-each-ref", "--format=%(refname:short)", "refs/heads/feat", "refs/heads/fix") ?? "")
    .split("\n").map((name) => name.trim()).filter((name) => name && name !== branch);
  for (const name of locals) {
    const unit = unitFor(name);
    if (!unit) continue;
    rows.push(classify(name, unit, { dirty: false, dirtyFiles: 0, unpushed: branchIsUnpushed(name) }));
  }
  rows.sort((a, b) => CRASH_RANK[b.verdict] - CRASH_RANK[a.verdict]);
  return { verdict: rows[0].verdict, branches: rows };
}

const HINT_MAX_BYTES = 1024 * 1024;

function loadHint(value) {
  if (value === null || value === undefined) return { provided: false };
  const trimmed = String(value).trim();
  let text = trimmed;
  if (!trimmed.startsWith("{")) {
    const abs = path.isAbsolute(trimmed) ? trimmed : path.join(PROJECT, trimmed);
    try {
      if (!fs.existsSync(abs)) return { provided: true, code: "unavailable-hint-missing-path" };
      // A hint is one JSON envelope: the read is bounded and must be a regular file,
      // so an operator-supplied path cannot make the sensor allocate without limit.
      const stats = fs.statSync(abs);
      if (!stats.isFile()) return { provided: true, code: "unavailable-hint-unreadable" };
      if (stats.size > HINT_MAX_BYTES) return { provided: true, code: "unavailable-hint-too-large" };
      text = fs.readFileSync(abs, "utf8");
    } catch {
      return { provided: true, code: "unavailable-hint-unreadable" };
    }
  }
  try {
    return { provided: true, hint: JSON.parse(text) };
  } catch {
    return { provided: true, code: "unavailable-hint-invalid-json" };
  }
}

function hintGuard(hintInfo, units, envelopeState, recomputedNext) {
  const degradations = [];
  const observations = [];
  if (!hintInfo.provided) return { degradations, observations };
  if (hintInfo.code) {
    degradations.push({ source: "hint", code: hintInfo.code, detail: "the hint envelope could not be read" });
    observations.push(`hint unavailable (${hintInfo.code})`);
    return { degradations, observations };
  }
  const hint = hintInfo.hint ?? {};
  const recommended = typeof hint?.next?.recommended === "string" ? hint.next.recommended : "";
  const bySlug = (slug) => units.find((unit) => unit.id === slug || unit.slug === slug || unit.id.endsWith(slug));
  const planMatch = /^\/plan-feature\s+(\S+)/.exec(recommended);
  const designMatch = /^\/design-feature\s+(\S+)/.exec(recommended);
  if (planMatch) {
    const unit = bySlug(planMatch[1]);
    if (unit && unit.status === "defined") {
      observations.push(`${unit.id} still 'defined' after the hint's /plan-feature ${unit.id} recommendation — suspected dropped defined→planned write (see #51)`);
    }
  }
  if (designMatch) {
    const unit = bySlug(designMatch[1]);
    if (unit && unit.status === "idea") {
      observations.push(`${unit.id} still 'idea' after the hint's /design-feature ${unit.id} recommendation — suspected dropped idea→defined write (see #51)`);
    }
  }
  if (hint.state && hint.state !== envelopeState) {
    observations.push(`hint envelope diverges from recomputed state (hint ${hint.state}, recomputed ${envelopeState})`);
  } else if (recommended && recomputedNext && recommended !== recomputedNext) {
    observations.push(`hint envelope diverges from recomputed next (hint ${recommended}, recomputed ${recomputedNext})`);
  }
  return { degradations, observations };
}

// ---------------------------------------------------------------------------
// Envelope assembly
// ---------------------------------------------------------------------------

const tierFor = (command) => TIER_MAP.get(command.split(/\s+/)[0]) ?? "cheap";

function summarize(units, startable, designCandidates, openPrs) {
  const parts = [
    `${units.length} unit(s)`,
    `${startable.length} startable`,
    `${designCandidates.length} design candidate(s)`,
    `${openPrs.length} open PR(s)`,
  ];
  return parts.join(", ");
}

function resolveNext({ nrs, state, startable, designCandidates, openPrs, untriaged, receiptRows, crash }) {
  const alternatives = [];
  if (nrs && NRS_BLOCKING.has(nrs.status)) {
    const command = nrs.status === "contradicted"
      ? `/resolve-repository-state ${nrs.snapshot_id ?? "<id>"}`
      : "/discover-repository-state";
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  if (crash?.verdict === "RESUMABLE" && crash.branches[0]?.resume_command) {
    const command = crash.branches[0].resume_command;
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  if (crash?.verdict === "AMBIGUOUS") {
    return { recommended: "/workflow-status", alternatives, tier: tierFor("/workflow-status") };
  }
  if (startable.length > 0) {
    const command = startable[0].next;
    for (const unit of startable.slice(1)) alternatives.push(unit.next);
    for (const row of receiptRows.filter((entry) => entry.label !== "current")) alternatives.push(row.recommended);
    for (const candidate of designCandidates) alternatives.push(candidate.next);
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  // Step 6a's gate, reachable here: a unit whose receipt for the stage it is about to
  // enter is not current is demoted out of `startable_now`, so without a branch of its
  // own the promised `/review-spec`//`/review-plan` next never fired and the unit
  // vanished into the bland fallback. It ranks above a fresh design candidate: an
  // in-flight unit blocked only by a review gate is closer to done than an unstarted
  // idea.
  const gateBlocked = receiptRows.filter((row) => row.label !== "current");
  if (gateBlocked.length > 0) {
    const command = gateBlocked[0].recommended;
    for (const row of gateBlocked.slice(1)) alternatives.push(row.recommended);
    for (const candidate of designCandidates) alternatives.push(candidate.next);
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  if (designCandidates.length > 0) {
    const command = designCandidates[0].next;
    for (const candidate of designCandidates.slice(1)) alternatives.push(candidate.next);
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  if (untriaged.count > 0) {
    const command = `/triage-issue ${untriaged.oldest_open.join(" ")}`;
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  const command = "/workflow-status";
  return { recommended: command, alternatives, tier: tierFor(command) };
}

function buildProjections({ units, forge, readiness, phases, marks, fixNow, observations, urgent }) {
  const features = [];
  const fixes = [];
  for (const unit of units) {
    const phase = phases.get(unit.id) ?? null;
    const mark = marks.get(unit.id) ?? null;
    const entry = {
      id: unit.id,
      status: unit.status,
      deps: unit.deps ?? [],
      deps_unmet: readiness.unmetFor(unit),
      phase: { current: phase?.current ?? null, total: phase?.total ?? null },
      pr: unit.pr ?? null,
      review_pending: mark ? !mark.current : ((unit.pr?.number ?? null) ? true : null),
      audit_pending: null,
      merge_ready: null,
    };
    if (entry.review_pending === null) entry.review_pending = false;
    if (unit.kind === "fix") fixes.push({ ...entry, issue: unit.issue });
    else features.push(entry);
  }
  return { features, fixes, fixNow, observations, urgent };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function buildEnvelope({ lastEnvelope = null } = {}) {
  const schema = await loadSchemaRuntime();
  const nrs = readRepositoryState();
  const gitState = readGitState();
  const forgeBudget_ = forgeBudget();
  const forge = readForgeState(forgeBudget_);
  const roadmap = parseRoadmap(readProject("docs/features/ROADMAP.md"));
  const fixes = parseFixIndex(readProject("docs/fix/README.md"));
  const units = [...roadmap, ...fixes];
  const mergeResolver = makeMergeResolver(forge, forgeBudget_);
  const dependencies = computeDependencies(units, mergeResolver);

  const observations = [...gitState.observations, ...forge.observations, ...dependencies.observations];
  for (const unit of units) {
    if (unit.statusUnknown) {
      observations.push(`${unit.id}: roadmap status '${unit.rawStatus}' mapped to '${unit.status}' (nearest five-state value)`);
    }
  }

  // Step 6 + 6a — readiness, receipt sensing, gate demotion.
  const receiptRows = [];
  const startable = [];
  const designCandidates = [];
  const blocked = {};
  const gateBlockers = [];
  /** A `done` row whose linked PR is still open: a unit at the merge gate. */
  const isOpenPr = (unit) => Boolean(unit.pr && (forge.openPrs ?? []).some((pr) => pr.number === unit.pr.number));
  for (const unit of units) {
    const unmetDeps = dependencies.unmetFor(unit);
    if (unit.status === "idea") {
      designCandidates.push({ id: unit.id, status: "idea", next: `/design-feature ${unit.id}` });
      continue;
    }
    if (unmetDeps.length > 0) {
      blocked[unit.id] = { unmet: unmetDeps, build_order: dependencyBuildOrder(unit, dependencies) };
      continue;
    }
    // Step 6a senses `defined`/`planned`/`in-progress` AND `done` rows whose linked PR
    // is still open: a done-but-unmerged row is a lifecycle label, never merge-ready,
    // so skipping it left the receipts of every open PR unsensed — the blind spot sat
    // exactly at PR-review time.
    if (!OPEN_STATES.has(unit.status) && !(unit.status === "done" && isOpenPr(unit))) continue;
    const dir = unitDirFor(unit);
    if (!dir) {
      observations.push(`${unit.id}: slug '${unit.slug}' is not a safe path segment — its files are not read`);
      continue;
    }
    const stage = stageFor(unit);
    const specSense = senseStage(dir, unit.id, "spec");
    const planSense = stage === "plan" ? senseStage(dir, unit.id, "plan", specSense.observedDigest) : null;
    const sense = stage === "plan" ? planSense : specSense;
    const label = sense.label;
    const row = {
      unit: unit.id,
      stage,
      label,
      verdict: sense.verdict,
      boundDigest: sense.boundDigest,
      observedDigest: sense.observedDigest,
      recommended: recommendedFor(label, unit, stage),
      reason: sense.reason,
    };
    receiptRows.push(row);
    if (label === "current") {
      // A done row with an open PR has no execution left: its next act is the merge
      // gate, not another phase.
      const command = unit.status === "done" ? `/audit-pr ${unit.pr.number}` : recommendedFor("current", unit, stage);
      startable.push({ id: unit.id, next: command });
    } else {
      gateBlockers.push({
        kind: "gate",
        id: unit.id,
        scope: "unit",
        detail: `${unit.id} ${stage}-stage receipt is ${label} — ${row.recommended}`,
      });
    }
  }

  // Steps 7-9 per unit.
  const phases = new Map();
  const marks = new Map();
  const fixNow = [];
  for (const unit of units) {
    const dir = unitDirFor(unit);
    if (!dir) continue; // an unsafe slug was already reported by the readiness pass
    const phase = readPhaseProgress(dir);
    if (phase) phases.set(unit.id, phase);
    const mark = readReviewMark(dir, stageFor(unit));
    if (mark) marks.set(unit.id, mark);
    fixNow.push(...readFixNow(dir, observations));
  }

  const urgentIssues = readUrgency(forge.openIssues);
  const untriagedNumbers = (forge.openIssues ?? [])
    .filter((issue) => {
      const names = (issue.labels ?? []).map((label) => (typeof label === "string" ? label : label.name));
      return !names.some((name) => ["wontfix", "postponed", "promoted"].includes(name));
    })
    .map((issue) => issue.number)
    .sort((a, b) => a - b);

  const openPrs = (forge.openPrs ?? []).map((pr) => ({
    number: pr.number,
    unit: pr.headRefName ?? null,
    ci: ciOf(pr),
    merge_ready: false,
  }));

  const projections = buildProjections({ units, forge, readiness: { unmetFor: dependencies.unmetFor }, phases, marks, fixNow, observations, urgent: urgentIssues });

  const runScopedBlockers = [];
  if (nrs && NRS_BLOCKING.has(nrs.status)) {
    runScopedBlockers.push({
      kind: "substrate",
      id: "repository-state",
      scope: "run",
      detail: `repository-state ledger is ${nrs.status}`,
    });
  }
  runScopedBlockers.push(...dependencies.blockers);
  const blockers = [...runScopedBlockers, ...gateBlockers];

  // Crash recovery (step 17) — classified before the envelope state is reduced.
  const crash = readCrashRecovery({ gitState, units, phases });

  // Top-level state: the NRS/substrate gate overrides the crash-recovery mapping.
  let state;
  if (nrs && NRS_BLOCKING.has(nrs.status)) state = "BLOCKED";
  else if (dependencies.blockers.some((blocker) => blocker.scope === "run")) state = "BLOCKED";
  else if (crash.verdict === "AMBIGUOUS") state = "NEEDS_INPUT";
  else if (crash.verdict === "RESUMABLE") state = "CONTINUE";
  else state = "OK";

  const needsInput = state === "NEEDS_INPUT"
    ? {
        question: `Interrupted state on ${crash.branches[0]?.branch ?? gitState.branch} is ambiguous — the ledger does not name a unique next phase`,
        options: ["resume the phase from the dirty work", "redo the phase from a clean tree", "discard the dirty work"],
      }
    : null;

  const designCandidates_ = designCandidates;
  const next = resolveNext({ nrs, state, startable, designCandidates: designCandidates_, openPrs, untriaged: { count: untriagedNumbers.length, oldest_open: untriagedNumbers.slice(0, 5) }, receiptRows, crash });

  const hintInfo = loadHint(lastEnvelope);
  const hint = hintGuard(hintInfo, units, state, next.recommended);
  observations.push(...hint.observations);
  const degradations = [...(gitState.degradations ?? []), ...(forge.degradations ?? []), ...hint.degradations];

  const currentUnit = units.find((unit) => {
    const branch = gitState.branch;
    return branch && (branch.endsWith(unit.id) || branch.includes(unit.id) || branch.includes(`/${unit.issue}-`));
  }) ?? null;

  /**
   * The current unit's PR state, from the forge evidence already in hand: `open`
   * when the forge lists the PR open, `merged` when the merge resolver proves the
   * `done` row shipped, else `none`. A hardcoded `open` told every consumer that a
   * merged PR was still open (F23).
   */
  const prStateFor = (unit) => {
    if (!unit?.pr) return "none";
    if (isOpenPr(unit)) return "open";
    return mergeResolver(unit) ? "merged" : "none";
  };

  const detail = {
    repository_state: nrs,
    design_candidates: designCandidates_,
    pre_execution: receiptRows,
    features: projections.features,
    fixes: projections.fixes,
    startable_now: startable.map((entry) => entry.id),
    blocked_units: blocked,
    open_prs: openPrs,
    pending_triage: [],
    untriaged_issues: { count: untriagedNumbers.length, oldest_open: untriagedNumbers.slice(0, 5) },
    workflow_observations: observations,
    degradations,
    crash_recovery: { verdict: crash.verdict, branches: crash.branches },
    urgent: {
      issues: urgentIssues,
      interruptibility: {
        unit: currentUnit?.id ?? null,
        phase: currentUnit ? (phases.get(currentUnit.id)?.current ?? null) : null,
        dirty: gitState.dirty,
        tasks_from_boundary: currentUnit ? (phases.get(currentUnit.id)?.remaining ?? null) : null,
      },
    },
  };

  const envelope = {
    skill: "workflow-status",
    state,
    summary: summarize(units, startable, designCandidates_, openPrs),
    unit: currentUnit
      ? { type: currentUnit.kind, id: currentUnit.id, issue: currentUnit.issue ?? null, branch: gitState.branch }
      : { type: "none", id: null, issue: null, branch: gitState.branch || null },
    phase: currentUnit
      ? { current: phases.get(currentUnit.id)?.current ?? null, total: phases.get(currentUnit.id)?.total ?? null, completed: phases.get(currentUnit.id)?.completed ?? null }
      : { current: null, total: null, completed: null },
    pr: currentUnit?.pr
      ? { number: currentUnit.pr.number, url: currentUnit.pr.url, state: prStateFor(currentUnit), head_sha: null, merge_ready: null, ci: null }
      : { number: null, url: null, state: "none", head_sha: null, merge_ready: null, ci: null },
    gates: {
      verification: null,
      review_pending: currentUnit ? (marks.get(currentUnit.id) ? !marks.get(currentUnit.id).current : null) : null,
      audit_pending: null,
    },
    findings: {
      fix_now: fixNow,
      issues_filed: [],
      untriaged: untriagedNumbers.length,
      decisions_recorded: 0,
    },
    blockers,
    dependencies: { unmet: dependencies.unmet, build_order: dependencies.buildOrder },
    recommendations: { product_audit: false, reason: null },
    needs_input: needsInput,
    next,
    detail,
  };

  return { envelope, schema, lastEnvelope };
}

function dependencyBuildOrder(unit, dependencies) {
  const order = [];
  const seen = new Set();
  const walk = (current) => {
    for (const depId of dependencies.directDeps(current)) {
      if (seen.has(depId)) continue;
      const dep = dependencies.byId?.get(depId);
      if (dep && dependencies.unmetFor(dep).length > 0) walk(dep);
      seen.add(depId);
      order.push(depId);
    }
  };
  walk(unit);
  order.push(unit.id);
  return order;
}

function ciOf(pr) {
  const rollup = pr.statusCheckRollup ?? [];
  if (!Array.isArray(rollup) || rollup.length === 0) return "none";
  if (rollup.some((check) => ["FAILURE", "ERROR", "CANCELLED"].includes(check.conclusion) || check.state === "FAILURE")) return "red";
  if (rollup.some((check) => ["PENDING", "IN_PROGRESS", "QUEUED"].includes(check.status) || check.state === "PENDING")) return "pending";
  return "green";
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { jsonOnly: false, lastEnvelope: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") return { help: true };
    if (token === "--version") return { version: true };
    if (token === "--json-only") { opts.jsonOnly = true; continue; }
    if (token === "--last-envelope") {
      const value = argv[i + 1];
      if (value === undefined) return { error: "--last-envelope requires a value" };
      opts.lastEnvelope = value;
      i += 1;
      continue;
    }
    return { error: `unknown flag: ${token}` };
  }
  return { opts };
}

async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (parsed.version) {
    const pkg = JSON.parse(readSensor("packages/agentic-workflow-schema/package.json") ?? "{}");
    process.stdout.write(`${pkg.version ?? "unknown"}\n`);
    return 0;
  }
  if (parsed.error) {
    process.stderr.write(`${parsed.error}\n\n${USAGE}`);
    return FATAL_EXIT_CODE;
  }

  const { envelope, schema } = await buildEnvelope({ lastEnvelope: parsed.opts.lastEnvelope });
  const validation = schema.validateEnvelope(envelope);
  if (!validation.ok) {
    process.stderr.write(`envelope self-check failed: ${(validation.errors ?? []).join("; ")}\n`);
  }
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
  return 0;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`workflow-status failed: ${error?.message ?? error}\n`);
    process.exitCode = FATAL_EXIT_CODE;
  });
}
