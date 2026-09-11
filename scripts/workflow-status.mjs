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

const USAGE = `Usage: node scripts/workflow-status.mjs [--json-only] [--last-envelope <json|path>]

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

/** `gh` in the sensed repository, bounded by the forge timeout. */
const gh = (...args) => run("gh", args, { timeout: FORGE_TIMEOUT_MS });

/** Read a file under the sensed repository, or null when absent. */
function readProject(rel) {
  const abs = path.join(PROJECT, rel);
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
  const field = (label) => text.match(new RegExp(`^\\s*${label}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? null;
  const declared = (field("Status") ?? "draft").toLowerCase();
  return {
    status: declared,
    snapshot_id: field("Snapshot") ?? field("Snapshot id"),
    source_revision: field("Source revision") ?? field("Source") ?? null,
  };
}

const NRS_BLOCKING = new Set(["missing", "draft", "contradicted", "resolved"]);

// ---------------------------------------------------------------------------
// Step 1 — Git state
// ---------------------------------------------------------------------------

function readGitState() {
  const branch = git("branch", "--show-current") ?? "";
  const porcelain = git("status", "--porcelain") ?? "";
  const fetch = run("git", ["fetch", "--quiet"]);
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
  if (!fetch.ok && !fetch.missing) {
    observations.push("git fetch did not complete (offline or no remote)");
  }
  return { branch, dirty: dirtyFiles.length > 0, dirtyFiles, ahead: ahead ? Number(ahead) : 0, observations, porcelain };
}

// ---------------------------------------------------------------------------
// Step 2 — Forge state
// ---------------------------------------------------------------------------

const FORGE_READS = {
  openPrs: ["pr", "list", "--state", "open", "--json", "number,title,headRefName,url,statusCheckRollup"],
  mergedPrs: ["pr", "list", "--state", "merged", "--limit", "20", "--json", "number,headRefName"],
  openIssues: ["issue", "list", "--state", "open", "--json", "number,title,labels"],
};

function readForgeState() {
  const observations = [];
  const readList = (key) => {
    const result = gh(...FORGE_READS[key]);
    if (!result.ok) {
      observations.push(`forge read '${key}' unavailable`);
      return { data: [], available: false };
    }
    try {
      return { data: JSON.parse(result.stdout), available: true };
    } catch {
      observations.push(`forge read '${key}' returned unparsable JSON`);
      return { data: [], available: false };
    }
  };
  const openPrs = readList("openPrs");
  const mergedPrs = readList("mergedPrs");
  const openIssues = readList("openIssues");
  return {
    openPrs: openPrs.data,
    mergedPrs: mergedPrs.data,
    openIssues: openIssues.data,
    observations,
    available: openPrs.available || mergedPrs.available || openIssues.available,
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

const cellsOf = (line) => line.split("|").map((cell) => cell.trim());

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

/** Merge detection: `done` + a PR the forge reports merged (open PRs are NOT met). */
function isMerged(unit, forge) {
  if (unit.status !== "done") return false;
  const openNumbers = new Set((forge.openPrs ?? []).map((pr) => pr.number));
  if (unit.pr && openNumbers.has(unit.pr.number)) return false;
  if (unit.pr) {
    const mergedNumbers = new Set((forge.mergedPrs ?? []).map((pr) => pr.number));
    return mergedNumbers.has(unit.pr.number);
  }
  return true;
}

const byNumber = (units) => {
  const map = new Map();
  for (const unit of units) {
    if (unit.kind === "feature") map.set(String(Number(unit.nn)), unit);
  }
  return map;
};

/** Step 5 — transitive dependency closure + substrate inconsistencies. */
function computeDependencies(units, forge) {
  const featureByNumber = byNumber(units);
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const merged = new Set(units.filter((unit) => isMerged(unit, forge)).map((unit) => unit.id));
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
  const args = ["verify", "--stage", stage, "--unit", unitId];
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

function unitDirFor(unit) {
  return unit.kind === "fix" ? `docs/fix/${unit.issue}-${unit.slug}` : `docs/features/${unit.id}`;
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
  const current = phases.find((phase) => {
    const section = tasks.split(new RegExp(`^##\\s+${phase}\\s+—`, "m"))[1]?.split(/^##\s+/m)[0] ?? "";
    return /^\s*-\s*\[ \]/m.test(section);
  }) ?? phases.at(-1);
  return { current, total: phases.length, completed: done };
}

/** Step 8 — the durable review mark's currency (ancestor + no later bound edit). */
function readReviewMark(unitDir) {
  const ledger = readProject(path.join(unitDir, "review-findings.md"));
  if (!ledger) return null;
  const mark = ledger.split("\n").find((line) => line.startsWith("| REVIEW-RAN"));
  if (!mark) return null;
  const sha = /HEAD ([0-9a-f]{40})/.exec(mark)?.[1] ?? null;
  if (!sha) return { sha: null, current: false };
  const ancestor = run("git", ["merge-base", "--is-ancestor", sha, "HEAD"]).ok;
  const later = git("log", "--oneline", `${sha}..HEAD`, "--", unitDir);
  return { sha, current: ancestor && (later ?? "") === "" };
}

/** Step 9 — unfold ledger projection. */
const STRONG_AXES = new Set(["security", "correctness", "logic", "architecture", "design", "concurrency"]);

function readFixNow(unitDir) {
  const ledger = readProject(path.join(unitDir, "review-findings.md"));
  if (!ledger) return [];
  const items = [];
  for (const line of ledger.split("\n")) {
    if (!line.startsWith("|") || line.startsWith("| id ") || line.startsWith("|---|") || line.startsWith("| ---")) continue;
    const cells = cellsOf(line).slice(1, -1);
    if (cells.length < 7) continue;
    const [id, file, axis, severity, klass, route, folded] = cells;
    if (/^id$/i.test(id) || folded === "yes" || folded === "—" || folded === "n/a") continue;
    const tier = severity === "high" || STRONG_AXES.has(axis) ? "strong" : "cheap";
    items.push({ id, file, axis, severity, class: klass, route, suggested_tier: tier });
  }
  return items;
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

function resolveNext({ nrs, state, startable, designCandidates, openPrs, untriaged, receiptRows }) {
  const alternatives = [];
  if (nrs && NRS_BLOCKING.has(nrs.status)) {
    const command = nrs.status === "contradicted"
      ? `/resolve-repository-state ${nrs.snapshot_id ?? "<id>"}`
      : "/discover-repository-state";
    return { recommended: command, alternatives, tier: tierFor(command) };
  }
  if (state === "BLOCKED" && receiptRows.length > 0) {
    const gate = receiptRows.find((row) => row.label !== "current");
    if (gate) {
      const command = gate.recommended;
      return { recommended: command, alternatives, tier: tierFor(command) };
    }
  }
  if (startable.length > 0) {
    const command = startable[0].next;
    for (const unit of startable.slice(1)) alternatives.push(unit.next);
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
    const dir = unitDirFor(unit);
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
  const forge = readForgeState();
  const roadmap = parseRoadmap(readProject("docs/features/ROADMAP.md"));
  const fixes = parseFixIndex(readProject("docs/fix/README.md"));
  const units = [...roadmap, ...fixes];
  const dependencies = computeDependencies(units, forge);

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
    if (!OPEN_STATES.has(unit.status)) continue;
    const dir = unitDirFor(unit);
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
      startable.push({ id: unit.id, next: recommendedFor("current", unit, stage) });
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
    const phase = readPhaseProgress(dir);
    if (phase) phases.set(unit.id, phase);
    const mark = readReviewMark(dir);
    if (mark) marks.set(unit.id, mark);
    fixNow.push(...readFixNow(dir));
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

  // Top-level state.
  let state = "OK";
  if (nrs && NRS_BLOCKING.has(nrs.status)) state = "BLOCKED";
  else if (dependencies.blockers.some((blocker) => blocker.scope === "run")) state = "BLOCKED";

  const designCandidates_ = designCandidates;
  const next = resolveNext({ nrs, state, startable, designCandidates: designCandidates_, openPrs, untriaged: { count: untriagedNumbers.length, oldest_open: untriagedNumbers.slice(0, 5) }, receiptRows });

  const currentUnit = units.find((unit) => {
    const branch = gitState.branch;
    return branch && (branch.endsWith(unit.id) || branch.includes(unit.id) || branch.includes(`/${unit.issue}-`));
  }) ?? null;

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
    urgent: {
      issues: urgentIssues,
      interruptibility: {
        unit: currentUnit?.id ?? null,
        phase: currentUnit ? (phases.get(currentUnit.id)?.current ?? null) : null,
        dirty: gitState.dirty,
        tasks_from_boundary: null,
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
      ? { number: currentUnit.pr.number, url: currentUnit.pr.url, state: "open", head_sha: null, merge_ready: null, ci: null }
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
    needs_input: null,
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
